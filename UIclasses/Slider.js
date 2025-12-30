import { nothing } from '../utils.js';
import { EventFunction } from '../eventFunction.js';

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
    draw(){
        let value = this.getValue();
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.thickness;
        ctx.beginPath();
        ctx.moveTo(this.x,this.y);
        ctx.lineTo(this.x + this.length * Math.cos(this.angle),this.y + this.length * Math.sin(this.angle));
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(
            this.x + value * this.length * Math.cos(this.angle),
            this.y + value * this.length * Math.sin(this.angle), this.thickness, 0, 2 * Math.PI
        );
        ctx.fill();
    }
    checkClicked(){
        let value = this.getValue();

        if (
            window.mouse.down
            && (
                ((window.mouse.x - (this.x + Math.cos(this.angle) * this.length * value)) ** 2
                    + (window.mouse.y - (this.y + Math.sin(this.angle) * this.length * value)) ** 2)
                <= (this.thickness ** 2)
            )
        ){
            return new EventFunction({
                self: this,
                func: function() {
                    // set the onMouseMove function of the module so that when the
                    // mouse moves, it calls the .update function of the slider
                    this.module.onMouseMove = new EventFunction({
                        self: this.self,
                        func: function() {
                            // this projects the window.mouse position onto the slider's
                            // direction vector, gets the magnitude, and divides by the
                            // slider length to get the new value

                            let unclampedVal = (
                                (window.mouse.x - this.self.x) * Math.cos(this.self.angle)
                                + (window.mouse.y - this.self.y) * Math.sin(this.self.angle)
                            ) / this.self.length;

                            let clampedVal = Math.min(Math.max(unclampedVal,0),1);
                            if (clampedVal != this.self.getValue()){
                                this.self.updateValue.call(this, clampedVal);
                            }
                        }
                    });

                    // set the onMouseUp function such that when the user releases 
                    // the mouse, it resets the onMouseMove and onMouseUp functions
                    // you use this instead of this.module to get the module because
                    // the function is not wrapped in an EventFunction object
                    this.module.onMouseUp = function () {
                        this.onMouseMove = this.defaultInputHandler.onMouseMove;
                        this.onMouseUp = this.defaultInputHandler.onMouseUp;
                    }
                }
            });
        }else{
            return nothing;
        }
    }
}