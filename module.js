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
                // if the input event function is a generator function, execute
                // it until it yeilds a value other than nothing or it's done
                let inputEventGenerator = this[event].call(this,e);
                let nextFn = {done: false, value: nothing};
                while (
                    (
                        (typeof nextFn.value === "undefined")
                        || nextFn.value.isNothing
                    ) && !nextFn.done
                ){
                    nextFn = inputEventGenerator.next();
                }
                if (typeof nextFn.value === "function"){
                    nextFn.value.call(this);
                }
                if (typeof nextFn.value === "object"){
                    nextFn.value.func.call({module: this, self: nextFn.value.self});
                }
            }else{
                // otherwise simply call the function
                this[event].call(this,e);
            }
        }else if (typeof this[event] === "object"){
            this[event].func.call({module: this, self: this[event].self}, e);
        }
    }
}