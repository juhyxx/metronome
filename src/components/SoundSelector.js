import { SOUND_SETS } from '../config.js';
import { SegmentedSelector } from './SegmentedSelector.js';

export class SoundSelector extends SegmentedSelector {
    get options() {
        return SOUND_SETS.map((value) => ({ value, label: value }));
    }
}
