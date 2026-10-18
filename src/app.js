import { BeatItem } from './components/BeatItem.js';
import { BeatMonitor } from './components/BeatMonitor.js';
import { BeatSelector } from './components/BeatSelector.js';
import { MemManager } from './components/MemManager.js';
import { SoundSelector } from './components/SoundSelector.js';
import { SubdivisionsSelector } from './components/SubdivisionsSelector.js';
import { TapTempoButton } from './components/TapTempoButton.js';
import { TempoSelector } from './components/TempoSelector.js';
import { VolumeSelector } from './components/VolumeSelector.js';
import { Controller } from './Controller.js';
import { Model } from './Model.js';
import { WaveSound } from './Sound.js';

customElements.define('beat-item', BeatItem);
customElements.define('beat-monitor', BeatMonitor);
customElements.define('beat-selector', BeatSelector);
customElements.define('mem-manager', MemManager);
customElements.define('sound-selector', SoundSelector);
customElements.define('subdivisions-selector', SubdivisionsSelector);
customElements.define('tap-tempo', TapTempoButton);
customElements.define('tempo-selector', TempoSelector);
customElements.define('volume-selector', VolumeSelector);

// module scripts run once the document is parsed, so all elements are in place
const model = new Model();
new Controller(model); // eslint-disable-line no-new
new WaveSound(model); // eslint-disable-line no-new
model.restore();
