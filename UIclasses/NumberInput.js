import {getFontSize} from '/UIclasses/getFontSize.js';

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

export class NumberInput {
    constructor({x:x, y:y, width:width, height:height, label:{text:text, color: color}, bgColor:bgColor, getValue: getValue, onEnter: onEnter, numDecimalsEditing: numDecimalsEditing}){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.bgColor = bgColor;
        this.editing = false;
        this.numDecimalsEditing = numDecimalsEditing;
        this.value = () => (this.editing ? ((this.editingValue.length > 0) ? this.editingValue : "0") : getValue().toFixed(this.numDecimalsEditing).toString());
        this.valueToText = text;
        this.label = () => this.valueToText(this.value());
        this.editingValue = this.value();
        this.initalValue = this.value();
        this.onEnter = onEnter;
        this.recalcFont();
    }
    draw(){
        this.recalcFont();
        ctx.fillStyle = this.bgColor[(this.editing ? "selected" : "notSelected")];
        ctx.beginPath();
        ctx.fillRect(this.x,this.y,this.width,this.height);
        ctx.font = this.font;
        ctx.fillStyle = this.color[(this.editing ? "selected" : "notSelected")];
        let textDimensions = ctx.measureText(this.label());
        let textHeight = textDimensions.actualBoundingBoxAscent + textDimensions.actualBoundingBoxDescent;
        ctx.beginPath();
        ctx.fillText(this.label(), this.x + (this.width - textDimensions.width) / 2, this.y + textDimensions.actualBoundingBoxAscent + (this.height - textHeight) / 2);
    }
    checkClicked(){
        if (window.mouse.down && this.hovering()){
            this.editingValue = this.value();
            this.initalValue = this.value();
            this.editing = true;
        }else{
            if (this.editing){
                if (this.getEditedValue() != this.initalValue){
                    this.onEnter(this.getEditedValue());
                }
                this.editing = false;
            }
        }
        return this.editing;
    }
    checkEntry(key){
        if (this.editing){
            if ("1234567890.".includes(key) && (this.editingValue.includes(".") ? ((this.editingValue.length - this.editingValue.indexOf(".") - 1) < this.numDecimalsEditing) : true)){
                this.editingValue += key;
            }
            if (key === "Enter"){
                if (this.getEditedValue() != this.initalValue){
                    this.onEnter(this.getEditedValue());
                }
                this.editing = false;
            }
            if ((key === "Backspace") && (this.editingValue.length > 0)){
                this.editingValue = this.editingValue.substring(0,this.editingValue.length - 1);
            }
        }
    }
    getEditedValue(){
        if (this.editingValue === ""){
            return 0;
        }else{
            return parseFloat(this.editingValue)
        }
    }
    recalcFont(){
        this.font = getFontSize(this.width * 0.8,this.height * 0.6,this.label(),(size) => `${size}px monospace`) + "px monospace";
    }
    hovering(){
        return ((window.mouse.x >= this.x) && (window.mouse.x <= this.x + this.width) && (window.mouse.y >= this.y) && (window.mouse.y <= this.y + this.height));
    }
}