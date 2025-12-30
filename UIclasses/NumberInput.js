import { getFontSize, buttonPress, nothing, eventHandled } from '../utils.js';
import { EventFunction } from '../eventFunction.js';

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
        //if the mouse is not down, return nothing
        if (!window.mouse.down){
            return nothing;
        }

        //if the mouse is down, hovering, and not editing, set inital values
        // and return a button press
        if (this.hovering() && !this.editing){
            this.editingValue = this.value();
            this.initalValue = this.value();
            this.editing = true;
            return new EventFunction({
                self: this,
                func: function() {
                    let finishEditing = () => {
                        if (this.self.getEditedValue() != this.self.initalValue){
                            this.self.onEnter.call(this, this.self.getEditedValue());
                        }
                        this.module.onKeyDown = this.module.defaultInputHandler.onKeyDown;
                        this.module.onMouseDown = this.module.defaultInputHandler.onMouseDown;
                        this.self.editing = false;
                    }
                    this.module.onKeyDown = new EventFunction({
                        self: this.self,
                        func: function (e) {
                            let numDecimals = (
                                this.self.editingValue.includes(".") ?
                                    this.self.editingValue.length - 1 - this.self.editingValue.indexOf(".")
                                :
                                    0
                            );
                            if ("1234567890".includes(e.key) && (numDecimals < this.self.numDecimalsEditing)){
                                this.self.editingValue += e.key;
                                return eventHandled;
                            }
                            if ((e.key === ".") && (numDecimals == 0)){
                                this.self.editingValue += ".";
                                return eventHandled;
                            }
                            if (e.key === "Enter"){
                                finishEditing();
                                return eventHandled;
                            }
                            if ((e.key === "Backspace") && (this.self.editingValue.length > 0)){
                                this.self.editingValue = this.self.editingValue.substring(0,this.self.editingValue.length - 1);
                                return eventHandled;
                            }
                        }
                    });

                    this.module.onMouseDown = function () {
                        finishEditing();
                        return eventHandled;
                    }
                }
            });
        }else{
            //if the editing was not just initalized, finish the editing
            // mode and return buttonPress
            if (this.editing){
                this.editing = false;
                if (this.getEditedValue() != this.initalValue){
                    return new EventFunction({
                        self: this,
                        func: function() {
                            this.self.onEnter(this.self.getEditedValue());
                        }
                    });
                }
                return buttonPress;
            }
        }
        return nothing;
    }
    getEditedValue(){
        if (this.editingValue === ""){
            return 0;
        }else{
            return parseFloat(this.editingValue)
        }
    }
    recalcFont(){
        this.font = getFontSize(this.width * 0.8,this.height * 0.6,this.label(),(size) => `${size}px Arial`) + "px Arial";
    }
    hovering(){
        return ((window.mouse.x >= this.x) && (window.mouse.x <= this.x + this.width) && (window.mouse.y >= this.y) && (window.mouse.y <= this.y + this.height));
    }
}