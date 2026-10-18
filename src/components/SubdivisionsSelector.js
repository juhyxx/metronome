import { SUBDIVISIONS } from '../config.js';
import { SegmentedSelector } from './SegmentedSelector.js';

export class SubdivisionsSelector extends SegmentedSelector {
    get options() {
        return SUBDIVISIONS.map((value) => ({ value, label: value }));
    }

    // clicking the selected subdivision switches subdivisions off
    nextValue(value) {
        return value === this.value ? 1 : value;
    }
}
