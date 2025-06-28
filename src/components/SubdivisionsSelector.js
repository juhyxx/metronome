class SubdivisionsSelector extends HTMLElement {
    static observedAttributes = ["division"];


    constructor() {
        super();
        this.id = "subdivisions-container";
    }

    connectedCallback() {
        const template = document.createElement('template');

        let html = `
        <h2>Subdivisions</h2>
        <input type="radio" id="sub0" name="sublabel" value="0">
        <div id="subdivisions">
    `;

        for (let i = 2; i <= 6; i++) {
            html += `
            <div>
                <input type="radio" id="sub${i}" name="sublabel" value="${i}">
                <label for="sub${i}">${i}<br></label>
            </div>
        `;
        }

        html += `</div>`;
        template.innerHTML = html;

        const content = template.content.cloneNode(true);
        this.appendChild(content);

        const inputReset = this.querySelector('#sub0');

        for (let i = 2; i <= 6; i++) {
            const input = this.querySelector(`#sub${i}`);
            const label = this.querySelector(`label[for="sub${i}"]`);

            label.addEventListener('mouseup', () => {
                if (input.checked) {
                    inputReset.checked = true;
                    this.dispatchEvent(new CustomEvent('select', {
                        detail: { subdivision: 0 }
                    }));
                }
            });

            input.addEventListener('change', () => {
                this.dispatchEvent(new CustomEvent('select', {
                    detail: { subdivision: parseInt(input.value, 10) }
                }));
            });
        }
    }


    disconnectedCallback() {
        console.log("Custom element removed from page.");
    }

    adoptedCallback() {
        console.log("Custom element moved to new page.");
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "division") {
            this.division = newValue;
            this.querySelector(`input#sub${newValue}`).checked = true;
        }

    }

}

customElements.define('subdivisions-selector', SubdivisionsSelector);