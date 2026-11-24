import { TEMPO } from '../config.js';
import { limit } from './limit.js';

const RESET_AFTER = 2000; // ms, a longer pause starts a new measurement
const MAX_INTERVALS = 6; // the tempo is the average of the last intervals

// Turns tap times into a tempo.
export class TapTempo {
    #lastTap = -Infinity;
    #intervals = [];

    // Returns the tempo for a tap at `time` (ms), or null when it starts a new measurement.
    tap(time) {
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
