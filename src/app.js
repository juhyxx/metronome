import { SubdivisionsSelector } from "./components/SubdivisionsSelector.js"
import { SoundSelector } from "./components/SoundSelector.js";
import { MemManager } from "./components/MemManager.js";
import { TapTempoButton } from "./components/TapTempoButton.js";
import { VolumeSelector } from "./components/VolumeSelector.js";
import { TempoSelector } from "./components/TempoSelector.js";
import { BeatSelector } from "./components/BeatSelector.js";
import { BeatItem } from "./components/BeatItem.js";
import { Model } from "./Model.js";
import { Controller } from "./Controller.js";
import { BeatMonitor } from "./components/BeatMonitor.js";

customElements.define('subdivisions-selector', SubdivisionsSelector);
customElements.define('sound-selector', SoundSelector);
customElements.define('mem-manager', MemManager);
customElements.define('tap-tempo', TapTempoButton);
customElements.define('volume-selector', VolumeSelector);
customElements.define('tempo-selector', TempoSelector);
customElements.define('beat-selector', BeatSelector);
customElements.define('beat-item', BeatItem);
customElements.define('beat-monitor', BeatMonitor);

window.AudioContext = window.AudioContext || window.webkitAudioContext;

window.addEventListener('DOMContentLoaded', () => {
    const model = new Model();
    const controller = new Controller(model);
    model.loadAudioData();
    model.propertyChangedCallback = (property, value) => {
        controller.updateProperty(property, value);
    };
    model.deserialize();
});