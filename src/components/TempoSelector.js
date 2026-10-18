import { TEMPO } from '../config.js';
import { limit } from '../utils/limit.js';
import { wheelDirection } from '../utils/wheel.js';

const TEMPO_NAMES = [
    { value: 60, name: 'Largo' },
    { value: 66, name: 'Larghetto' },
    { value: 76, name: 'Adagio' },
    { value: 108, name: 'Andante' },
    { value: 120, name: 'Moderato' },
    { value: 168, name: 'Allegro' }
];
const SCALE_STEP = 10; // BPM between two ticks
const SCALE_ARC = 280; // degrees covered by the scale, symmetric around the top
const DRAG_STEP = 4; // px of vertical drag per BPM

// Tempo knob. Emits `change` with `{ value }` when the user sets a tempo and `toggle` when the wheel is clicked.
export class TempoSelector extends HTMLElement {
    #value = TEMPO.default;
    #dragY = null;
    #dragged = false;

    constructor() {
        super();
        this.addEventListener('click', (event) => this.#onClick(event));
        this.addEventListener('pointerdown', (event) => this.#onPointerDown(event));
        this.addEventListener('pointermove', (event) => this.#onPointerMove(event));
        this.addEventListener('pointerup', () => this.#onPointerUp());
        this.addEventListener('pointercancel', () => this.#onPointerUp());
        this.addEventListener(
            'wheel',
            (event) => this.#change(this.#value + wheelDirection(event) * (event.shiftKey ? 1 : SCALE_STEP)),
            { passive: true }
        );
    }

    get value() {
        return this.#value;
    }
    set value(value) {
        this.#value = limit(Math.round(value), TEMPO.min, TEMPO.max);
        this.#render();
    }

    connectedCallback() {
        const steps = (TEMPO.max - TEMPO.min) / SCALE_STEP;
        const ticks = Array.from({ length: steps + 1 }, (_, i) => {
            const angle = (i / steps) * SCALE_ARC - (SCALE_ARC - 180) / 2;
            const tempo = TEMPO.min + i * SCALE_STEP;
            return `<div class="tick" style="--angle: ${angle}deg"><div class="mark" data-tempo="${tempo}"></div></div>`;
        });

        this.innerHTML = `
            <div class="dial">
                <div class="wheel">
                    <div class="tempo-name"></div>
                    <div class="tempo-value"></div>
                    <div class="play"></div>
                </div>
                ${ticks.join('')}
            </div>
        `;
        this.#render();
    }

    #change(value) {
        const previous = this.#value;
        this.value = value;
        if (this.#value !== previous) {
            this.dispatchEvent(new CustomEvent('change', { detail: { value: this.#value } }));
        }
    }

    #onClick(event) {
        if (this.#dragged) return; // the click ending a drag

        const mark = event.target.closest('.mark');
        if (mark) {
            this.#change(parseInt(mark.dataset.tempo, 10));
        } else if (event.target.closest('.wheel')) {
            this.dispatchEvent(new CustomEvent('toggle'));
        }
    }

    #onPointerDown(event) {
        const wheel = event.target.closest('.wheel');
        this.#dragged = false;
        if (!wheel || event.button !== 0) return;

        this.#dragY = event.clientY;
        wheel.setPointerCapture(event.pointerId); // keeps the drag going outside the wheel
    }

    #onPointerMove(event) {
        if (this.#dragY === null) return;

        const steps = Math.trunc((this.#dragY - event.clientY) / DRAG_STEP);
        if (steps !== 0) {
            this.#dragged = true;
            this.#dragY -= steps * DRAG_STEP;
            document.body.classList.add('dnd');
            this.#change(this.#value + steps);
        }
    }

    #onPointerUp() {
        this.#dragY = null;
        document.body.classList.remove('dnd');
    }

    #render() {
        if (!this.firstElementChild) return;

        const value = this.#value;
        const nearest = Math.round(value / SCALE_STEP) * SCALE_STEP;

        this.querySelectorAll('.mark').forEach((mark) => {
            const isNearest = parseInt(mark.dataset.tempo, 10) === nearest;
            mark.classList.toggle('highlight', isNearest);
            if (isNearest) {
                // the further the tempo is from the tick, the dimmer it glows
                mark.style.setProperty('--strength', 1 - Math.abs(value - nearest) * 0.18);
            }
        });
        this.querySelector('.tempo-value').textContent = value;
        this.querySelector('.tempo-name').textContent = TEMPO_NAMES.find((item) => value <= item.value)?.name ?? 'Presto';
        // the play icon turns once per four beats
        this.querySelector('.play').style.animationDuration = `${(4 * 60) / value}s`;
    }
}
