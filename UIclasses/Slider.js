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
        this.selected = false;
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
        let lastSelected = this.selected;
        let value = this.getValue();
        if (this.selected){
            let unclampedVal = ((window.mouse.x - this.x) * Math.cos(this.angle) + (window.mouse.y - this.y) * Math.sin(this.angle)) / this.length; // this projects the window.mouse position onto the slider's direction vector, gets the magnitude, and divides by the slider angle to get the new value
            let clampedVal = Math.min(Math.max(unclampedVal,0),1);
            if (clampedVal != value){
                this.updateValue(clampedVal);
            }
        }
        if (window.mouse.down && (this.selected || (((window.mouse.x - (this.x + Math.cos(this.angle) * this.length * value)) ** 2 + (window.mouse.y - (this.y + Math.sin(this.angle) * this.length * value)) ** 2) <= (this.thickness ** 2)))){
            this.selected = true;
        }else{
            this.selected = false;
        }
        return lastSelected && !this.selected;
    }
}