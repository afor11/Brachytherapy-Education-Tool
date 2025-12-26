export class Module {
    constructor ({
        graphs,
        sliders,
        dropDowns,
        labels,
        buttons,
        onUpdate,
        onReload,
        onClick = function () { //takes in e and moduleData, but since this default function uses neither, they can be excluded
            ["dropDowns","sliders","labels","buttons"].forEach((obj) => {
                Object.values(this[obj]).forEach((attribute) => {
                    attribute.checkClicked();
                });
            });
        },
        onKeyDown = function (e) { //takes in e and moduleData, but since this default function uses only e, moduleData can be excluded
            Object.values(this.labels).forEach((label) => {
                label.checkEntry(e.key);
                console.log(e.key);
            });
        }
    }){
        this.graphs = graphs;
        this.sliders = sliders;
        this.dropDowns = dropDowns;
        this.labels = labels;
        this.buttons = buttons;
        this.onUpdate = onUpdate;
        this.onReload = onReload;
        this.onClick = onClick;
        this.clickHandled = true;
        this.onKeyDown = onKeyDown;
    }
}