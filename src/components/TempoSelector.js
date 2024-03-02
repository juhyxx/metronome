class TempoSelector extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = 'test';
    }

    disconnectedCallback() {
        console.log("Custom element removed from page.");
    }

    adoptedCallback() {
        console.log("Custom element moved to new page.");
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`Attribute ${name} has changed.`);
    }

}

customElements.define('tempo-selector', TempoSelector);
