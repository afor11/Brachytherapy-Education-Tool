import { runFn } from '../utils.js';
import { AlgebraicEffect, chainEffectHandler } from '../algebraicEffect.js';

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

export class Slider{
    constructor({x,y,length,angle,color,thickness,getValue,updateValue}){
        this.x = x;
        this.y = y;
        this.length = length;
        this.angle = angle;
        this.color = color;
        this.thickness = thickness;
        this.getValue = getValue;
        this.updateValue = updateValue;
    }
    *value(){
        let self = this;
        return yield* chainEffectHandler({
            tryCode: function* (){
                let self = yield new AlgebraicEffect("GET SELF");
                return yield* runFn(self.getValue)
            },
            handleCode: function* (effect){
                if (effect === "GET SELF"){
                    return self;
                }
            }
        });
    }
    *draw(){
        let value = yield* this.value();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.thickness;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(this.x,this.y);
        ctx.lineTo(this.x + this.length * Math.cos(this.angle),this.y + this.length * Math.sin(this.angle));
        ctx.stroke();
        ctx.lineCap = "butt";
        ctx.beginPath();
        ctx.arc(
            this.x + value * this.length * Math.cos(this.angle),
            this.y + value * this.length * Math.sin(this.angle), this.thickness, 0, 2 * Math.PI
        );
        ctx.fill();
    }
    *checkClicked(){
        let value = yield* this.value();

        if (
            window.mouse.down
            && (
                ((window.mouse.x - (this.x + Math.cos(this.angle) * this.length * value)) ** 2
                    + (window.mouse.y - (this.y + Math.sin(this.angle) * this.length * value)) ** 2)
                <= (this.thickness ** 2)
            )
        ){
            let module = yield new AlgebraicEffect("GET MODULE");
            let self = this;
            // set the onMouseMove function of the module so that when the
            // mouse moves, it calls the .update function of the slider
            module.onMouseMove = function*() {
                // this projects the window.mouse position onto the slider's
                // direction vector, gets the magnitude, and divides by the
                // slider length to get the new value

                let unclampedVal = (
                    (window.mouse.x - self.x) * Math.cos(self.angle)
                    + (window.mouse.y - self.y) * Math.sin(self.angle)
                ) / self.length;

                let clampedVal = Math.min(Math.max(unclampedVal,0),1);
                if (clampedVal != (yield* self.value())){
                    yield* self.updateValue(clampedVal);
                }
            };

            module.onMouseUp = function () {
                module.onMouseMove = module.defaultInputHandler.onMouseMove;
                module.onMouseUp = module.defaultInputHandler.onMouseUp;
            }
            return true;
}
        return false;
    }
}