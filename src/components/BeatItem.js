import { Accent } from '../Accent.js';

export class BeatItem extends HTMLElement {
    static observedAttributes = ['sub-divisions', 'accent'];

    #subdivisions = 4;
    #accent = Accent.value.MEDIUM;

    constructor() {
        super();
    }

    set subBeat(value) {
        this.querySelectorAll('.subdivisions div').forEach((el, index) =>
            el.classList.toggle('highlight', index <= value)
        );
    }

    connectedCallback() {
        this.innerHTML = `
            <div>${this.getAttribute('index')}</div>
            <div></div>
            <div></div>
            <div class="subdivisions"></div>
        `;
        this.#renderSubdivisions();
        this.addEventListener('click', () => {
            this.#accent = Accent.next(this.#accent);
            this.setAttribute('accent', this.#accent);
            this.dispatchEvent(
                new CustomEvent('select', { detail: { accent: this.#accent } })
            );
        });
    }

    #renderSubdivisions() {
        if (this.querySelector('.subdivisions')) {
            this.querySelector('.subdivisions').innerHTML =
                '<div></div>'.repeat(this.#subdivisions);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'sub-divisions':
                this.#subdivisions = newValue;
                this.#renderSubdivisions();
                break;
            case 'accent':
                this.#accent = newValue;
                break;
        }
    }
}
