import { Accent } from './Accent.js';

export class WaveSound {
    #counter = 0;
    isPlaying = true;
    audioContext = undefined;

    get counter() {
        return this.#counter;
    }

    stop() {
        this.isPlaying = false;
    }

    reset() {
        this.#counter = 0;
    }

    constructor(controller) {
        this.model = controller.model;
        this.controller = controller;
        this.audioContext = new AudioContext();

        if (Object.keys(this.model.soundSource).length > 0) {
            this.planNextBeat(this.audioContext.currentTime - this.model.delay);
        } else {
            this.model.loadAudioData(this.audioContext).then(() => {
                this.planNextBeat(
                    this.audioContext.currentTime - this.model.delay
                );
            });
        }
    }

    planNextBeat(t) {
        if (!this.isPlaying) return;

        const startTime = t + this.model.delay;
        const gainNode = new GainNode(this.audioContext);
        const beat = this.model.beats[this.counter]
            ? this.model.beats[this.counter]
            : this.model.beats[0];
        const source = new AudioBufferSourceNode(this.audioContext);
        const panNode = this.audioContext.createStereoPanner();
        const delay = this.audioContext.createDelay();
        const feedback = this.audioContext.createGain();

        panNode.pan.value = beat.accent === Accent.value.HIGH ? 0 : -1;
        panNode.pan.value =
            beat.accent === Accent.value.MEDIUM ? 1 : panNode.pan.value;

        source.buffer =
            this.model.soundSource[this.model.soundSet][beat.accent];
        source.counter = this.counter;
        source.startTime = startTime;

        source.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(this.audioContext.destination);

        let volume = this.model.volume;

        source.addEventListener('ended', this.onBeatEnd.bind(this));
        gainNode.gain.setValueAtTime(
            beat.accent === Accent.value.NONE ? 0 : volume,
            startTime
        );

        source.start(startTime);

        if (this.model.subdivisions > 1) {
            for (
                let i = beat.accent === Accent.value.NONE ? 0 : 1;
                i < this.model.subdivisions;
                i++
            ) {
                const subdivisionsStartTime =
                    startTime +
                    i * (this.model.delay / this.model.subdivisions);
                const subSource = new AudioBufferSourceNode(this.audioContext);
                const gainSubNode = new GainNode(this.audioContext);

                subSource.buffer =
                    this.model.soundSource[this.model.soundSet][
                        Accent.value.SUBDIV
                    ];
                subSource.counter = this.counter;
                subSource.subdivision = i;
                subSource.startTime = startTime;
                subSource.connect(gainSubNode);
                gainSubNode.connect(this.audioContext.destination);
                panNode.connect(this.audioContext.destination);

                subSource.addEventListener(
                    'ended',
                    this.onSubDivisionEnd.bind(this)
                );
                subSource.start(subdivisionsStartTime);

                const subVolume = i % 2 === 0 ? volume - 0.1 : volume - 0.2;

                gainSubNode.gain.setValueAtTime(
                    Math.max(subVolume, 0),
                    subdivisionsStartTime
                );
            }
        }
        this.increaseCounter();
    }

    onBeatEnd(event) {
        const startTime = event.target.startTime;

        this.controller.onBeatEnd(
            event.target.counter,
            this.audioContext.currentTime - startTime
        );
        this.planNextBeat(startTime);
    }

    onSubDivisionEnd(event) {
        setTimeout(() => {
            this.controller.onSubDivisionEnd(event.target.subdivision);
        }, event.target.startTime - this.audioContext.currentTime);
    }

    increaseCounter() {
        this.#counter++;
        if (this.#counter >= this.model.beats.length) {
            this.#counter = 0;
        }
    }
}
