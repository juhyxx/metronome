class TapTempoButton extends HTMLElement {
    #lastTime = null;
    #taptempo = [];
    #minTempo = 40;

    constructor() {
        super();

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
            this.#taptempo = [];
            lastTime = now;
        }
        if (this.#taptempo.length > 5) {
            this.#taptempo.shift();
        }

        this.#lastTime = now;
        const tempo = Math.round((60 / ((now - lastTime) / 1000)));
        if (Number.isFinite(tempo) && tempo >= this.#minTempo) {
            this.#taptempo.push(tempo);
            return Math.round(this.#taptempo.reduce((prev, item) => prev + item, 0) / this.#taptempo.length);
        }
    }
}

customElements.define('tap-tempo', TapTempoButton);
