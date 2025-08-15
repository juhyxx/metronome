export class SoundSelector extends HTMLElement {
    static observedAttributes = ['sound'];
    static data = ['sticks', 'drums', 'metronome', 'beeps'];
    #selected = SoundSelector.data[0];

    constructor() {
        super();
        this.className = 'bar';
    }

    connectedCallback() {
        this.innerHTML = SoundSelector.data
            .map((i) => `<div class="btn" data-sound="${i}">${i}</div>`)
            .join('');
        this.querySelectorAll('.btn').forEach((el) => {
            el.addEventListener('click', () => {
                this.select(el.dataset.sound);
                this.dispatchEvent(
                    new CustomEvent('select', {
                        detail: { sound: this.#selected }
                    })
                );
            });
        });
    }

    select(value) {
        this.#selected = value;
        this.querySelectorAll('.btn').forEach((el) => {
            el.classList.toggle(
                'selected',
                el.dataset.sound === this.#selected
            );
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'sound') {
            this.select(newValue);
        }
    }
}
