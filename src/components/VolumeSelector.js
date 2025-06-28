class VolumeSelector extends HTMLElement {
    static observedAttributes = ["volume"];

    constructor() {
        super();
    }

    set volume(value) {
        value = Math.max(Math.min(value, 100), 10);

        let input = this.querySelector(`input[value="${value}"]`);
        input.click()
    }

    get volume() {
        return parseInt(document.querySelector("input:checked").value, 10);
    }

    connectedCallback() {
        const template = document.createElement('template');
        let html = '';

        for (let i = 10; i >= 1; i--) {
            const value = i * 10;
            html += `
            <input type="radio" id="volume${value}" name="volume" value="${value}">
            <label for="volume${value}" data-volume="${value}"></label>
        `;
        }

        template.innerHTML = html;
        this.appendChild(template.content.cloneNode(true));
        this.addEventListener('wheel', this.onWheel);
    }

    onWheel(event) {
        let value = this.volume;

        this.volume = (event.deltaY < 0) ? value - 10 : value + 10;
        event.preventDefault();
    }


    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "volume") {
            this.volume = newValue;
        }
    }
}

customElements.define('volume-selector', VolumeSelector);
