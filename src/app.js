
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
    #isPlaying = false;
    #delay = 0.5;
    #lastTime = undefined;
    #taptempo = [];
    #wakeLock = undefined;

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
        value = limit(value, 40, 260);
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

    toggleIsPlaying() {
        return this.#isPlaying = !this.#isPlaying;
    }
    get isPlaying() {
        return this.#isPlaying
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
            console.log("change", event.target.value)
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
        const range = ((260 - 40) / 10);
        const angleSize = (180 + 2 * 40) / range;

        for (let i = 0; i <= range; i++) {
            const el = document.createElement('div');
            const subel = document.createElement('div');
            const angle = (i * angleSize) - 40;
            const tempo2select = (i * 10) + 40;

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
            this.setTempo((event.deltaY > 0) ? model.tempo + 10 : model.tempo - 10);
            event.preventDefault()
        });
        document.querySelector('#wheel').addEventListener('click', () => {
            document.querySelector("body").classList.toggle("is-playing");
            run()
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
}

let model = new Model();

window.addEventListener('DOMContentLoaded', () => {

    new View(model);
});


async function run() {
    if (!model.toggleIsPlaying()) {
        model.wakeUnlock();
        return;
    };
    model.wakeLock()
    const audioContext = new AudioContext();
    let counter = 0;

    function playTone(t) {

        const oscillator = audioContext.createOscillator();
        const gainNode = new GainNode(audioContext);
        const note = Object.assign({}, model.beats[counter]);
        let noteOff = false;
        let frequency = 880;
        switch (note.accent) {
            case Accent.value.HIGH:
                frequency = 880;
                break;
            case Accent.value.MEDIUM:
                frequency = 600;
                break;
            case Accent.value.LOW:
                frequency = 440;
                break;
            case Accent.value.NONE:
                noteOff = true;
                break;
        }
        const startTime = t + model.delay;
        const endTime = startTime + 0.06;

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.addEventListener('ended', (event) => {
            if (model.isPlaying) {
                playTone(startTime);
            }

            setTimeout(() => {
                document.querySelectorAll('#selector .highlight').forEach((el) => el.classList.remove('highlight'));
                document.querySelector(`#selector >div:nth-child(${event.target.counter + 1})`).classList.add('highlight');
                document.querySelector('#counter').innerHTML = event.target.counter + 1;
                document.querySelector('#subcounter').innerHTML = 1;
            }, startTime - audioContext.currentTime);
        });

        oscillator.frequency.setValueAtTime(frequency, startTime);
        gainNode.gain.setValueAtTime(noteOff ? -1 : model.volume, startTime);
        oscillator.connect(audioContext.destination);
        oscillator.start(startTime);
        oscillator.stop(endTime);
        gainNode.gain.linearRampToValueAtTime(-1, endTime - 0.01);

        oscillator.counter = counter;
        if (model.subdivisions > 1) {
            for (let i = 1; i < model.subdivisions; i++) {
                const subOscillator = audioContext.createOscillator();
                const gainSubNode = new GainNode(audioContext);

                subOscillator.connect(gainSubNode);
                gainSubNode.connect(audioContext.destination);
                subOscillator.frequency.setValueAtTime(220, startTime);
                subOscillator.connect(audioContext.destination);
                subdivisionsStartTime = startTime + i * (model.delay / model.subdivisions);
                subOscillator.start(subdivisionsStartTime);
                subOscillator.stop(subdivisionsStartTime + 0.03);
                gainSubNode.gain.setValueAtTime(Math.max(model.volume - 0.4, -1), subdivisionsStartTime);
                gainSubNode.gain.linearRampToValueAtTime(-1, subdivisionsStartTime + 0.02);
                subOscillator.subdivision = i;
                subOscillator.addEventListener('ended', (event) => {
                    setTimeout(() => {
                        document.querySelector('#subcounter').innerHTML = event.target.subdivision + 1;
                    }, startTime - audioContext.currentTime);
                });
            }
        }
        counter++;
        if (counter >= model.beats.length) {
            counter = 0;
        }
    }

    if (audioContext) {
        playTone(audioContext.currentTime);
    }
}