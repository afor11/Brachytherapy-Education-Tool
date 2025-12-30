import { EventFunction } from "../eventFunction.js";
import { buttonPress, nothing } from "../utils.js";

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
                }, Infinity) + "px Arial";
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
        //initally nothing is clicked
        let clicked = nothing;
        if (this.showing){
            this.options.forEach((button) => {
                //check if an option button is clicked
                let buttonClicked = button.checkClicked();

                //if the button is clicked and nothing else is clicked
                if (!buttonClicked.isNothing && clicked.isNothing){
                    //set clicked to the buttonClicked function
                    clicked = buttonClicked;
                    if (typeof buttonClicked.self !== "undefined"){
                        if (typeof clicked.self.parent !== "undefined"){
                            let parent = clicked.self.parent;
                            while (typeof parent.parent !== "undefined"){
                                parent = parent.parent;
                            }
                            parent.parent = this;
                        }else{
                            clicked.self.parent = this;
                        }
                    }
                }
            });
        }
        //if nothing is still clicked
        if (clicked.isNothing){
            //set clicked to the checkClicked() function of the button
            return this.button.checkClicked();
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