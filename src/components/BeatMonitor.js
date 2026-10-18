// Current beat and subdivision, e.g. `3:2`.
export class BeatMonitor extends HTMLElement {
    #position = { beat: 0, subBeat: 0 };

    set position(value) {
        this.#position = value;
        this.#render();
    }

    connectedCallback() {
        this.innerHTML = '<span></span>:<span></span>';
        this.#render();
    }

    #render() {
        const [beat, subBeat] = this.querySelectorAll('span');
        if (!beat) return;

        beat.textContent = this.#position.beat + 1;
        subBeat.textContent = this.#position.subBeat + 1;
    }
}
