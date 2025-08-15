export class TempoSelector extends HTMLElement {
    static observedAttributes = ['min', 'max', 'tempo'];

    #maxValue = 200;
    #minValue = 100;
    #dndY = 0;
    #tempo = 120;
    #tempoName = 'Moderato';
    #isPlaying = false;
    static #tempoNames = [
        { value: 60, name: 'Largo' },
        { value: 66, name: 'Larghetto' },
        { value: 76, name: 'Adagio' },
        { value: 108, name: 'Andante' },
        { value: 120, name: 'Moderato' },
        { value: 168, name: 'Allegro' }
    ].reverse();

    set min(value) {
        this.#minValue = value;
        this.#render();
    }

    set max(value) {
        this.#maxValue = value;
        this.#render();
    }

    constructor() {
        super();
    }

    connectedCallback() {
        const innerHTML = `
            <div id="wheel">
                <div id="tempo-name">Tempo Name</div>
                <div id="tempo-value">Tempo Value</div>
                <div id="play"></div>
            </div>
            <div id="tempo-knob-inner">
            </div>
        `;
        this.innerHTML = innerHTML;
        this.#render();
        this.#registerEvents();
        this.#registerDragEvents();
        this.#registerTouchEvents();
    }

    set tempo(value) {
        const newValue = Math.min(
            this.#maxValue,
            Math.max(this.#minValue, value)
        );

        this.#tempo = Math.round(newValue);
        this.tempoName = this.#tempo;

        this.querySelectorAll('.value').forEach((el) => {
            const tempoMatch = parseInt(el.dataset.tempo) === this.#tempo;
            el.classList.toggle('highlight', tempoMatch);
            el.classList.remove('v0', 'v1', 'v2', 'v3', 'v4', 'v5');

            if (!tempoMatch) {
                const roundedTempo = Math.round(this.#tempo / 10) * 10;
                if (roundedTempo === parseInt(el.dataset.tempo)) {
                    el.classList.toggle(
                        'highlight',
                        roundedTempo === parseInt(el.dataset.tempo)
                    );
                    const value = this.#tempo - roundedTempo;
                    el.classList.add('v' + Math.abs(value));
                }
            }
        });
        this.querySelector('#play').style.animationDuration =
            (4 * 60) / this.#tempo + 's';
        this.querySelector('#tempo-value').textContent = this.#tempo;
        this.dispatchEvent(new CustomEvent('change', { detail: this.#tempo }));
    }
    set tempoName(value) {
        this.#tempoName = TempoSelector.#tempoNames.reduce(
            (prev, item) => (value <= item.value ? item.name : prev),
            'Presto'
        );
        this.querySelector('#tempo-name').textContent = this.#tempoName;
    }

    get tempo() {
        return this.#tempo;
    }

    #render() {
        const rangeAngle = 50;
        const range = (this.#maxValue - this.#minValue) / 10;
        const angleSize = (180 + 2 * rangeAngle) / range;
        const tempoKnobInner = this.querySelector('#tempo-knob-inner');

        tempoKnobInner.innerHTML = Array.from({ length: range + 1 }, (_, i) => {
            const angle = Math.round(i * angleSize - rangeAngle);
            const tempo2select = i * 10 + this.#minValue;
            return `<div class="value-container" style="transform: rotate(${angle}deg)">
                            <div class="value" data-tempo="${tempo2select}"></div>
                        </div>
                    `;
        }).join('');

        const onClickItem = (event) => {
            this.tempo = parseInt(event.target.dataset.tempo, 10) || null;
            event.stopPropagation();
        };
        this.querySelectorAll('.value').forEach((el) =>
            el.addEventListener('click', onClickItem)
        );
        this.tempo = this.#tempo; //set tempo after render
    }

    #toggleIsPlaying() {
        this.#isPlaying = !this.#isPlaying;
        this.querySelector('#wheel').classList.toggle(
            'is-playing',
            this.#isPlaying
        );
        this.dispatchEvent(
            new CustomEvent('onPlay', { detail: this.#isPlaying })
        );
    }

    #registerEvents() {
        const onClick = (event) => {
            event.stopPropagation();
            this.#toggleIsPlaying();
        };
        const onMouseWheel = (event) => {
            const difference = event.ctrlKey ? 1 : 10;

            this.tempo =
                event.deltaY > 0
                    ? this.tempo + difference
                    : this.tempo - difference;
        };
        const onKeyDown = (event) => {
            if (event.code === 'ArrowUp') {
                this.tempo = this.tempo + (event.altKey ? 10 : 1);
            }
            if (event.code === 'ArrowDown') {
                this.tempo = this.tempo - (event.altKey ? 10 : 1);
            }
        };

        this.addEventListener('click', onClick);
        this.addEventListener('wheel', onMouseWheel, { passive: true });
        document.addEventListener('keydown', onKeyDown);
    }
    #registerDragEvents() {
        const onMouseDown = (event) => {
            this.#dndY = event.clientY;
        };
        const onMouseMove = (event) => {
            if (this.#dndY && event.buttons === 1) {
                document.body.classList.add('dnd');
                const diff = Math.round((this.#dndY - event.clientY) / 4);
                if (diff !== 0) {
                    this.tempo = this.tempo + diff;
                    this.#dndY = event.clientY;
                }
            }
        };
        const onMouseUp = () => {
            document.body.classList.remove('dnd');
            this.#dndY = undefined;
        };
        document
            .querySelector('#wheel')
            .addEventListener('mousedown', onMouseDown, { passive: true });
        document.body.addEventListener('mousemove', onMouseMove, {
            passive: true
        });
        document.body.addEventListener('mouseup', onMouseUp, { passive: true });
    }

    #registerTouchEvents() {
        const onTouchStart = (event) => {
            document.body.classList.add('dnd');
            this.#dndY = event.touches[0].clientY;
        };
        const onTouchMove = (event) => {
            if (this.#dndY) {
                const diff = Math.round(
                    (this.#dndY - event.touches[0].clientY) / 4
                );
                this.tempo += diff;
                this.#dndY = event.touches[0].clientY;
            }
        };
        const onTouchEnd = () => {
            document.body.classList.remove('dnd');
            this.#dndY = undefined;
        };

        document
            .querySelector('#wheel')
            .addEventListener('touchstart', onTouchStart, { passive: true });
        document.body.addEventListener('touchmove', onTouchMove, {
            passive: true
        });
        document.body.addEventListener('touchend', onTouchEnd, {
            passive: true
        });
    }

    disconnectedCallback() {
        console.log('Custom element removed from page.');
    }

    adoptedCallback() {
        console.log('Custom element moved to new page.');
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'max':
                this.max = parseInt(newValue, 10);
                break;
            case 'min':
                this.min = parseInt(newValue, 10);
                break;
            case 'tempo':
                this.tempo = parseInt(newValue, 10);
                break;
        }
    }
}
