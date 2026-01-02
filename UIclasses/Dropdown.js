import { EventFunction } from "../eventFunction.js";
import { buttonPress, nothing } from "../utils.js";
import { AlgebraicEffect, chainEffectHandler, effectHandler } from '../algebraicEffect.js';

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
    *draw(){ // this function does not have to be a genertor, but it is one for consistency
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
            yield* this.button.draw();
            for (let i = 0; i < this.options.length; i++){
                yield* this.options[i].draw();
            }
        }else{
            yield* this.button.draw();
        }
    }
    *checkClicked(){
        if (this.showing){
            for (let i = 0; i < this.options.length; i++){
                let self = this;
                let buttonClicked = yield* chainEffectHandler({
                    tryCode: function*(){
                        return yield* self.options[i].checkClicked();
                    },
                    handleCode: function*(effect, ind = 0) {
                        if (effect === "GET PARENT BY IND"){
                            if (ind == 0){
                                return self;
                            }else{
                                return (yield new AlgebraicEffect("GET PARENT BY IND", ind - 1));
                            }
                        }
                        if (effect === "GET PARENT"){
                            return self;
                        }
                    }
                });

                if (buttonClicked){
                    return true;
                }
            }
        }
        return yield yield* this.button.checkClicked();
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