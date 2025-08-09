import { WaveSound } from "./sound.js";
import { Accent } from "./accent.js";
import { wait } from "./utils/wait.js";

export class Controller {
    #model = undefined;
    #beatSelector = undefined;
    #volume = undefined;
    #subdivisionsSelector = undefined;
    #soundSelector = undefined;
    #memoryManager = undefined;
    #removeButton = undefined;
    #tempoSelector = undefined;

    get model() {
        return this.#model;
    }

    constructor(model) {
        this.#model = model;
        this.#beatSelector = document.querySelector('#selector');
        this.#volume = document.querySelector('volume-selector');
        this.#soundSelector = document.querySelector('sound-selector');
        this.#subdivisionsSelector = document.querySelector('subdivisions-selector');
        this.#memoryManager = document.querySelector('mem-manager');
        this.#removeButton = document.querySelector('#remove');
        this.#tempoSelector = document.querySelector('tempo-selector');

        this.#soundSelector.setAttribute("sound", this.model.soundSet);
        this.#subdivisionsSelector.setAttribute("division", this.model.subdivisions);
        this.#tempoSelector.setAttribute("tempo", this.model.tempo);
        this.#tempoSelector.setAttribute("min", this.model.minTempo);
        this.#tempoSelector.setAttribute("max", this.model.maxTempo);

        document.querySelector('volume-selector').setAttribute("volume", "80");
        document.querySelector('#counter').innerHTML = this.model.beats.length;
        document.querySelector('#subcounter').innerHTML = this.model.subdivisions;

        this.renderBeatSelector(this.model.beats);
        this.#addEventListeners();
    }

    #addEventListeners() {
        this.#tempoSelector.addEventListener('change', (event) => {
            this.model.tempo = event.detail;
        });
        this.#tempoSelector.addEventListener('onPlay', (event) => {
            if (this.model.sound) {
                this.model.sound.stop();
                this.model.sound = undefined;
            } else {
                this.model.sound = new WaveSound(this);
            }
        });
        document.querySelector('#tempo').addEventListener('change', (event) => {
            this.#tempoSelector.setAttribute("tempo", parseInt(document.querySelector('#tempo').value, 10));
        });

        this.#beatSelector.addEventListener('refresh', (event) => {
            this.renderBeatSelector(event.detail.beats);
        });

        document.querySelector('#add').addEventListener('click', (event) => {
            this.model.addBeat();
            this.#removeButton.classList.remove('disabled');
            if (this.model.beats.length === this.model.maxBeats) {
                event.target.classList.add('disabled');
            }
        });
        this.#removeButton.addEventListener('click', (event) => {
            this.model.removeBeat();
            document.querySelector('#add').classList.remove('disabled');
            if (this.model.beats.length === 1) {
                event.target.classList.add('disabled');
            }
        });
        document.querySelector('tap-tempo').addEventListener('change', (event) => {
            this.model.tempo = event.detail.tempo;
        });
        this.#memoryManager.addEventListener('load', (event) => {
            this.model.deserialize(event.detail.memory);
            this.#soundSelector.setAttribute("sound", this.model.soundSet);
            document.querySelector('#subcounter').innerHTML = this.model.subdivisions;
            this.#subdivisionsSelector.setAttribute("division", this.model.subdivisions);
            this.#tempoSelector.setAttribute("tempo", this.model.tempo);
        });
        this.#memoryManager.addEventListener('save', (event) => {
            this.model.serialize(event.detail.memory);
        });

        this.#soundSelector.addEventListener('select', (event) => {
            this.model.soundSet = event.detail.sound;
        });
        this.#volume.addEventListener('change', (event) => {
            this.model.volume = parseInt(event.target.value, 10);
        });
        this.#subdivisionsSelector.addEventListener('select', (event) => {
            this.model.subdivisions = event.detail.subdivision;
        });
        document.querySelector('#help-trigger').addEventListener('mousedown', (event) => {
            document.body.classList.toggle('help');
        }, { passive: true });
    }

    renderBeatSelector(beats) {
        document.querySelector('#counter').innerHTML = beats.length;
        this.#beatSelector.innerHTML = '';
        beats.forEach((item, index) => {
            const el = document.createElement('div');
            const els = Array(3).fill(null).map((item, i) => {
                const subEl = document.createElement('div');
                if (i === 0) {
                    subEl.innerHTML = index + 1;
                }
                return subEl;
            });

            const elSubDivContainer = document.createElement('div');
            elSubDivContainer.className = 'subdivisions';
            const elSubDiv = Array(this.model.subdivisions).fill(null).map((item, i) => {
                return document.createElement('div');
            });
            elSubDivContainer.append(...elSubDiv);
            els.push(elSubDivContainer);
            el.append(...els);
            el.setAttribute('accent', beats[index].accent);
            el.addEventListener('click', (event) => {
                const el = event.target.closest('div[accent]');
                this.model.setAccentAt(Accent.next(el.getAttribute('accent')), index);
            });
            this.#beatSelector.appendChild(el);
        });
    }

    updateProperty(property, value) {
        switch (property) {
            case 'beats':
                document.querySelector('#selector').dispatchEvent(new CustomEvent('refresh', { detail: { beats: value } }));
                break;
            case 'subdivisions':
                document.querySelector('#selector').dispatchEvent(new CustomEvent('refresh', { detail: { beats: value } }));
                break;
            case "tempo":
                document.querySelector('#tempo').value = value;
        }
    }

    async moveHighlight(counter, waitingTime) {
        await wait(waitingTime);

        const selector = document.querySelector('#selector');
        selector.querySelector('#selector>div.highlight')?.classList.remove('highlight');
        const elToSelect = document.querySelector(`#selector >div:nth-child(${counter + 1})`);
        if (elToSelect) {
            elToSelect.classList.add('highlight');
            elToSelect.querySelectorAll('.subdivisions >div').forEach(el => {
                el.classList.remove('highlight');
            });
            elToSelect.querySelector('.subdivisions >div:nth-child(1)').classList = 'highlight';
        }
        document.querySelector('#counter').innerHTML = counter + 1;
        document.querySelector('#subcounter').innerHTML = 1;
    }

}