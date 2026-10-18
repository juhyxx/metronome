import { TEMPO } from '../config.js';
import { limit } from '../utils/limit.js';

const RESET_AFTER = 2000; // ms, a longer pause starts a new measurement
const MAX_INTERVALS = 6; // the tempo is the average of the last intervals

// Emits `change` with the tapped tempo as `{ value }`.
export class TapTempoButton extends HTMLElement {
    #lastTap = -Infinity;
    #intervals = [];

    constructor() {
        super();
        // pointerdown rather than click: it is the moment the finger hits
        this.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) return;

            this.classList.add('lit');
            setTimeout(() => this.classList.remove('lit'), 120);

            const value = this.#tap(event.timeStamp);
            if (value) {
                this.dispatchEvent(new CustomEvent('change', { detail: { value } }));
            }
        });
    }

    connectedCallback() {
        this.classList.add('btn');
    }

    #tap(time) {
        const interval = time - this.#lastTap;
        this.#lastTap = time;

        if (interval > RESET_AFTER) {
            this.#intervals = [];
            return null;
        }
        this.#intervals = [...this.#intervals, interval].slice(-MAX_INTERVALS);
        const average = this.#intervals.reduce((sum, item) => sum + item, 0) / this.#intervals.length;

        return limit(Math.round(60000 / average), TEMPO.min, TEMPO.max);
    }
}
