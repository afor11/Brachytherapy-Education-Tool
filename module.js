export class Module {
    constructor ({
        graphs,
        sliders,
        dropDowns,
        labels,
        buttons,
        onUpdate,
        onReload,
        defaultInputHandler = {
            onMouseMove,
            onMouseDown,
            onKeyDown
        }
    }){
        this.graphs = graphs;
        this.sliders = sliders;
        this.dropDowns = dropDowns;
        this.labels = labels;
        this.buttons = buttons;
        this.onUpdate = onUpdate;
        this.onReload = onReload;
        if (typeof defaultInputHandler.onMouseMove !== "undefined"){
            this.onMouseMove = defaultInputHandler.onMouseMove;
        }else{
            this.onMouseMove = function() {};
        }
        if (typeof defaultInputHandler.onMouseDown !== "undefined"){
            this.onMouseDown = defaultInputHandler.onMouseDown;
        }else{
            this.onMouseDown = function() { //takes in e and moduleData, but since this default function uses neither, they can be excluded
                ["dropDowns","sliders","labels","buttons"].forEach((obj) => {
                    if (typeof this[obj] !== "undefined"){
                        Object.values(this[obj]).forEach((attribute) => {
                            attribute.checkClicked();
                        });
                    }
                });
            };
        }
        if (typeof defaultInputHandler.onMouseDown !== "undefined"){
            this.onMouseDown = defaultInputHandler.onMouseDown;
        }else{
            this.onKeyDown = function(e) { //takes in e and moduleData, but since this default function uses only e, moduleData can be excluded
                Object.values(this.labels).forEach((label) => {
                    label.checkEntry(e.key);
                    console.log(e.key);
                });
            };
        }
        this.defaultInputHandler = {
            onMouseMove: this.onMouseMove,
            onMouseDown: this.onMouseDown,
            onKeyDown: this.onKeyDown
        };
    }
}