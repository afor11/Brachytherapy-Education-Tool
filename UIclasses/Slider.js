var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

export class Slider{
    constructor(x,y,length,angle,color,thickness,initalValue){
        this.x = x;
        this.y = y;
        this.length = length;
        this.angle = angle;
        this.color = color;
        this.thickness = thickness;
        this.value = initalValue;
        this.selected = false;
    }
    draw(){
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.thickness;
        ctx.beginPath();
        ctx.moveTo(this.x,this.y);
        ctx.lineTo(this.x + this.length * Math.cos(this.angle),this.y + this.length * Math.sin(this.angle));
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(
            this.x + this.value * this.length * Math.cos(this.angle),
            this.y + this.value * this.length * Math.sin(this.angle), this.thickness, 0, 2 * Math.PI
        );
        ctx.fill();
    }
    checkClicked(){
        if (this.selected){
            let unclampedVal = ((window.mouse.x - this.x) * Math.cos(this.angle) + (window.mouse.y - this.y) * Math.sin(this.angle)) / this.length; // this projects the window.mouse position onto the slider's direction vector, gets the magnitude, and divides by the slider angle to get the new value
            this.value = Math.max(Math.min(unclampedVal, 1), 0); //clamps value between 0 and 1
        }
        if ((window.mouse.down && (((window.mouse.x - (this.x + Math.cos(this.angle) * this.length * this.value)) ** 2 + (window.mouse.y - (this.y + Math.sin(this.angle) * this.length * this.value)) ** 2) <= (this.thickness ** 2)))){
            this.selected = true;
        }
        if (!window.mouse.down){
            this.selected = false;
        }
    }
}