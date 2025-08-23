export class Controller {
    #model = undefined;
    #volume = undefined;
    #subdivisions = undefined;
    #sound = undefined;
    #memoryManager = undefined;
    #removeButton = undefined;
    #tempo = undefined;
    #beats = undefined;
    #wakeLock = undefined;
    #monitor = undefined;

    get model() {
        return this.#model;
    }

    constructor(model) {
        this.#model = model;
        this.#volume = document.querySelector('volume-selector');
        this.#sound = document.querySelector('sound-selector');
        this.#subdivisions = document.querySelector('subdivisions-selector');
        this.#memoryManager = document.querySelector('mem-manager');
        this.#removeButton = document.querySelector('#remove');
        this.#tempo = document.querySelector('tempo-selector');
        this.#beats = document.querySelector('beat-selector');
        this.#monitor = document.querySelector('beat-monitor');

        this.#sound.setAttribute('sound', this.model.soundSet);
        this.#tempo.setAttribute('tempo', this.model.tempo);
        this.#tempo.setAttribute('min', this.model.minTempo);
        this.#tempo.setAttribute('max', this.model.maxTempo);
        this.#beats.setAttribute('sub-divisions', this.model.subdivisions);
        this.#subdivisions.setAttribute('division', this.model.subdivisions);
        this.#volume.setAttribute('volume', '80');
        this.#monitor.counter = 1;
        this.#monitor.subCounter = 1;

        this.#addBeatSelectorListeners();
        this.#addEventListeners();
        this.#addTempoSelectors();
    }

    #addBeatSelectorListeners() {
        this.#beats.addEventListener('select', (event) => {
            const beats = [...this.#model.beats];
            beats[parseInt(event.detail.index, 10)].accent = event.detail.accent;
            this.#model.beats = beats;
        });
        this.#beats.addEventListener('add', (event) => {
            const beats = [...this.#model.beats];
            beats.push({ accent: event.detail.accent });
            this.#model.beats = beats;
        });
        this.#beats.addEventListener('remove', (event) => {
            const beats = [...this.#model.beats];
            beats.pop();
            this.#model.beats = beats;
        });
    }
    #addTempoSelectors() {
        this.#tempo.addEventListener('change', (event) => {
            this.model.tempo = event.detail;
        });
        this.#tempo.addEventListener('onPlay', (event) => {
            this.model.togglePlay();
        });
        document.querySelector('#tempo').addEventListener('change', (event) => {
            this.#tempo.setAttribute('tempo', parseInt(document.querySelector('#tempo').value, 10));
        });
        document.querySelector('tap-tempo').addEventListener('change', (event) => {
            this.model.tempo = event.detail.tempo;
            this.#tempo.setAttribute('tempo', this.model.tempo);
        });
    }

    #addEventListeners() {
        // Add/remove beats
        document.querySelector('#add').addEventListener('click', (event) => {
            this.#beats.addBeat();
            this.#removeButton.classList.remove('disabled');
            if (this.model.beats.length === this.model.maxBeats) {
                event.target.classList.add('disabled');
            }
        });
        this.#removeButton.addEventListener('click', (event) => {
            this.#beats.removeBeat();
            document.querySelector('#add').classList.remove('disabled');
            if (this.model.beats.length === 1) {
                event.target.classList.add('disabled');
            }
        });

        // Memory Manager
        this.#memoryManager.addEventListener('load', (event) => {
            this.model.deserialize(event.detail.memory);
            this.#monitor.subdivision = this.model.subdivisions;
            this.#subdivisions.setAttribute('division', this.model.subdivisions);
            this.#sound.setAttribute('sound', this.model.soundSet);
            this.#tempo.setAttribute('tempo', this.model.tempo);
        });
        this.#memoryManager.addEventListener('save', (event) => {
            this.model.serialize(event.detail.memory);
        });

        //other
        this.#sound.addEventListener('select', (event) => {
            this.model.soundSet = event.detail.sound;
        });
        this.#volume.addEventListener('change', (event) => {
            this.model.volume = parseInt(event.target.value, 10);
        });
        this.#subdivisions.addEventListener('select', (event) => {
            this.model.subdivisions = event.detail.subdivision;
        });
        document.querySelector('#help-trigger').addEventListener(
            'mousedown',
            (event) => {
                document.body.classList.toggle('help');
            },
            { passive: true }
        );
    }

    updateProperty(property, value) {
        switch (property) {
            case 'sub-divisions':
                this.#beats.setAttribute('sub-divisions', value);
                this.#subdivisions.setAttribute('division', value);
                break;
            case 'tempo':
                document.querySelector('#tempo').value = value;
                break;
            case 'sound-set':
                this.#sound.setAttribute('sound', value);
                break;
            case 'beats':
                this.#beats.clear();
                value.forEach((item) => this.#beats.addBeat(item.accent, true));
                break;
            case 'play':
                value == true ? this.lock() : this.unlock();
                break;
            case 'current-beat':
                this.#beats.beat = value.beat;
                this.#beats.subBeat = value.subBeat;
                this.#monitor.counter = value.beat;
                this.#monitor.subCounter = value.subBeat;
                break;
        }
    }

    async lock() {
        try {
            this.#wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {}
    }

    unlock() {
        if (this.#wakeLock) {
            this.#wakeLock.release().then(() => (this.wakeLock = null));
        }
    }
}
