import { Accent } from './Accent.js';

export class WaveSound {
    #counter = 0;
    audioContext = undefined;
    #nodes = [];

    get counter() {
        return this.#counter;
    }

    play() {
        this.model.isPlaying = true;

        if (Object.keys(this.model.soundSource).length > 0) {
            this.planNextBeat(this.audioContext.currentTime - this.model.delay);
        } else {
            this.model.loadAudioData(this.audioContext).then(() => {
                this.planNextBeat(this.audioContext.currentTime - this.model.delay);
            });
        }
    }

    stop() {
        const currentBeat = this.model.getCurrentBeat();

        this.#nodes.forEach((source) => {
            source.stop(this.audioContext.currentTime);
        });
        this.#counter = currentBeat.beat;
        this.model.isPlaying = false;
    }

    reset() {
        this.#counter = 0;
    }

    constructor(model) {
        this.model = model;
        this.audioContext = new AudioContext();
    }

    #getNodes(startTime, beatVolume, buffer, panning) {
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const panNode = this.audioContext.createStereoPanner();

        source.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(this.audioContext.destination);

        panNode.pan.value = panning;
        source.buffer = buffer;

        source.start(startTime);
        gainNode.gain.setValueAtTime(beatVolume, startTime);

        this.#nodes.push(source);

        return source;
    }
    #getPanning(accent) {
        switch (accent) {
            case Accent.value.HIGH:
                return 0;
            case Accent.value.MEDIUM:
                return 1;
            case Accent.value.LOW:
                return -1;
            default:
                return 0;
        }
    }

    planNextBeat(t) {
        if (!this.model.isPlaying) return;

        const startTime = t + this.model.delay;
        const beat = this.model.beats[this.counter] ? this.model.beats[this.counter] : this.model.beats[0];
        let counter = this.counter;
        const buffer = this.model.soundSource[this.model.soundSet][beat.accent];
        const beatVolume = beat.accent === Accent.value.NONE ? 0 : this.model.volume;
        let panning = this.#getPanning(beat.accent);
        const source = this.#getNodes(startTime, beatVolume, buffer, panning);

        source.addEventListener('ended', () => {
            this.#nodes = this.#nodes.filter((node) => node !== source);

            if (this.model.isPlaying) {
                this.model.setCurrentBeat(counter, 0);
            }
            this.planNextBeat(startTime);
        });

        if (this.model.subdivisions > 1) {
            for (let i = 0; i < this.model.subdivisions; i++) {
                const subdivisionsStartTime = startTime + i * (this.model.delay / this.model.subdivisions);
                const subVolume = i % 2 === 0 ? this.model.volume - 0.1 : this.model.volume - 0.2;
                const buffer = this.model.soundSource[this.model.soundSet][Accent.value.SUBDIV];
                const panning = i % 2 === 0 ? -0.3 : 0.3;
                const subBeatVolume = Math.max(subVolume, 0);
                const subSource = this.#getNodes(subdivisionsStartTime, subBeatVolume, buffer, panning);

                subSource.addEventListener('ended', () => {
                    this.#nodes = this.#nodes.filter((node) => node !== subSource);
                    if (this.model.isPlaying) {
                        this.model.setCurrentBeat(counter, i);
                    }
                });
            }
        }
        this.increaseCounter();
    }

    increaseCounter() {
        this.#counter = (this.#counter + 1) % this.model.beats.length;
    }
}
