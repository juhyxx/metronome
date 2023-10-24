let tempo = 120;
let delay = 60 / tempo;
let subdivisions = 2;
let volume = 0.5;
let isPlaying = false;

window.AudioContext = window.AudioContext || window.webkitAudioContext;

class Accent {
    static value = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
    };
    static queue = [
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

let notes = [{
    accent: Accent.value.HIGH,
}, {
    accent: Accent.value.LOW,
}, {
    accent: Accent.value.MEDIUM,
}, {
    accent: Accent.value.LOW,
}];

window.addEventListener('DOMContentLoaded', () => {
    document.querySelector('button').addEventListener('click', run);
    document.querySelector('#counter').innerHTML = notes.length;
    document.querySelector('#subcounter').innerHTML = subdivisions;
    document.querySelector('#tempoview').innerHTML = `${tempo} BPM`;

    document.querySelector('#tempo').addEventListener('change', () => {
        tempo = parseInt(document.querySelector('#tempo').value, 10);
        delay = 60 / tempo;
        document.querySelector('#tempoview').innerHTML = `${tempo} BPM`;
    });
    document.querySelector('#tempo-range').addEventListener('change', () => {
        document.querySelector('#tempo').value = document.querySelector('#tempo-range').value;
        tempo = parseInt(document.querySelector('#tempo').value, 10);
        delay = 60 / tempo;
        document.querySelector('#tempoview').innerHTML = `${tempo} BPM`;
    });
    document.querySelector('#count').addEventListener('change', () => {
        const count = parseInt(document.querySelector('#count').value, 10);
        document.querySelector('#counter').innerHTML = count;
        notes = Array(count).fill('').map((item, i) => notes[i] ? notes[i] : { accent: Accent.value.LOW });
        renderSelector();
    });
    document.querySelector('#subdivisions').addEventListener('change', () => {
        subdivisions = parseInt(document.querySelector('#subdivisions').value, 10);
        document.querySelector('#subcounter').innerHTML = subdivisions;
    });
    document.querySelector('#volume').addEventListener('change', () => {
        volume = (parseInt(document.querySelector('#volume').value, 10) * 0.02) - 1;
    });
    renderSelector();
});

function renderSelector() {
    document.querySelector('#selector').innerHTML = '';
    notes.forEach((item, index) => {
        const el = document.createElement('div');

        for (let i = 0; i < 3; i++) {
            const subel = document.createElement('div');
            if (i == 0) {
                subel.innerHTML = index + 1;
            }
            el.appendChild(subel)
        }
        el.setAttribute('accent', notes[index].accent);
        el.addEventListener('click', (event) => {
            console.info(event.target);
            let el = event.target.closest('div[accent]');
            notes[index].accent = Accent.next(el.getAttribute('accent'));
            renderSelector();
        });
        document.querySelector('#selector').appendChild(el);
    });
}


async function run() {

    isPlaying = !isPlaying
    document.querySelector('#play').innerHTML = isPlaying ? "STOP" : "play";


    if (!isPlaying) return;
    const audioContext = new AudioContext();

    let counter = 0;

    function playTone(t) {
        const startTime = t + delay;
        const endTime = startTime + 0.06;
        const oscillator = audioContext.createOscillator();
        const gainNode = new GainNode(audioContext);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.addEventListener('ended', (event) => {
            if (isPlaying) {
                playTone(startTime);
            }

            setTimeout(() => {
                document.querySelectorAll('#selector .highlight').forEach((el) => el.classList.remove('highlight'));
                document.querySelector(`#selector >div:nth-child(${event.target.counter + 1})`).classList.add('highlight');
                document.querySelector('#counter').innerHTML = event.target.counter + 1;
                document.querySelector('#subcounter').innerHTML = 1;
            }, startTime - audioContext.currentTime);
        });

        const note = notes[counter];
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
        }
        oscillator.frequency.setValueAtTime(frequency, startTime);
        gainNode.gain.setValueAtTime(volume, startTime);
        oscillator.connect(audioContext.destination);
        oscillator.start(startTime);
        oscillator.stop(endTime);
        gainNode.gain.linearRampToValueAtTime(-1, endTime - 0.01);

        oscillator.counter = counter;
        if (subdivisions > 1) {
            for (let i = 1; i < subdivisions; i++) {
                const subOscillator = audioContext.createOscillator();
                const gainSubNode = new GainNode(audioContext);

                subOscillator.connect(gainSubNode);
                gainSubNode.connect(audioContext.destination);
                subOscillator.frequency.setValueAtTime(220, startTime);
                subOscillator.connect(audioContext.destination);
                subdivisionsStartTime = startTime + i * (delay / subdivisions);
                subOscillator.start(subdivisionsStartTime);
                subOscillator.stop(subdivisionsStartTime + 0.03);
                gainSubNode.gain.setValueAtTime(Math.max(volume - 0.4, -1), subdivisionsStartTime);
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
        if (counter >= notes.length) {
            counter = 0;
        }
    }

    if (audioContext) {
        playTone(audioContext.currentTime);
    }
}

