export class Module {
    constructor ({
        graphs,
        sliders,
        dropDowns,
        labels,
        buttons,
        onUpdate,
        onReload,
        onClick
    }){
        this.graphs = graphs;
        this.sliders = sliders;
        this.dropDowns = dropDowns;
        this.labels = labels;
        this.buttons = buttons;
        this.onUpdate = onUpdate;
        this.onReload = onReload;
        this.onClick;
        if (typeof onClick === "undefined"){
            this.onClick = function () {
                ["dropDowns","sliders","labels","buttons"].forEach((obj) => {
                    Object.values(this[obj]).forEach((attribute) => {
                        attribute.checkClicked();
                    });
                });
            }
        }else{
            this.onClick = onClick;
        }
    }
}