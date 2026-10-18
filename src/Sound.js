import { Accent } from './Accent.js';
import { SOUND_SETS } from './config.js';

const { HIGH, MEDIUM, LOW, NONE } = Accent.value;

const SAMPLES = ['high', 'medium', 'low', 'subdiv'];

// silent beats still play a (muted) sample, its `ended` event drives the scheduling
const SAMPLE_FOR_ACCENT = { [HIGH]: 'high', [MEDIUM]: 'medium', [LOW]: 'low', [NONE]: 'low' };
const PANNING = { [HIGH]: 0, [MEDIUM]: 1, [LOW]: -1 };

// subdivision clicks alternate between these values (relative to the beat)
const SUBDIVISION_GAIN = [0.85, 0.7];
const SUBDIVISION_PANNING = [-0.3, 0.3];

const START_DELAY = 0.05; // s, so the first beat is not cut off

function fetchSamples() {
    return Promise.all(
        SOUND_SETS.flatMap((soundSet) =>
            SAMPLES.map(async (sample) => {
                const response = await fetch(`sounds/${soundSet}/${sample}.wav`);
                return { soundSet, sample, data: await response.arrayBuffer() };
            })
        )
    );
}

// Plays the beats of the model and reports which one is heard through `model.position`.
export class WaveSound {
    #model;
    #context = null;
    #output = null; // master gain, follows the model volume
    #downloads; // raw samples, fetched right away so the first start is fast
    #buffers = null; // decoded samples: { [soundSet]: { [sample]: AudioBuffer } }
    #sources = new Set();
    #counter = 0;
    #run = 0; // bumped on every start and stop, callbacks of older runs are ignored

    constructor(model) {
        this.#model = model;
        this.#downloads = fetchSamples();
        this.#downloads.catch(() => {}); // reported when playback starts

        model.addEventListener('change', ({ detail: { property, value } }) => {
            if (property === 'isPlaying') {
                value ? this.#start() : this.#stop();
            }
            if (property === 'volume') {
                this.#applyVolume();
            }
        });
        model.addEventListener('load', () => (this.#counter = 0));
    }

    async #start() {
        const run = ++this.#run;

        // created on the first start, which comes from a user gesture as browsers require
        if (!this.#context) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.#context = new AudioContextClass();
            this.#output = this.#context.createGain();
            this.#output.connect(this.#context.destination);
            this.#applyVolume();
        }

        try {
            await this.#context.resume();
            this.#buffers = this.#buffers || this.#decode();
            const buffers = await this.#buffers;
            if (run !== this.#run) return; // stopped while loading

            this.#scheduleBeat(buffers, this.#context.currentTime + START_DELAY, run);
        } catch (error) {
            console.error('Metronome sounds could not be loaded', error);
            this.#downloads = fetchSamples();
            this.#buffers = null;
            this.#model.isPlaying = false;
        }
    }

    #stop() {
        this.#run++;
        this.#sources.forEach((source) => source.stop());
        this.#sources.clear();
        // the next start continues with the beat that was playing
        this.#counter = this.#model.position.beat;
    }

    async #decode() {
        const files = await this.#downloads;
        const buffers = {};

        await Promise.all(
            files.map(async ({ soundSet, sample, data }) => {
                buffers[soundSet] = buffers[soundSet] || {};
                buffers[soundSet][sample] = await this.#context.decodeAudioData(data);
            })
        );
        return buffers;
    }

    #applyVolume() {
        if (!this.#output) return;

        const gain = (this.#model.volume / 100) ** 2; // perceived loudness is closer to quadratic
        this.#output.gain.setTargetAtTime(gain, this.#context.currentTime, 0.02);
    }

    #scheduleBeat(buffers, time, run) {
        const model = this.#model;
        const beat = this.#counter < model.beats.length ? this.#counter : 0;
        const accent = model.beats[beat];
        const samples = buffers[model.soundSet];
        const delay = model.delay;
        const subdivisions = model.subdivisions;

        const source = this.#play(samples[SAMPLE_FOR_ACCENT[accent]], time, accent === NONE ? 0 : 1, PANNING[accent]);
        // `ended` comes right after the short sample, long before the next beat, and keeps firing in background tabs
        source.addEventListener('ended', () => {
            if (run === this.#run) {
                this.#scheduleBeat(buffers, time + delay, run);
            }
        });
        this.#showPosition(time, { beat, subBeat: 0 }, run);

        if (subdivisions > 1) {
            for (let i = 0; i < subdivisions; i++) {
                const subTime = time + (i * delay) / subdivisions;
                this.#play(samples.subdiv, subTime, SUBDIVISION_GAIN[i % 2], SUBDIVISION_PANNING[i % 2]);
                if (i > 0) {
                    this.#showPosition(subTime, { beat, subBeat: i }, run);
                }
            }
        }
        this.#counter = (beat + 1) % model.beats.length;
    }

    #play(buffer, time, gain, pan = 0) {
        const source = this.#context.createBufferSource();
        const gainNode = this.#context.createGain();
        const panNode = this.#context.createStereoPanner();

        source.buffer = buffer;
        gainNode.gain.value = gain;
        panNode.pan.value = pan;
        source.connect(gainNode).connect(panNode).connect(this.#output);
        source.addEventListener('ended', () => this.#sources.delete(source));
        source.start(time);
        this.#sources.add(source);

        return source;
    }

    // updates the model once the sound at `time` is actually heard
    #showPosition(time, position, run) {
        const latency = this.#context.outputLatency || 0;
        const wait = (time + latency - this.#context.currentTime) * 1000;

        setTimeout(() => {
            if (run === this.#run) {
                this.#model.position = position;
            }
        }, Math.max(wait, 0));
    }
}
