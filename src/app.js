
window.AudioContext = window.AudioContext || window.webkitAudioContext;

function limit(value, min, max) {
    value = Math.max(value, min);
    value = Math.min(value, max);
    return value;
}

class Model {
    #tempo = 120;
    subdivisions = 1;
    #volume = 0.8;

    #delay = 0.5;
    #lastTime = undefined;
    #taptempo = [];
    #wakeLock = undefined;
    #maxTempo = 280;
    #minTempo = 40;
    #sound = undefined;

    set sound(item) {
        this.#sound = item;
    }
    get sound() {
        return this.#sound;
    }

    get maxTempo() {
        return this.#maxTempo;
    }
    get minTempo() {
        return this.#minTempo;
    }

    get volume() {
        return this.#volume;
    }

    get volumePercentage() {
        return Math.round((this.#volume + 1) / 0.02);
    }

    set volume(value) {
        value = limit(value, 10, 100)
        this.#volume = (value * 0.02) - 1;
    }

    set tempo(value) {
        value = limit(value, this.#minTempo, this.#maxTempo);
        this.#tempo = value;
        this.#delay = 60 / this.tempo;
    }

    get tempo() {
        return this.#tempo
    }

    get delay() {
        return this.#delay;
    }

    beats = [{
        accent: Accent.value.HIGH,
    }, {
        accent: Accent.value.LOW,
    }, {
        accent: Accent.value.MEDIUM,
    }, {
        accent: Accent.value.LOW,
    }]

    wakeLock() {
        navigator.wakeLock.request("screen").finally(wakeLock => {
            this.#wakeLock = wakeLock;
        });
    }

    wakeUnlock() {
        this.#wakeLock = null;
    }

    addBeat() {
        const count = Math.min(this.beats.length + 1, 10);
        this.beats = Array(count).fill('').map((item, i) => this.beats[i] ? this.beats[i] : { accent: Accent.value.LOW });
    }
    removeBeat() {
        const count = Math.max(this.beats.length - 1, 1);
        if (this.beats.length > 1) {
            this.beats.pop();
        }
    }

    tapTempo() {
        const now = Date.now();
        let lastTime = this.#lastTime || now;


        if (now - lastTime > 2000) {
            this.#taptempo = [];
            lastTime = now;
        }
        if (this.#taptempo.length > 5) {
            this.#taptempo.shift()
        }

        this.#lastTime = now;
        let tempo = Math.round((60 / ((now - lastTime) / 1000)));
        if (Number.isFinite(tempo) && tempo > 39) {
            this.#taptempo.push(tempo);
            let avg = Math.round(this.#taptempo.reduce((prev, item) => prev + item, 0) / this.#taptempo.length);

            return avg;
        }
    }
}

class Accent {
    static value = {
        NONE: "none",
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
    };
    static queue = [
        this.value.NONE,
        this.value.LOW,
        this.value.MEDIUM,
        this.value.HIGH,
    ];
    static next(accent) {
        let index = this.queue.indexOf(accent) + 1;
        index = index >= this.queue.length ? 0 : index;
        return this.queue[index];
    }
}



class View {
    #model = undefined;
    #beatSelector = undefined
    #volume = undefined;
    #dndY = undefined;

    get model() {
        return this.#model;
    }

    constructor(model) {
        this.#model = model;
        this.#beatSelector = document.querySelector('#selector')
        this.#volume = document.querySelector('#volume');

        document.querySelector('#counter').innerHTML = this.model.beats.length;
        document.querySelector('#subcounter').innerHTML = this.model.subdivisions;
        document.querySelector('#add').addEventListener('click', () => {
            this.model.addBeat();
            this.renderBeatSelector();
        });
        document.querySelector('#remove').addEventListener('click', () => {
            model.removeBeat();
            this.renderBeatSelector();
        });

        document.querySelector('#tap-tempo').addEventListener('click', () => {
            let tap = this.model.tapTempo();
            if (tap) {
                this.setTempo(tap);
            }
        });

        document.querySelector('#tempo').addEventListener('change', (event) => {
            this.setTempo(parseInt(event.target.value, 10));
        });

        document.querySelector('#subdivisions').addEventListener('change', (event) => {
            this.model.subdivisions = parseInt(event.target.value, 10);
            document.querySelector('#subcounter').innerHTML = this.model.subdivisions;
        });
        document.querySelector('#subdivisions').addEventListener('click', (event) => {
            let value = event.target.closest('div').querySelector("input").value
            if (this.model.subdivisions == parseInt(value, 10)) {
                this.model.subdivisions = 0;

                event.preventDefault();
                event.stopPropagation();
                document.querySelector("#sub0").checked = true
            }
        });
        this.renderTempoSelector();
        this.renderBeatSelector();
        this.renderVolume();
        this.setTempo(this.model.tempo);
        document.querySelector("#volume input[name=volume]:nth-child(3)").click();
    }

    renderVolume() {
        this.#volume.addEventListener("wheel", (event) => {
            let inputs = [...document.querySelectorAll("#volume input[name=volume]")];
            let selected = document.querySelector("#volume input[name=volume]:checked");
            let index = inputs.indexOf(selected);
            index = (event.deltaY < 0) ? index + 1 : index - 1;
            index = limit(index, 0, inputs.length - 1);
            inputs[index].click();
            event.preventDefault()
        });

        this.#volume.addEventListener('change', (event) => {
            this.model.volume = parseInt(event.target.value, 10)
        });
    }

    setTempo(tempo) {
        this.model.tempo = tempo;
        document.querySelector('#tempo').value = this.model.tempo;
        document.querySelector('#play ').style.animationDuration = (4 * 60 / this.model.tempo) + "s";
        document.querySelector('#wheel #tempo-value').innerHTML = this.model.tempo;
        document.querySelectorAll('#tempo-knob-inner .value').forEach(el => el.classList.remove("highlight"))
        const el = [...document.querySelectorAll('#tempo-knob-inner .value')].find(el => el.dataset.tempo == this.model.tempo)
        if (el) {
            el.classList.add("highlight")
        }
    }

    renderTempoSelector() {
        const rangeAngle = 50;
        const range = ((this.model.maxTempo - this.model.minTempo) / 10);
        const angleSize = (180 + 2 * rangeAngle) / range;

        for (let i = 0; i <= range; i++) {
            const el = document.createElement('div');
            const subel = document.createElement('div');
            const angle = (i * angleSize) - rangeAngle;
            const tempo2select = (i * 10) + this.model.minTempo;

            el.className = "value-container";
            subel.className = "value";
            subel.dataset.tempo = tempo2select;
            subel.title = `${tempo2select} BPM`;

            subel.addEventListener("click", (event) => {
                this.setTempo(parseInt(event.target.dataset.tempo, 10));
            })
            el.style.transform = `rotate(${angle}deg)`;
            el.append(subel);
            document.querySelector('#tempo-knob-inner').appendChild(el);
        }
        document.querySelector('#tempo-knob').addEventListener("wheel", (event) => {
            let tempo = Math.round(Math.round(model.tempo / 10) * 10)
            this.setTempo((event.deltaY > 0) ? tempo + 10 : tempo - 10);
            event.preventDefault()
        });
        document.querySelector('#wheel').addEventListener('click', () => {
            document.querySelector("body").classList.toggle("is-playing");
            if (this.model.sound) {
                this.model.sound.stop()
                this.model.sound = undefined
            }
            else {
                this.model.sound = new SoundManager(this)
            }
        });
        document.querySelector('#wheel').addEventListener('mousedown', (event) => {
            document.querySelector('body').classList.add("dnd");
            this.#dndY = event.clientY;
        }, { passive: true });
        document.querySelector('body').addEventListener('mousemove', (event) => {
            if (this.#dndY && event.buttons == 1) {
                let diff = Math.round((this.#dndY - event.clientY) / 4);
                this.setTempo((this.model.tempo + diff));
                this.#dndY = event.clientY;
            }
        }, { passive: true });
        document.querySelector('body').addEventListener('mouseup', (event) => {
            document.querySelector('body').classList.remove("dnd");
            this.#dndY = undefined;
        }, { passive: true });
    }

    renderBeatSelector() {
        document.querySelector('#counter').innerHTML = this.model.beats.length;
        this.#beatSelector.innerHTML = '';
        this.model.beats.forEach((item, index) => {
            const el = document.createElement('div');

            for (let i = 0; i < 3; i++) {
                const subel = document.createElement('div');
                if (i == 0) {
                    subel.innerHTML = index + 1;
                }
                el.appendChild(subel)
            }
            el.setAttribute('accent', this.model.beats[index].accent);
            el.addEventListener('click', (event) => {
                let el = event.target.closest('div[accent]');
                model.beats[index].accent = Accent.next(el.getAttribute('accent'));
                this.renderBeatSelector();
            });
            this.#beatSelector.appendChild(el);
        });
    }

    removeHighlight(counter) {
        document.querySelectorAll('#selector .highlight').forEach((el) => el.classList.remove('highlight'));
        let elToSelect = document.querySelector(`#selector >div:nth-child(${counter + 1})`);
        if (elToSelect) {
            elToSelect.classList.add('highlight');
        }

        document.querySelector('#counter').innerHTML = counter + 1;
        document.querySelector('#subcounter').innerHTML = 1;
    }
}

let model = new Model();

window.addEventListener('DOMContentLoaded', () => {
    new View(model);
});

class SoundManager {
    #counter = 0
    #isPlaying = true;
    #audioContext = undefined;
    #noteFreq = {
        [Accent.value.HIGH]: 880,
        [Accent.value.MEDIUM]: 600,
        [Accent.value.LOW]: 440,
        [Accent.value.NONE]: 440,
    }

    stop() {
        this.#isPlaying = false;
        this.model.wakeUnlock();
    }

    constructor(view) {
        this.model = view.model;
        this.view = view;
        this.model.wakeLock()
        this.#audioContext = new AudioContext();
        this.planNextBeat(this.#audioContext.currentTime);
    }

    get counter() {
        return this.#counter
    }

    planNextBeat(t) {
        if (!this.#isPlaying) return;

        const startTime = t + this.model.delay;
        const endTime = startTime + 0.06;

        const oscillator = new OscillatorNode(this.#audioContext, { "type": "sine" });
        const gainNode = new GainNode(this.#audioContext);
        const beat = this.model.beats[this.counter] ? this.model.beats[this.counter] : this.model.beats[0];
        const frequency = this.#noteFreq[beat.accent];

        oscillator.counter = this.counter;
        oscillator.startTime = startTime;

        oscillator.connect(gainNode);
        gainNode.connect(this.#audioContext.destination);
        oscillator.connect(this.#audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, startTime);
        gainNode.gain.setValueAtTime(beat.accent === Accent.value.NONE ? -1 : this.model.volume, startTime);
        gainNode.gain.linearRampToValueAtTime(-1, endTime - 0.01);

        oscillator.start(startTime);
        oscillator.stop(endTime);

        oscillator.addEventListener('ended', this.onOscilatorEnd.bind(this));

        if (this.model.subdivisions > 1) {
            for (let i = 1; i < this.model.subdivisions; i++) {
                const subdivisionsStartTime = startTime + i * (this.model.delay / this.model.subdivisions);
                const subOscillator = this.#audioContext.createOscillator();
                const gainSubNode = new GainNode(this.#audioContext);

                subOscillator.subdivision = i;
                subOscillator.startTime = startTime;

                subOscillator.connect(gainSubNode);
                gainSubNode.connect(this.#audioContext.destination);
                subOscillator.connect(this.#audioContext.destination);

                subOscillator.frequency.setValueAtTime(220, startTime);
                gainSubNode.gain.setValueAtTime(Math.max(this.model.volume - 0.4, -1), subdivisionsStartTime);
                gainSubNode.gain.linearRampToValueAtTime(-1, subdivisionsStartTime + 0.02);

                subOscillator.start(subdivisionsStartTime);
                subOscillator.stop(subdivisionsStartTime + 0.03);
                subOscillator.addEventListener('ended', this.onSubOscilatorEnd.bind(this));
            }
        }
        this.increaseCounter()
    }

    onOscilatorEnd(event) {
        let startTime = event.target.startTime;

        setTimeout(() => { this.view.removeHighlight(event.target.counter) }, startTime - this.#audioContext.currentTime);
        this.planNextBeat(startTime);
    }

    onSubOscilatorEnd(event) {
        setTimeout(() => {
            document.querySelector('#subcounter').innerHTML = event.target.subdivision + 1;
        }, event.target.startTime - this.#audioContext.currentTime);
    }

    increaseCounter() {
        this.#counter++;
        if (this.#counter >= this.model.beats.length) {
            this.#counter = 0;
        }
    }
}