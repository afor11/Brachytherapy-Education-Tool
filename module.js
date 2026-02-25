import { AlgebraicEffect } from "./algebraicEffect.js";
import { nothing } from "./utils.js";

export class Module {
    constructor ({
        graphs,
        sliders,
        dropDowns,
        labels,
        buttons,
        onUpdate,
        onReload,
        defaultInputHandler: {
            onMouseMove = nothing,
            onMouseDown = function* () {
                let self = yield new AlgebraicEffect("GET MODULE");
                for (let obj of ["dropDowns","sliders","labels","buttons"]) {
                    if (typeof self[obj] !== "undefined"){
                        for (let attribute of Object.values(self[obj])) {
                            yield* attribute.checkClicked();
                        }
                    }
                }
            },
            onMouseUp = nothing,
            onKeyDown = nothing
        },
        specialVars
    }){
        if (typeof specialVars === "object"){
            Object.keys(specialVars).forEach((arg) => {
                this[arg] = specialVars[arg];
            });
        }

        this.graphs = graphs;
        this.sliders = sliders;
        this.dropDowns = dropDowns;
        this.labels = labels;
        this.buttons = buttons;
        this.onUpdate = onUpdate.bind(this);
        this.onReload = onReload.bind(this);

        // normal functions are to be used for mouse events, arrow
        // functions are to be passed back by clicked elements to
        // instruct module updates
        this.onMouseMove = onMouseMove;
        this.onMouseDown = onMouseDown;
        this.onMouseUp = onMouseUp;
        this.onKeyDown = onKeyDown;

        // define run attribute of input event functions (used for handling the
        // special execution of generator functions)

        this.defaultInputHandler = {
            onMouseMove: this.onMouseMove.bind(this),
            onMouseDown: this.onMouseDown.bind(this),
            onMouseUp: this.onMouseUp.bind(this),
            onKeyDown: this.onKeyDown.bind(this)
        };
    }
}