class MemManager extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const items = [...Array(4)].map((item, index) => {
            const el = document.createElement('div');
            el.className = 'mem-item';
            var timer = null;
            el.addEventListener('click', (event) => {
                timer && clearTimeout(timer);
                el.classList.remove('active');
                this.dispatchEvent(new CustomEvent('load', {
                    detail: { memory: index }
                }));
            });
            el.addEventListener('mouseout', (event) => {
                timer && clearTimeout(timer);
                el.classList.remove('active');
            });
            el.addEventListener('mousedown', (event) => {
                el.classList.add('active');
                timer = setTimeout(() => {
                    this.dispatchEvent(new CustomEvent('save', {
                        detail: { memory: index }
                    }));
                    el.classList.remove('active');
                }, 2000);
            });
            return [el];
        }).flat();
        this.append(...items);
    }

}

customElements.define('mem-manager', MemManager);
