export class SubdivisionsSelector extends HTMLElement {
    static observedAttributes = ["division"];
    #selected = 1;


    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
            <h2>Subdivisions</h2>
            <div class="bar">
            ${[2, 3, 4, 5, 6, 7, 8].map(i => `<div class="btn switchable">${i}</div>`).join('')}
            </div>
        `;

        this.querySelectorAll('.btn').forEach((el, index) => {
            el.addEventListener('click', () => {
                const value = index + 2 === this.#selected ? 1 : index + 2;
                this.select(value);
                this.dispatchEvent(new CustomEvent('select', {
                    detail: { subdivision: this.#selected }
                }));
            });
        });
    }

    select(value) {
        this.#selected = value;
        this.querySelectorAll('.btn').forEach(el => {
            el.classList.remove('selected');
            if (parseInt(el.textContent, 10) === value) {
                el.classList.add('selected');
            }
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "division") {
            this.select(parseInt(newValue, 10));
        }
    }

}
