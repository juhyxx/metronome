import { Accent } from './Accent.js';
import { DEFAULT_VOLUME, MAX_BEATS, SOUND_SETS, SUBDIVISIONS, TEMPO } from './config.js';
import { limit } from './utils/limit.js';
import { storage } from './utils/storage.js';

const { HIGH, MEDIUM, LOW } = Accent.value;

// Memory slots before anything is saved into them. MEM0 holds the current settings.
const presets = {
    MEM0: { beats: [HIGH, LOW, MEDIUM, LOW], soundSet: 'sticks', tempo: 120, subdivisions: 2 },
    MEM1: { beats: [HIGH, LOW, MEDIUM, LOW], soundSet: 'drums', tempo: 120, subdivisions: 4 },
    MEM2: { beats: [HIGH, LOW, LOW], soundSet: 'sticks', tempo: 110, subdivisions: 3 },
    MEM3: {
        beats: [HIGH, LOW, MEDIUM, LOW, MEDIUM, LOW, MEDIUM, LOW, HIGH],
        soundSet: 'sticks',
        tempo: 100,
        subdivisions: 8
    },
    MEM4: { beats: [HIGH, LOW, LOW, LOW], soundSet: 'beeps', tempo: 60, subdivisions: 6 }
};

// Properties kept in memory slots. Any change of them is saved to MEM0 right away.
const MEMORY_PROPERTIES = ['beats', 'tempo', 'subdivisions', 'soundSet'];

// Application state. Every change is announced by a `change` event with `{ property, value }` as detail.
export class Model extends EventTarget {
    #state = {
        beats: [HIGH, LOW, LOW, LOW],
        tempo: TEMPO.default,
        subdivisions: 1,
        soundSet: SOUND_SETS[0],
        volume: DEFAULT_VOLUME,
        isPlaying: false,
        position: { beat: 0, subBeat: 0 }
    };

    #isLoading = false;

    get beats() {
        return this.#state.beats;
    }
    set beats(value) {
        // accepts accents as well as { accent } objects, the format used in storage
        const beats = value
            .map((beat) => beat?.accent ?? beat)
            .filter((accent) => Accent.queue.includes(accent))
            .slice(0, MAX_BEATS);

        if (beats.length > 0) {
            this.#update('beats', beats);
        }
    }

    addBeat(accent = LOW) {
        if (this.beats.length < MAX_BEATS) {
            this.beats = [...this.beats, accent];
        }
    }

    removeBeat() {
        if (this.beats.length > 1) {
            this.beats = this.beats.slice(0, -1);
        }
    }

    get tempo() {
        return this.#state.tempo;
    }
    set tempo(value) {
        const tempo = parseInt(value, 10);
        if (Number.isFinite(tempo)) {
            this.#update('tempo', limit(tempo, TEMPO.min, TEMPO.max));
        }
    }

    // seconds between two beats
    get delay() {
        return 60 / this.tempo;
    }

    get subdivisions() {
        return this.#state.subdivisions;
    }
    set subdivisions(value) {
        const subdivisions = parseInt(value, 10);
        this.#update('subdivisions', SUBDIVISIONS.includes(subdivisions) ? subdivisions : 1);
    }

    get soundSet() {
        return this.#state.soundSet;
    }
    set soundSet(value) {
        if (SOUND_SETS.includes(value)) {
            this.#update('soundSet', value);
        }
    }

    get volume() {
        return this.#state.volume;
    }
    set volume(value) {
        const volume = parseInt(value, 10);
        if (Number.isFinite(volume)) {
            this.#update('volume', limit(volume, 0, 100));
        }
    }

    get isPlaying() {
        return this.#state.isPlaying;
    }
    set isPlaying(value) {
        this.#update('isPlaying', Boolean(value));
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
    }

    // beat and subdivision being heard right now, both zero based
    get position() {
        return this.#state.position;
    }
    set position(value) {
        this.#update('position', value);
    }

    save(slot = 0) {
        const { beats, tempo, subdivisions, soundSet } = this.#state;
        storage.set(`MEM${slot}`, { beats: beats.map((accent) => ({ accent })), tempo, subdivisions, soundSet });
    }

    load(slot = 0) {
        const key = `MEM${slot}`;
        const data = storage.get(key) || presets[key];
        if (!data) return;

        this.#isLoading = true;
        try {
            this.beats = Array.isArray(data.beats) ? data.beats : [];
            this.tempo = data.tempo;
            this.subdivisions = data.subdivisions;
            this.soundSet = data.soundSet;
            this.position = { beat: 0, subBeat: 0 };
        } finally {
            this.#isLoading = false;
        }
        this.save();
        this.dispatchEvent(new CustomEvent('load', { detail: { slot } }));
    }

    // settings of the previous session
    restore() {
        this.volume = storage.get('volume') ?? DEFAULT_VOLUME;
        this.load(0);
    }

    #update(property, value) {
        if (this.#state[property] === value) return;

        this.#state[property] = value;
        this.dispatchEvent(new CustomEvent('change', { detail: { property, value } }));

        if (property === 'volume') {
            storage.set('volume', value);
        }
        if (MEMORY_PROPERTIES.includes(property) && !this.#isLoading) {
            this.save();
        }
    }
}
