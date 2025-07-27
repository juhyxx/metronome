import { WaveSound } from "./sound.js";
import { Accent } from "./accent.js";

async function wait(interval) {
    const until = Date.now() + interval;

    while (Date.now() <= until) { }
}

export class Controller {
    #model = undefined;
    #beatSelector = undefined;
    #volume = undefined;
    #dndY = undefined;
    #subdivisionsSelector = undefined;
    #soundSelector = undefined;
    #memoryManager = undefined;
    #removeButton = undefined;

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

        this.#soundSelector.setAttribute("sound", this.model.soundSet);
        this.#subdivisionsSelector.setAttribute("division", this.model.subdivisions);
        document.querySelector('volume-selector').setAttribute("volume", "80")

        this.#beatSelector.addEventListener('refresh', (event) => {
            this.renderBeatSelector(event.detail.beats);
            document.querySelector('#play').setAttribute('beats', event.detail.beats.length);
        });

        document.querySelector('#counter').innerHTML = this.model.beats.length;
        document.querySelector('#subcounter').innerHTML = this.model.subdivisions;

        document.querySelector('#add').addEventListener('click', (event) => {
            this.model.addBeat();
            this.#removeButton.classList.remove('disabled');
            if (this.model.beats.length === this.model.maxBeats) {
                event.target.classList.add('disabled');
            }
        });
        this.#removeButton.addEventListener('click', (event) => {
            model.removeBeat();
            document.querySelector('#add').classList.remove('disabled');
            if (this.model.beats.length === 1) {
                event.target.classList.add('disabled');
            }
        });

        document.querySelector('tap-tempo').addEventListener('change', (event) => {
            this.setTempo(event.detail.tempo);
        });
        this.#memoryManager.addEventListener('load', (event) => {
            this.model.deserialize(event.detail.memory);
            this.#soundSelector.setAttribute("sound", this.model.soundSet);
            document.querySelector('#subcounter').innerHTML = this.model.subdivisions;
            this.#subdivisionsSelector.setAttribute("division", this.model.subdivisions);
        });
        this.#memoryManager.addEventListener('save', (event) => {
            this.model.serialize(event.detail.memory);
        });
        document.querySelector('#tempo').addEventListener('change', (event) => {
            this.setTempo(parseInt(event.target.value, 10));
        });

        this.#soundSelector.addEventListener('select', (event) => {
            this.model.soundSet = event.detail.sound;
        });
        this.renderTempoSelector();
        this.renderBeatSelector(this.model.beats);
        this.#volume.addEventListener('change', (event) => {
            this.model.volume = parseInt(event.target.value, 10);
        });
        this.#subdivisionsSelector.addEventListener('select', (event) => {
            this.model.subdivisions = event.detail.subdivision;
        });
        this.setTempo(this.model.tempo);
    }

    setTempo(tempo) {
        this.model.tempo = tempo;
        document.querySelector('#tempo-name').innerHTML = this.model.tempoName;
        document.querySelector('#tempo').value = this.model.tempo;
        document.querySelector('#play').style.animationDuration = (4 * 60 / this.model.tempo) + 's';
        document.querySelector('#wheel #tempo-value').innerHTML = this.model.tempo;
        document.querySelectorAll('#tempo-knob-inner .value').forEach(el => el.classList.remove('highlight'));

        const tempoRound = Math.round(Math.round(this.model.tempo / 10) * 10);
        const el = [...document.querySelectorAll('#tempo-knob-inner .value')].find(el => parseInt(el.dataset.tempo, 10) === tempoRound);
        if (el) {
            el.classList.add('highlight');
        }
    }

    renderTempoSelector() {
        const rangeAngle = 50;
        const range = ((this.model.maxTempo - this.model.minTempo) / 10);
        const angleSize = (180 + 2 * rangeAngle) / range;
        const subElClick = function (event) {
            this.setTempo(parseInt(event.target.dataset.tempo, 10));
        }.bind(this);

        for (let i = 0; i <= range; i++) {
            const el = document.createElement('div');
            const subEl = document.createElement('div');
            const angle = (i * angleSize) - rangeAngle;
            const tempo2select = (i * 10) + this.model.minTempo;

            el.className = 'value-container';
            subEl.className = 'value';
            subEl.dataset.tempo = tempo2select;

            subEl.addEventListener('click', subElClick);
            subEl.addEventListener('touchstart', subElClick);
            el.style.transform = `rotate(${angle}deg)`;
            el.append(subEl);
            document.querySelector('#tempo-knob-inner').appendChild(el);
        }
        document.querySelector('#tempo-knob').addEventListener('wheel', (event) => {
            const difference = event.ctrlKey ? 1 : 10;
            const tempo = event.ctrlKey ? model.tempo : Math.round(Math.round(this.model.tempo / 10) * 10);

            this.setTempo((event.deltaY > 0) ? tempo + difference : tempo - difference);
            event.preventDefault();
        });
        document.querySelector('#wheel').addEventListener('click', () => {
            document.body.classList.toggle('is-playing');
            if (this.model.sound) {
                this.model.sound.stop();
                this.model.sound = undefined;
            } else {
                this.model.sound = new WaveSound(this);
            }
        });
        document.addEventListener('keydown', (event) => {
            document.body.classList.remove('help');
            if (event.code === 'Space' || event.code === 'Enter') {
                document.body.classList.toggle('is-playing');
                if (this.model.sound) {
                    this.model.sound.stop();
                    this.model.sound = undefined;
                } else {
                    this.model.sound = new WaveSound(this);
                }
            }
            if (event.code === 'ArrowUp') {
                this.setTempo(model.tempo + (event.altKey ? 10 : 1));
            }
            if (event.code === 'ArrowDown') {
                this.setTempo(model.tempo - (event.altKey ? 10 : 1));
            }
        });
        document.querySelector('#help-trigger').addEventListener('mousedown', (event) => {
            document.body.classList.toggle('help');
        }, { passive: true });
        document.querySelector('#wheel').addEventListener('mousedown', (event) => {
            document.body.classList.add('dnd');
            this.#dndY = event.clientY;
        }, { passive: true });
        document.body.addEventListener('mousemove', (event) => {
            if (this.#dndY && event.buttons === 1) {
                const diff = Math.round((this.#dndY - event.clientY) / 4);
                this.setTempo((this.model.tempo + diff));
                this.#dndY = event.clientY;
            }
        }, { passive: true });

        document.body.addEventListener('mouseup', (event) => {
            document.body.classList.remove('dnd');
            this.#dndY = undefined;
        }, { passive: true });

        document.querySelector('#wheel').addEventListener('touchstart', (event) => {
            document.body.classList.add('dnd');
            this.#dndY = event.touches[0].clientY;
        }, { passive: true });
        document.body.addEventListener('touchmove', (event) => {
            if (this.#dndY) {
                const diff = Math.round((this.#dndY - event.touches[0].clientY) / 4);
                this.setTempo((this.model.tempo + diff));
                this.#dndY = event.touches[0].clientY;
            }
        }, { passive: true });
        document.body.addEventListener('touchend', (event) => {
            document.body.classList.remove('dnd');
            this.#dndY = undefined;
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