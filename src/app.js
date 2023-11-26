window.AudioContext = window.AudioContext || window.webkitAudioContext;

function limit (value, min, max) {
  value = Math.max(value, min);
  value = Math.min(value, max);
  return value;
}

class Model {
  #tempo = 120;
  #taptempo = [];
  #minTempo = 40;
  #maxTempo = 280;
  #tempoName = undefined;
  #subdivisions = 1;
  #volume = 0.8;
  #delay = 0.5;
  #wakeLock = undefined;
  #lastTime = undefined;
  #sound = undefined;
  #maxBeats = 9;
  #soundSet = 'sticks';
  soundSource = {};
  soundSets = ['sticks', 'drums', 'metronome', 'beeps'];
  soundSources = {
    [Accent.value.HIGH]: 'high',
    [Accent.value.MEDIUM]: 'medium',
    [Accent.value.LOW]: 'low',
    [Accent.value.NONE]: 'low',
    [Accent.value.SUBDIV]: 'subdiv'
  };

  #beats = [{
    accent: Accent.value.HIGH
  }, {
    accent: Accent.value.LOW
  }, {
    accent: Accent.value.MEDIUM
  }, {
    accent: Accent.value.LOW
  }];

  get beats () {
    return this.#beats;
  }

  set beats (data) {
    this.#beats = data;
    this.serialize();
  }

  get subdivisions () { return this.#subdivisions; }

  set subdivisions (value) {
    this.#subdivisions = value;
    document.querySelector('#selector').dispatchEvent(new CustomEvent('refresh', { detail: { beats: this.#beats } }));
    this.serialize();
  }

  get maxBeats () {
    return this.#maxBeats;
  }

  set soundSet (value) {
    this.#soundSet = value;
    this.serialize();
  }

  get soundSet () {
    return this.#soundSet;
  }

  set sound (item) {
    this.#sound = item;
  }

  get sound () {
    return this.#sound;
  }

  get maxTempo () {
    return this.#maxTempo;
  }

  get minTempo () {
    return this.#minTempo;
  }

  get volume () {
    return this.#volume;
  }

  get volumePercentage () {
    return Math.round((this.#volume + 1) / 0.02);
  }

  set volume (value) {
    value = limit(value, 10, 100);
    this.#volume = (value * 0.02) - 1;
    this.serialize();
  }

  set tempo (value) {
    value = limit(value, this.#minTempo, this.#maxTempo);
    this.#tempo = value;
    this.#delay = 60 / this.tempo;

    if (this.#tempo < 60) {
      this.#tempoName = 'Largo';
    } else if (this.#tempo < 66) {
      this.#tempoName = 'Larghetto';
    } else if (this.#tempo < 76) {
      this.#tempoName = 'Adagio';
    } else if (this.#tempo < 108) {
      this.#tempoName = 'Andante';
    } else if (this.#tempo < 120) {
      this.#tempoName = 'Moderato';
    } else if (this.#tempo < 168) {
      this.#tempoName = 'Allegro';
    } else {
      this.#tempoName = 'Presto';
    }
    this.serialize();
  }

  get tempo () {
    return this.#tempo;
  }

  get tempoName () {
    return this.#tempoName;
  }

  get delay () {
    return this.#delay;
  }

  async loadAudioData (audioContext) {
    for (const soundSet of Object.values(this.soundSets)) {
      for (const item of Object.entries(this.soundSources)) {
        const rsvp = await fetch(`sounds/${soundSet}/${item[1]}.wav`);
        if (audioContext) {
          const buff = await rsvp.arrayBuffer();
          this.soundSource[soundSet] = this.soundSource[soundSet] || {};
          this.soundSource[soundSet][item[0]] = await audioContext.decodeAudioData(buff);
        }
      }
    }
  }

  setAccentAt (accent, index) {
    model.#beats[index].accent = accent;
    document.querySelector('#selector').dispatchEvent(new CustomEvent('refresh', { detail: { beats: this.#beats } }));
    this.serialize();
  }

  async lock () {
    try {
      this.#wakeLock = await navigator.wakeLock.request('screen');
    } catch (err) {

    }
  }

  unlock () {
    if (this.#wakeLock) {
      this.#wakeLock.release().then(() => {
        this.wakeLock = null;
      });
    }
  }

  addBeat () {
    const count = Math.min(this.#beats.length + 1, this.maxBeats);
    this.beats = Array(count).fill('').map((item, i) => this.#beats[i] ? this.#beats[i] : { accent: Accent.value.LOW });
    document.querySelector('#selector').dispatchEvent(
      new CustomEvent('refresh', { detail: { beats: this.#beats } }));
    this.serialize();
  }

  removeBeat () {
    if (this.#beats.length > 1) {
      this.#beats.pop();
      document.querySelector('#selector').dispatchEvent(
        new CustomEvent('refresh', { detail: { beats: this.#beats } }));
    }
    this.serialize();
  }

  tapTempo () {
    const now = Date.now();
    let lastTime = this.#lastTime || now;

    if (now - lastTime > 2000) {
      this.#taptempo = [];
      lastTime = now;
    }
    if (this.#taptempo.length > 5) {
      this.#taptempo.shift();
    }

    this.#lastTime = now;
    const tempo = Math.round((60 / ((now - lastTime) / 1000)));
    if (Number.isFinite(tempo) && tempo >= this.#minTempo) {
      this.#taptempo.push(tempo);
      const avg = Math.round(this.#taptempo.reduce((prev, item) => prev + item, 0) / this.#taptempo.length);

      return avg;
    }
  }

  #propsToSerialize = ['subdivisions', 'tempo', 'soundSet', 'beats'];

  serialize () {
    const data = this.#propsToSerialize.reduce((prev, item) => {
      prev[item] = this[item];
      return prev;
    }, {});

    localStorage.setItem('metronome', JSON.stringify(data));
  }

  deserialize () {
    try {
      const data = JSON.parse(localStorage.getItem('metronome'));
      if (data) {
        Object.keys(data).forEach(item => {
          this[item] = data[item];
        });
      }
    } catch {

    }
  }

  constructor () {
    this.deserialize();
  }
}

class Accent {
  static value = {
    SUBDIV: 'subdiv',
    NONE: 'none',
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  };

  static queue = [
    this.value.NONE,
    this.value.LOW,
    this.value.MEDIUM,
    this.value.HIGH
  ];

  static next (accent) {
    let index = this.queue.indexOf(accent) + 1;
    index = index >= this.queue.length ? 0 : index;
    return this.queue[index];
  }
}

class Controller {
  #model = undefined;
  #beatSelector = undefined;
  #volume = undefined;
  #dndY = undefined;

  get model () {
    return this.#model;
  }

  constructor (model) {
    this.#model = model;
    this.#beatSelector = document.querySelector('#selector');
    this.#volume = document.querySelector('#volume');
    this.#beatSelector.addEventListener('refresh', (event) => {
      this.renderBeatSelector(event.detail.beats);
    });

    document.querySelector('#counter').innerHTML = this.model.beats.length;
    document.querySelector('#subcounter').innerHTML = this.model.subdivisions;
    document.querySelector(`#sounds [value="${this.model.soundSet}"]`).checked = true;
    document.querySelector(`#subdivisions-container [value="${this.model.subdivisions}"]`).checked = true;

    document.querySelector('#add').addEventListener('click', (event) => {
      this.model.addBeat();
      document.querySelector('#remove').classList.remove('disabled');
      if (this.model.beats.length === this.model.maxBeats) {
        event.target.classList.add('disabled');
      }
    });
    document.querySelector('#remove').addEventListener('click', (event) => {
      model.removeBeat();
      document.querySelector('#add').classList.remove('disabled');
      if (this.model.beats.length === 1) {
        event.target.classList.add('disabled');
      }
    });
    document.querySelector('#tap-tempo').addEventListener('click', () => {
      const tap = this.model.tapTempo();
      if (tap) {
        this.setTempo(tap);
      }
    });
    document.querySelector('#tempo').addEventListener('change', (event) => {
      this.setTempo(parseInt(event.target.value, 10));
    });

    document.querySelector('#sounds').addEventListener('change', (event) => {
      this.model.soundSet = event.target.value;
    });

    document.querySelector('#subdivisions').addEventListener('change', (event) => {
      this.model.subdivisions = parseInt(event.target.value, 10);
      document.querySelector('#subcounter').innerHTML = this.model.subdivisions;
    });

    document.querySelector('#subdivisions').addEventListener('click', (event) => {
      const value = event.target.closest('div').querySelector('input').value;
      if (this.model.subdivisions === parseInt(value, 10)) {
        this.model.subdivisions = 1;
        event.preventDefault();
        event.stopPropagation();
        document.querySelector('#sub0').checked = true;
      }
    });
    this.renderTempoSelector();
    this.renderBeatSelector(this.model.beats);
    this.renderVolume();
    this.setTempo(this.model.tempo);
    document.querySelector('#volume input[name=volume]:nth-child(3)').click();
  }

  renderVolume () {
    this.#volume.addEventListener('wheel', (event) => {
      const inputs = [...document.querySelectorAll('#volume input[name=volume]')];
      const selected = document.querySelector('#volume input[name=volume]:checked');
      let index = inputs.indexOf(selected);
      index = (event.deltaY < 0) ? index + 1 : index - 1;
      index = limit(index, 0, inputs.length - 1);
      inputs[index].click();
      event.preventDefault();
    });

    this.#volume.addEventListener('change', (event) => {
      this.model.volume = parseInt(event.target.value, 10);
    });
  }

  setTempo (tempo) {
    this.model.tempo = tempo;
    document.querySelector('#tempo-name').innerHTML = this.model.tempoName;
    document.querySelector('#tempo').value = this.model.tempo;
    document.querySelector('#play ').style.animationDuration = (4 * 60 / this.model.tempo) + 's';
    document.querySelector('#wheel #tempo-value').innerHTML = this.model.tempo;
    document.querySelectorAll('#tempo-knob-inner .value').forEach(el => el.classList.remove('highlight'));

    const el = [...document.querySelectorAll('#tempo-knob-inner .value')].find(el => parseInt(el.dataset.tempo, 10) === this.model.tempo);
    if (el) {
      el.classList.add('highlight');
    }
  }

  renderTempoSelector () {
    const rangeAngle = 50;
    const range = ((this.model.maxTempo - this.model.minTempo) / 10);
    const angleSize = (180 + 2 * rangeAngle) / range;
    const subelClick = function (event) {
      this.setTempo(parseInt(event.target.dataset.tempo, 10));
    }.bind(this);

    for (let i = 0; i <= range; i++) {
      const el = document.createElement('div');
      const subel = document.createElement('div');
      const angle = (i * angleSize) - rangeAngle;
      const tempo2select = (i * 10) + this.model.minTempo;

      el.className = 'value-container';
      subel.className = 'value';
      subel.dataset.tempo = tempo2select;

      subel.addEventListener('click', subelClick);
      subel.addEventListener('touchstart', subelClick);
      el.style.transform = `rotate(${angle}deg)`;
      el.append(subel);
      document.querySelector('#tempo-knob-inner').appendChild(el);
    }
    document.querySelector('#tempo-knob').addEventListener('wheel', (event) => {
      const tempo = Math.round(Math.round(model.tempo / 10) * 10);
      this.setTempo((event.deltaY > 0) ? tempo + 10 : tempo - 10);
      event.preventDefault();
    });
    document.querySelector('#wheel').addEventListener('click', () => {
      document.body.classList.toggle('is-playing');
      if (this.model.sound) {
        this.model.sound.stop();
        this.model.sound = undefined;
      } else {
        this.model.sound = new WaveSound(this);
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        document.body.classList.toggle('is-playing');
        if (this.model.sound) {
          this.model.sound.stop();
          this.model.sound = undefined;
        } else {
          this.model.sound = new WaveSound(this);
        }
      }
      if (event.code === 'ArrowUp') {
        this.setTempo(model.tempo + (event.altKey ? 10 : 1));
      }
      if (event.code === 'ArrowDown') {
        this.setTempo(model.tempo - (event.altKey ? 10 : 1));
      }
    });
    document.querySelector('#help-trigger').addEventListener('mousedown', (event) => {
      document.body.classList.toggle('help');
    }, { passive: true });
    document.querySelector('#wheel').addEventListener('mousedown', (event) => {
      document.body.classList.add('dnd');
      this.#dndY = event.clientY;
    }, { passive: true });
    document.body.addEventListener('mousemove', (event) => {
      if (this.#dndY && event.buttons === 1) {
        const diff = Math.round((this.#dndY - event.clientY) / 4);
        this.setTempo((this.model.tempo + diff));
        this.#dndY = event.clientY;
      }
    }, { passive: true });
    document.body.addEventListener('mouseup', (event) => {
      document.body.classList.remove('dnd');
      this.#dndY = undefined;
    }, { passive: true });

    document.querySelector('#wheel').addEventListener('touchstart', (event) => {
      document.body.classList.add('dnd');
      this.#dndY = event.touches[0].clientY;
    }, { passive: true });
    document.body.addEventListener('touchmove', (event) => {
      if (this.#dndY) {
        const diff = Math.round((this.#dndY - event.touches[0].clientY) / 4);
        this.setTempo((this.model.tempo + diff));
        this.#dndY = event.touches[0].clientY;
      }
    }, { passive: true });
    document.body.addEventListener('touchend', (event) => {
      document.body.classList.remove('dnd');
      this.#dndY = undefined;
    }, { passive: true });
  }

  renderBeatSelector (beats) {
    document.querySelector('#counter').innerHTML = beats.length;
    this.#beatSelector.innerHTML = '';
    beats.forEach((item, index) => {
      const el = document.createElement('div');
      const els = Array(3).fill(null).map((item, i) => {
        const subel = document.createElement('div');
        if (i === 0) {
          subel.innerHTML = index + 1;
        }
        return subel;
      });

      const elSubdivContainer = document.createElement('div');
      elSubdivContainer.className = 'subdivisions';
      const elSubdiv = Array(this.model.subdivisions).fill(null).map((item, i) => {
        return document.createElement('div');
      });
      elSubdivContainer.append(...elSubdiv);
      els.push(elSubdivContainer);
      el.append(...els);
      el.setAttribute('accent', beats[index].accent);
      el.addEventListener('click', (event) => {
        const el = event.target.closest('div[accent]');
        this.model.setAccentAt(Accent.next(el.getAttribute('accent')), index);
      });
      this.#beatSelector.appendChild(el);
    });
  }

  async moveHighlight (counter, waitingTime) {
    await wait(waitingTime);

    const selector = document.querySelector('#selector');
    selector.querySelector('#selector>div.highlight')?.classList.remove('highlight');
    const elToSelect = document.querySelector(`#selector >div:nth-child(${counter + 1})`);
    if (elToSelect) {
      elToSelect.classList.add('highlight');
      elToSelect.querySelectorAll('.subdivisions >div').forEach(el => {
        el.classList.remove('highlight');
      });
      elToSelect.querySelector('.subdivisions >div:nth-child(1)').classList = 'highlight';
    }
    document.querySelector('#counter').innerHTML = counter + 1;
    document.querySelector('#subcounter').innerHTML = 1;
  }
}

async function wait (interval) {
  const until = Date.now() + interval;

  while (Date.now() <= until) {}
}

const model = new Model();

window.addEventListener('DOMContentLoaded', () => {
  const controller = new Controller(model);
  model.loadAudioData();
});

class WaveSound {
  #counter = 0;
  isPlaying = true;
  audioContext = undefined;

  get counter () {
    return this.#counter;
  }

  stop () {
    this.isPlaying = false;
    this.model.unlock();
  }

  constructor (controller) {
    this.model = controller.model;
    this.controller = controller;
    this.model.lock();
    this.audioContext = new AudioContext();

    if (Object.keys(this.model.soundSource).length > 0) {
      this.planNextBeat(this.audioContext.currentTime - this.model.delay);
    } else {
      this.model.loadAudioData(this.audioContext).then(() => {
        this.planNextBeat(this.audioContext.currentTime - this.model.delay);
      });
    }
  }

  planNextBeat (t) {
    if (!this.isPlaying) return;

    const startTime = t + this.model.delay;
    const gainNode = new GainNode(this.audioContext);
    const beat = this.model.beats[this.counter] ? this.model.beats[this.counter] : this.model.beats[0];
    const source = new AudioBufferSourceNode(this.audioContext);

    source.buffer = this.model.soundSource[this.model.soundSet][beat.accent];
    source.counter = this.counter;
    source.startTime = startTime;
    source.connect(this.audioContext.destination);
    source.connect(gainNode);
    source.addEventListener('ended', this.onBeatEnd.bind(this));

    gainNode.connect(this.audioContext.destination);
    gainNode.gain.setValueAtTime(beat.accent === Accent.value.NONE ? -1 : this.model.volume, startTime);

    source.start(startTime);

    if (this.model.subdivisions > 1) {
      for (let i = 1; i < this.model.subdivisions; i++) {
        const subdivisionsStartTime = startTime + i * (this.model.delay / this.model.subdivisions);
        const subSource = new AudioBufferSourceNode(this.audioContext);
        const gainSubNode = new GainNode(this.audioContext);

        subSource.buffer = this.model.soundSource[this.model.soundSet][Accent.value.SUBDIV];
        subSource.counter = this.counter;
        subSource.subdivision = i;
        subSource.startTime = startTime;
        subSource.connect(gainSubNode);
        subSource.connect(this.audioContext.destination);
        subSource.addEventListener('ended', this.onSubDivisionEnd.bind(this));
        subSource.start(subdivisionsStartTime);

        gainSubNode.connect(this.audioContext.destination);
        gainSubNode.gain.setValueAtTime(Math.max(this.model.volume - 0.4, -1), subdivisionsStartTime);
      }
    }
    this.increaseCounter();
  }

  onBeatEnd (event) {
    const startTime = event.target.startTime;

    this.controller.moveHighlight(event.target.counter, this.audioContext.currentTime - startTime);
    this.planNextBeat(startTime);
  }

  onSubDivisionEnd (event) {
    setTimeout(() => {
      document.querySelector('#subcounter').innerHTML = event.target.subdivision + 1;
      const el = document.querySelector(`#selector>div:nth-child(${event.target.counter + 1}) .subdivisions >div:nth-child(${event.target.subdivision + 1})`);
      if (el) {
        el.classList = 'highlight';
      }
    }, event.target.startTime - this.audioContext.currentTime);
  }

  increaseCounter () {
    this.#counter++;
    if (this.#counter >= this.model.beats.length) {
      this.#counter = 0;
    }
  }
}
