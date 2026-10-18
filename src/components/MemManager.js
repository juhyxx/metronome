import { MEMORY_SLOTS } from '../config.js';

const HOLD_TO_SAVE = 2000; // ms

// Memory slots: click loads, holding saves. Emits `load` and `save` with `{ slot }`.
export class MemManager extends HTMLElement {
    connectedCallback() {
        this.style.setProperty('--hold-duration', `${HOLD_TO_SAVE}ms`);
        this.replaceChildren(...Array.from({ length: MEMORY_SLOTS }, (_, i) => this.#createSlot(i + 1)));
    }

    #createSlot(slot) {
        const el = document.createElement('div');
        let timer = null;

        const cancel = () => {
            clearTimeout(timer);
            timer = null;
            el.classList.remove('active');
        };
        const emit = (type) => this.dispatchEvent(new CustomEvent(type, { detail: { slot } }));

        el.className = 'mem-item';
        el.title = `Memory ${slot}: click to load, hold to save`;
        el.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) return;

            el.classList.add('active');
            timer = setTimeout(() => {
                cancel();
                emit('save');
                el.classList.add('saved');
                setTimeout(() => el.classList.remove('saved'), 600);
            }, HOLD_TO_SAVE);
        });
        el.addEventListener('pointerup', () => {
            if (timer === null) return; // saved already, or the pointer left
            cancel();
            emit('load');
        });
        el.addEventListener('pointerleave', cancel);
        el.addEventListener('pointercancel', cancel);

        return el;
    }
}
