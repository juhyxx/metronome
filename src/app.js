import { SubdivisionsSelector } from "./components/SubdivisionsSelector.js"
import { SoundSelector } from "./components/SoundSelector.js";
import { MemManager } from "./components/MemManager.js";
import { TapTempoButton } from "./components/TapTempoButton.js";
import { VolumeSelector } from "./components/VolumeSelector.js";
import { TempoSelector } from "./components/TempoSelector.js";


import { Model } from "./model.js";
import { Controller } from "./controller.js";

customElements.define('subdivisions-selector', SubdivisionsSelector);
customElements.define('sound-selector', SoundSelector);
customElements.define('mem-manager', MemManager);
customElements.define('tap-tempo', TapTempoButton);
customElements.define('volume-selector', VolumeSelector);
customElements.define('tempo-selector', TempoSelector);

window.AudioContext = window.AudioContext || window.webkitAudioContext;

window.addEventListener('DOMContentLoaded', () => {
    const model = new Model();
    const controller = new Controller(model);
    model.loadAudioData();
    model.propertyChangedCallback = (property, value) => {
        controller.updateProperty(property, value);
    };
});