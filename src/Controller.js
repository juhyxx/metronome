import { MAX_BEATS, TEMPO } from './config.js';

// Wires the UI to the model: user input changes the model, model changes are rendered.
export class Controller {
    #model;
    #view;
    #wakeLock = null;

    constructor(model) {
        this.#model = model;
        this.#view = {
            root: document.querySelector('#metronome'),
            tempo: document.querySelector('tempo-selector'),
            tempoInput: document.querySelector('#tempo'),
            tapTempo: document.querySelector('tap-tempo'),
            beats: document.querySelector('beat-selector'),
            monitor: document.querySelector('beat-monitor'),
            subdivisions: document.querySelector('subdivisions-selector'),
            sound: document.querySelector('sound-selector'),
            volume: document.querySelector('volume-selector'),
            volumeValue: document.querySelector('#volume-value'),
            memory: document.querySelector('mem-manager'),
            addBeat: document.querySelector('#add-beat'),
            removeBeat: document.querySelector('#remove-beat'),
            help: document.querySelector('#help'),
            helpTrigger: document.querySelector('#help-trigger')
        };
        this.#view.tempoInput.min = TEMPO.min;
        this.#view.tempoInput.max = TEMPO.max;

        this.#addViewListeners();
        this.#addKeyboardListeners();

        model.addEventListener('change', ({ detail }) => this.#render(detail.property, detail.value));
        ['beats', 'tempo', 'subdivisions', 'soundSet', 'volume', 'isPlaying', 'position'].forEach((property) =>
            this.#render(property, model[property])
        );
    }

    #addViewListeners() {
        const model = this.#model;
        const view = this.#view;
        const bind = (element, property) => {
            element.addEventListener('change', (event) => (model[property] = event.detail.value));
        };

        bind(view.tempo, 'tempo');
        bind(view.tapTempo, 'tempo');
        bind(view.beats, 'beats');
        bind(view.subdivisions, 'subdivisions');
        bind(view.sound, 'soundSet');
        bind(view.volume, 'volume');

        view.tempo.addEventListener('toggle', () => model.togglePlay());
        view.tempoInput.addEventListener('change', () => {
            model.tempo = view.tempoInput.value;
            view.tempoInput.value = model.tempo; // shows the clamped value even when the model did not change
        });
        view.addBeat.addEventListener('click', () => model.addBeat());
        view.removeBeat.addEventListener('click', () => model.removeBeat());
        view.memory.addEventListener('load', (event) => model.load(event.detail.slot));
        view.memory.addEventListener('save', (event) => model.save(event.detail.slot));
        view.helpTrigger.addEventListener('click', () => document.body.classList.toggle('help'));
        view.help.addEventListener('click', () => document.body.classList.remove('help'));
    }

    #addKeyboardListeners() {
        const model = this.#model;

        document.addEventListener('keydown', (event) => {
            if (event.target instanceof HTMLInputElement) {
                if (event.code === 'Enter') {
                    event.target.blur(); // commits the value and gives the shortcuts back
                }
                return;
            }

            switch (event.code) {
                case 'Space':
                case 'Enter':
                    if (!event.repeat) {
                        model.togglePlay();
                    }
                    break;
                case 'ArrowUp':
                    model.tempo = model.tempo + (event.altKey ? 10 : 1);
                    break;
                case 'ArrowDown':
                    model.tempo = model.tempo - (event.altKey ? 10 : 1);
                    break;
                case 'Escape':
                    document.body.classList.remove('help');
                    break;
                default:
                    return;
            }
            event.preventDefault();
        });
    }

    #render(property, value) {
        const view = this.#view;

        switch (property) {
            case 'beats':
                view.beats.beats = value;
                view.addBeat.classList.toggle('disabled', value.length >= MAX_BEATS);
                view.removeBeat.classList.toggle('disabled', value.length <= 1);
                break;
            case 'tempo':
                view.tempo.value = value;
                view.tempoInput.value = value;
                break;
            case 'subdivisions':
                view.subdivisions.value = value;
                view.beats.subdivisions = value;
                break;
            case 'soundSet':
                view.sound.value = value;
                break;
            case 'volume':
                view.volume.value = value;
                view.volumeValue.textContent = value;
                break;
            case 'isPlaying':
                view.root.classList.toggle('playing', value);
                value ? this.#lockScreen() : this.#releaseScreen();
                break;
            case 'position':
                view.beats.position = value;
                view.monitor.position = value;
                break;
        }
    }

    async #lockScreen() {
        try {
            this.#wakeLock = await navigator.wakeLock.request('screen');
        } catch {
            // wake lock is not supported or not allowed
        }
    }

    #releaseScreen() {
        this.#wakeLock?.release();
        this.#wakeLock = null;
    }
}
