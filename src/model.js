import { Accent } from "./accent.js";
import { limit } from "./utils/limit.js";

const memoryDefaults = {
    "memory0": { "beats": [{ "accent": "high" }, { "accent": "low" }, { "accent": "medium" }, { "accent": "low" }], "soundSet": "drums", "tempo": 120, "subdivisions": 2 },
    "memory1": { "beats": [{ "accent": "high" }, { "accent": "low" }], "soundSet": "sticks", "tempo": 110, "subdivisions": 2 },
    "memory2": { "beats": [{ "accent": "high" }, { "accent": "low" }, { "accent": "medium" }, { "accent": "low" }, { "accent": "medium" }, { "accent": "low" }, { "accent": "low" }], "soundSet": "sticks", "tempo": 50, "subdivisions": 6 },
    "memory3": { "beats": [{ "accent": "high" }, { "accent": "low" }, { "accent": "low" }, { "accent": "low" }], "soundSet": "beeps", "tempo": 60, "subdivisions": 6 }
}

export class Model {
    #tempo = 120;
    #minTempo = 40;
    #maxTempo = 300;
    #subdivisions = 1;
    #volume = 0.8;
    #delay = 0.5;
    #wakeLock = undefined;
    #sound = undefined;
    #maxBeats = 9;
    #soundSet = 'sticks';
    #propsToSerialize = ['subdivisions', 'tempo', 'soundSet', 'beats'];
    #beats = [{
        accent: Accent.value.HIGH
    }, {
        accent: Accent.value.LOW
    }, {
        accent: Accent.value.MEDIUM
    }, {
        accent: Accent.value.LOW
    }];
    #propertyChangedCallback = (property, value) => { };

    soundSource = {};
    soundSets = ['sticks', 'drums', 'metronome', 'beeps'];
    soundSources = {
        [Accent.value.HIGH]: 'high',
        [Accent.value.MEDIUM]: 'medium',
        [Accent.value.LOW]: 'low',
        [Accent.value.NONE]: 'low',
        [Accent.value.SUBDIV]: 'subdiv'
    };

    set propertyChangedCallback(callback) {
        this.#propertyChangedCallback = callback;
    }

    get beats() { return this.#beats; }
    set beats(data) { this.#beats = data; this.serialize(); }

    get maxBeats() { return this.#maxBeats; }

    get subdivisions() { return this.#subdivisions; }
    set subdivisions(value) {
        this.#subdivisions = value;
        this.#propertyChangedCallback('subdivisions', this.#beats);
        this.serialize();
    }

    get soundSet() { return this.#soundSet; }
    set soundSet(value) { this.#soundSet = value; this.serialize(); }

    set sound(item) { this.#sound = item; }
    get sound() { return this.#sound; }

    get maxTempo() { return this.#maxTempo; }
    get minTempo() { return this.#minTempo; }

    get volumePercentage() { return Math.round((this.#volume + 1) / 0.02); }
    get volume() { return this.#volume; }
    set volume(value) { this.#volume = (limit(value, 10, 100) * 0.02); this.serialize(); }

    get tempo() { return this.#tempo; }

    set tempo(value) {
        this.#tempo = limit(value, this.#minTempo, this.#maxTempo);
        this.#delay = 60 / this.tempo;
        this.#propertyChangedCallback('tempo', this.#tempo);

        this.serialize();
    }



    get delay() { return this.#delay; }

    async loadAudioData(audioContext) {
        for (const soundSet of Object.values(this.soundSets)) {
            for (const item of Object.entries(this.soundSources)) {
                const rsvp = await fetch(`sounds/${soundSet}/${item[1]}.wav`);
                if (audioContext) {
                    const buff = await rsvp.arrayBuffer();
                    this.soundSource[soundSet] = this.soundSource[soundSet] || {};
                    this.soundSource[soundSet][item[0]] = await audioContext.decodeAudioData(buff);
                }
            }
        }
    }

    setAccentAt(accent, index) {
        this.#beats[index].accent = accent;
        this.#propertyChangedCallback('beats', this.#beats);
        this.serialize();
    }

    async lock() {
        try {
            this.#wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) { }
    }

    unlock() {
        if (this.#wakeLock) {
            this.#wakeLock.release().then(() => (this.wakeLock = null));
        }
    }

    addBeat() {
        const count = Math.min(this.#beats.length + 1, this.maxBeats);
        this.beats = Array(count).fill('').map((item, i) => this.#beats[i] ? this.#beats[i] : { accent: Accent.value.LOW });
        this.#propertyChangedCallback('beats', this.#beats);
        this.serialize();
    }

    removeBeat() {
        if (this.#beats.length > 1) {
            this.#beats.pop();
            this.#propertyChangedCallback('beats', this.#beats);
        }
        this.serialize();
    }

    serialize(memory = "default") {
        const data = this.#propsToSerialize.reduce((prev, item) => Object.assign({ [item]: this[item] }, prev), {});
        localStorage.setItem(memory === "default" ? 'metronome' : 'memory' + memory, JSON.stringify(data));
    }

    deserialize(memory = "default") {
        try {
            const key = memory === "default" ? 'metronome' : 'memory' + memory;
            const data = JSON.parse(localStorage.getItem(key)) || memoryDefaults[key];
            if (data) Object.keys(data).forEach(item => (this[item] = data[item]));
        } catch { }
    }

    constructor() {
        this.deserialize();
    }


}
