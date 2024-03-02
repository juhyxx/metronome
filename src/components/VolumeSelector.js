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
        const items = [...Array(10)].map((item, index) => {
            const el = document.createElement('input');
            const value = (index + 1) * 10;
            el.type = 'radio';
            el.value = value;
            el.id = 'volume' + value;
            el.name = 'volume';

            const label = document.createElement('label');
            label.dataset.volume = value;
            label.setAttribute('for', 'volume' + value);
            return [el, label];
        }).reverse().flat();
        this.append(...items);
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
