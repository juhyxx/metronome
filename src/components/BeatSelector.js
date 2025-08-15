import { Accent } from '../Accent.js';

export class BeatSelector extends HTMLElement {
    static observedAttributes = ['sub-divisions', 'beat'];

    #beat = 0;
    #beats = [];
    #subdivisions = 0;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    set subdivisions(value) {
        this.#subdivisions = parseInt(value, 10);
        this.querySelectorAll('beat-item').forEach((item) => {
            item.setAttribute('sub-divisions', value);
        });
    }

    set beat(value) {
        this.#beat = parseInt(value, 10);
        this.#beats.forEach((item, index) => {
            item.toggleAttribute('highlight', index === this.#beat);
        });
    }

    set subBeat(value) {
        const beat = this.querySelector('beat-item[highlight]');
        if (!beat) return;
        beat.subBeat = value;
    }

    clear() {
        this.#beats = [];
        this.querySelectorAll('beat-item').forEach((item) => item.remove());
    }

    addBeat(accent, silent = false) {
        const item = document.createElement('beat-item');
        this.#setupBeat(item, accent);
        this.appendChild(item);
        this.#beats = this.querySelectorAll('beat-item');
        if (!silent) {
            this.dispatchEvent(
                new CustomEvent('add', {
                    detail: {
                        accent: accent || Accent.value.LOW,
                        index: item.getAttribute('index')
                    }
                })
            );
        }
    }

    #setupBeat(
        item,
        accent = Accent.value.LOW,
        index = this.#beats.length + 1
    ) {
        item.setAttribute('sub-divisions', this.#subdivisions);
        item.setAttribute('index', this.#beats.length + 1);
        item.setAttribute('accent', accent);
        item.addEventListener('select', (event) => {
            this.dispatchEvent(
                new CustomEvent('select', {
                    detail: {
                        accent: event.detail.accent,
                        index: parseInt(item.getAttribute('index'), 10) - 1
                    }
                })
            );
        });
    }

    removeBeat() {
        if (this.#beats.length > 0) {
            const lastBeat = this.#beats[this.#beats.length - 1];

            this.removeChild(lastBeat);
            this.#beats = this.querySelectorAll('beat-item'); // update beats list
            this.dispatchEvent(
                new CustomEvent('remove', {
                    detail: { index: lastBeat.getAttribute('index') }
                })
            );
        }
    }

    connectedCallback() {
        this.#beats = this.querySelectorAll('beat-item');
        this.#beats.forEach((item, index) =>
            this.#setupBeat(item, accent, index + 1)
        );
        this.shadowRoot.innerHTML = '<div part="container"><slot></slot></div>';
        this.beat = this.#beat;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'sub-divisions':
                this.subdivisions = newValue;
                break;

            case 'beat':
                this.beat = newValue;
                break;
        }
    }
}
