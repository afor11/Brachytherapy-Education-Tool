import { ctx } from './main.js';

export class Module {
    constructor ({
        graphs,
        sliders,
        dropDowns,
        labels,
        buttons,
        onUpdate,
        onRescale
    }){
        this.graphs = graphs;
        this.sliders = sliders;
        this.dropDowns = dropDowns;
        this.labels = labels;
        this.buttons = buttons;
        this.onUpdate = onUpdate;
        this.onRescale = onRescale;
    }
}