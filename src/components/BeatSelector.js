class BeatSelector extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = 'test';
    }
}

customElements.define('beat-selector', BeatSelector);
