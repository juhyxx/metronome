import { limit } from '../utils/limit.js';
import { wheelDirection } from '../utils/wheel.js';

const SEGMENTS = 20;
const STEP = 100 / SEGMENTS;

// Volume 0–100, set by clicking, dragging or the mouse wheel. Emits `change` with `{ value }`.
export class VolumeSelector extends HTMLElement {
    #value = 0;

    constructor() {
        super();
        this.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) return;

            this.setPointerCapture(event.pointerId);
            this.#changeFromPointer(event);
        });
        this.addEventListener('pointermove', (event) => {
            if (this.hasPointerCapture(event.pointerId)) {
                this.#changeFromPointer(event);
            }
        });
        this.addEventListener('wheel', (event) => this.#change(this.#value + wheelDirection(event) * STEP), {
            passive: true
        });
    }

    get value() {
        return this.#value;
    }
    set value(value) {
        this.#value = limit(value, 0, 100);
        this.#render();
    }

    connectedCallback() {
        // --level grows from 0 to 1 and gives the LEDs their wedge shape
        this.innerHTML = Array.from({ length: SEGMENTS }, (_, i) => `<i style="--level: ${i / (SEGMENTS - 1)}"></i>`)
            .join('');
        this.#render();
    }

    // a segment lights up as soon as the pointer is over it, the very left edge mutes
    #changeFromPointer(event) {
        const { left, width } = this.getBoundingClientRect();
        this.#change(Math.ceil(((event.clientX - left) / width) * SEGMENTS) * STEP);
    }

    #change(value) {
        const previous = this.#value;
        this.value = value;
        if (this.#value !== previous) {
            this.dispatchEvent(new CustomEvent('change', { detail: { value: this.#value } }));
        }
    }

    #render() {
        const lit = Math.round(this.#value / STEP);

        this.title = `Volume ${this.#value} %`;
        this.querySelectorAll('i').forEach((segment, index) => segment.classList.toggle('on', index < lit));
    }
}
