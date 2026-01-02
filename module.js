import { nothing } from "./utils.js";
import { AlgebraicEffect, effectHandler } from './algebraicEffect.js';

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
            onMouseDown = function () {
                ["dropDowns","sliders","labels","buttons"].forEach((obj) => {
                    if (typeof this[obj] !== "undefined"){
                        Object.values(this[obj]).forEach((attribute) => {
                            attribute.checkClicked();
                        });
                    }
                });
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
        this.onUpdate = onUpdate;
        this.onReload = onReload;

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
            onMouseMove: this.onMouseMove,
            onMouseDown: this.onMouseDown,
            onMouseUp: this.onMouseUp,
            onKeyDown: this.onKeyDown
        };
    }
    eventHandler(event, e) {
        if (typeof this[event] === "function"){
            if (this[event].constructor.name === "GeneratorFunction"){
                // if the event function is a generator function, handle its effects
                effectHandler({
                    tryCode: this[event](e),
                    handleCode: (effect) => {
                        if (effect === "GET MODULE"){
                            return this;
                        }
                    }
                });
            }else{
                // otherwise simply call the function
                this[event].call(this,e);
            }
        }else if (typeof this[event] === "object"){
            this[event].func.call({module: this, self: this[event].self}, e);
        }
    }
}