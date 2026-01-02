import { getFontSize, buttonPress, nothing, runFn } from '../utils.js';
import { EventFunction } from '../eventFunction.js';
import { AlgebraicEffect, chainEffectHandler, effectHandler } from '../algebraicEffect.js';

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

export class Button {
    constructor({x:x, y:y, width:width, height:height, label:{text:label, font:font, color: color}, bgColor:bgColor, onClick:onClick, outline:{color:outlineColor, thickness:outlineThickness}}){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.label = label;
        this.font = font;
        this.bgColor = bgColor;
        this.fontColor = color;
        this.onClick = onClick;
        this.outlineColor = outlineColor;
        this.outlineThickness = outlineThickness;
    }
    *draw(){ // this function does not have to be a genertor, but it is one for consistency
        if (this.font === "default"){
            ctx.font = this.getDefaultFont() + "px Arial";
        }else{
            ctx.font = this.font;
        }
        let textDimensions = ctx.measureText(this.label);
        let textHeight = textDimensions.actualBoundingBoxAscent + textDimensions.actualBoundingBoxDescent;
        if (this.outlineThickness > 0){
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = this.outlineThickness;
            ctx.beginPath();
            ctx.rect(this.x,this.y,this.width,this.height);
            ctx.stroke();
        }
        ctx.fillStyle = this.bgColor;
        ctx.beginPath();
        ctx.fillRect(this.x,this.y,this.width,this.height);
        ctx.fillStyle = this.fontColor;
        ctx.fillText(this.label, this.x + (this.width - textDimensions.width) / 2, this.y + textDimensions.actualBoundingBoxAscent + (this.height - textHeight) / 2);
    }
    getDefaultFont(padding = {horizontal: 0.2, vertical: 0.4}){
        return getFontSize(
            this.width * (1 - padding.horizontal),
            this.height * (1 - padding.vertical),
            this.label,(size) => `${size}px Arial`
        );
    }
    *checkClicked(){
        if (window.mouse.down && this.hovering()){
            let self = this;
            yield* chainEffectHandler({
                tryCode: function*(){
                    let self = yield new AlgebraicEffect("GET SELF");
                    yield* runFn(self.onClick);
                },
                handleCode: function*(effect) {
                    if (effect === "GET SELF"){
                        return self;
                    }
                }
            });
            return true;
        }
        return false;
    }
    hovering(){
        return ((window.mouse.x >= this.x) && (window.mouse.x <= this.x + this.width) && (window.mouse.y >= this.y) && (window.mouse.y <= this.y + this.height));
    }
}