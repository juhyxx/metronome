// One beat of the bar. Rendered from its `index`, `accent` and `subdivisions` attributes.
export class BeatItem extends HTMLElement {
    static observedAttributes = ['index', 'subdivisions'];

    set subBeat(value) {
        this.querySelectorAll('.subdivisions i').forEach((el, index) => {
            el.classList.toggle('highlight', index === value);
        });
    }

    connectedCallback() {
        this.#render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this.isConnected && oldValue !== newValue) {
            this.#render();
        }
    }

    #render() {
        const subdivisions = parseInt(this.getAttribute('subdivisions'), 10) || 1;

        this.innerHTML = `
            <div class="number">${this.getAttribute('index')}</div>
            <div class="level high"></div>
            <div class="level medium"></div>
            <div class="level low"></div>
            <div class="subdivisions">${'<i></i>'.repeat(subdivisions)}</div>
        `;
    }
}
