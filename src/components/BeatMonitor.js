export class BeatMonitor extends HTMLElement {
    #counterEl = null;
    #subCounterEl = null;

    set counter(value) {
        this.#counterEl.textContent = value + 1;
    }

    set subCounter(value) {
        this.#subCounterEl.textContent = value + 1;
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `<span id="beat-counter">1</span>:<span id="beat-sub-counter">1</span>`;
        this.#counterEl = this.querySelector('#beat-counter');
        this.#subCounterEl = this.querySelector('#beat-sub-counter');
    }
}
