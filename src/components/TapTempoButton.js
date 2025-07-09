class TapTempoButton extends HTMLElement {
    #lastTime = null;
    #tapTempo = [];
    #minTempo = 40;

    constructor() {
        super();
        this.className = 'btn';
        this.#minTempo = this.getAttribute('min');
    }

    connectedCallback() {
        this.addEventListener('click', () => {
            const tempo = this.tapTempo();
            if (tempo) {
                this.dispatchEvent(new CustomEvent('change', { detail: { tempo } }));
            }
        });
    }

    tapTempo() {
        const now = Date.now();
        let lastTime = this.#lastTime || now;

        if (now - lastTime > 2000) {
            this.#tapTempo = [];
            lastTime = now;
        }
        if (this.#tapTempo.length > 5) {
            this.#tapTempo.shift();
        }

        this.#lastTime = now;
        const tempo = Math.round((60 / ((now - lastTime) / 1000)));
        if (Number.isFinite(tempo) && tempo >= this.#minTempo) {
            this.#tapTempo.push(tempo);
            return Math.round(this.#tapTempo.reduce((prev, item) => prev + item, 0) / this.#tapTempo.length);
        }
    }
}

customElements.define('tap-tempo', TapTempoButton);
