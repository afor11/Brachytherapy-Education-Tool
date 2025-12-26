export class Dropdown {
    constructor(button, options){
        this.button = button;
        this.button.onClick = () => {
            this.showing = !this.showing;
        }
        this.options = options;
        this.showing = false;
        this.uniformFont = true;
    }
    draw(){
        if (this.showing){
            if (this.uniformFont){
                let font = this.options.reduce((minFont,option) => {
                    if (typeof option.button !== "undefined"){
                        return Math.min(minFont,option.button.getDefaultFont());
                    }else{
                        return Math.min(minFont,option.getDefaultFont());
                    }
                }, Infinity) + "px monospace";
                this.options.forEach((option) => {
                    if (typeof option.button !== "undefined"){
                        option.button.font = font;
                    }else{
                        option.font = font;
                    }
                });
            }
            this.button.draw();
            this.options.forEach((opt) => {
                opt.draw();
            });
        }else{
            this.button.draw();
        }
    }
    checkClicked(){
        let clicked = this.button.checkClicked();
        if (this.showing){
            this.options.forEach((button) => {
                clicked = clicked || button.checkClicked();
            });
        }
        return clicked;
    }
    collapseDropdown(){
        this.showing = false;
        this.options.forEach((option) => {
            if (option.showing){
                option.collapseDropdown();
            }
        });
    }
}