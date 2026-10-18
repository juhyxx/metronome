// Base of the button bar selectors. Subclasses provide `options`.
// Emits `change` with `{ value }` when the user picks an option.
export class SegmentedSelector extends HTMLElement {
    #value = null;

    constructor() {
        super();
        this.addEventListener('click', (event) => {
            const button = event.target.closest('.btn');
            if (!button) return;

            this.value = this.nextValue(this.options[button.dataset.index].value);
            this.dispatchEvent(new CustomEvent('change', { detail: { value: this.value } }));
        });
    }

    // [{ value, label }]
    get options() {
        return [];
    }

    get value() {
        return this.#value;
    }
    set value(value) {
        this.#value = value;
        this.querySelectorAll('.btn').forEach((button, index) => {
            button.classList.toggle('selected', this.options[index].value === value);
        });
    }

    // value selected by clicking an option
    nextValue(value) {
        return value;
    }

    connectedCallback() {
        this.classList.add('bar');
        this.innerHTML = this.options
            .map(({ label }, index) => `<div class="btn" data-index="${index}">${label}</div>`)
            .join('');
        this.value = this.#value;
    }
}
