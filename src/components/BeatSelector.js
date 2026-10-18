import { Accent } from '../Accent.js';

// The bar: one beat-item per beat. Clicking a beat cycles its accent.
// Emits `change` with the new beats as `{ value }`.
export class BeatSelector extends HTMLElement {
    #beats = [];
    #subdivisions = 1;
    #position = { beat: 0, subBeat: 0 };

    constructor() {
        super();
        this.addEventListener('click', (event) => {
            const item = event.target.closest('beat-item');
            if (!item) return;

            const index = [...this.children].indexOf(item);
            const beats = this.#beats.map((accent, i) => (i === index ? Accent.next(accent) : accent));
            this.dispatchEvent(new CustomEvent('change', { detail: { value: beats } }));
        });
    }

    get beats() {
        return this.#beats;
    }
    set beats(value) {
        this.#beats = value;
        this.#render();
    }

    set subdivisions(value) {
        this.#subdivisions = value;
        this.#render();
    }

    set position(value) {
        this.#position = value;
        this.#highlight();
    }

    connectedCallback() {
        this.#render();
    }

    #render() {
        while (this.children.length > this.#beats.length) {
            this.lastElementChild.remove();
        }
        while (this.children.length < this.#beats.length) {
            this.append(document.createElement('beat-item'));
        }
        [...this.children].forEach((item, index) => {
            item.setAttribute('index', index + 1);
            item.setAttribute('accent', this.#beats[index]);
            item.setAttribute('subdivisions', this.#subdivisions);
        });
        this.#highlight();
    }

    #highlight() {
        const { beat, subBeat } = this.#position;

        [...this.children].forEach((item, index) => {
            item.toggleAttribute('highlight', index === beat);
            if (index === beat) {
                item.subBeat = subBeat;
            }
        });
    }
}
