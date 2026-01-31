import { AlgebraicEffect, chainEffectHandler } from '../algebraicEffect.js';

export class Dropdown {
    constructor(button, options){
        this.button = button;
        this.button.onClick = () => {
            this.showing = !this.showing;
        }
        this.options = options;
        this.showing = false;
        this.uniformFont = true;
        this.recalcFontOnDraw = true;
    }
    *draw(){ // this function does not have to be a genertor, but it is one for consistency
        yield* handleChildren(
            this,
            function*(){
                if (this.showing){
                    if (this.uniformFont){
                        let font;
                        if (this.recalcFontOnDraw){
                            font = this.normalizeFont() + "px Arial";
                        }else{
                            font = this.button.font;
                        }
                        this.options.forEach((option) => {
                            if (typeof option.button !== "undefined"){
                                option.button.font = font;
                            }else{
                                option.font = font;
                            }
                        });
                    }
                    for (let i = 0; i < this.options.length; i++){
                        yield* this.options[i].draw();
                    }
                    yield* this.button.draw();
                }else{
                    yield* this.button.draw();
                }
            }
        );
    }
    normalizeFont(){
        return this.options.reduce((minFont,option) => {
            if (typeof option.button !== "undefined"){
                return Math.min(minFont,option.button.getDefaultFont());
            }else{
                return Math.min(minFont,option.getDefaultFont());
            }
        }, Infinity);
    }
    *checkClicked(){
        if (this.showing){
            for (let i = 0; i < this.options.length; i++){
                let self = this;
                let buttonClicked = yield* handleChildren(
                    this,
                    function*(){
                        return yield* self.options[i].checkClicked();
                    }
                );

                if (buttonClicked){
                    return true;
                }
            }
        }
        return yield* this.button.checkClicked();
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

function* handleChildren(self, tryCode) {
    return yield* chainEffectHandler({
        tryCode: tryCode.bind(self),
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
}