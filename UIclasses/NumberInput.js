import { getFontSize, runFn } from '../utils.js';
import { AlgebraicEffect, chainEffectHandler } from '../algebraicEffect.js';
import { runAnimation } from './Button.js';

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

export class NumberInput {
    constructor({x:x, y:y, width:width, height:height, label:{text:text, color: color}, bgColor:bgColor, getValue: getValue, onEnter: onEnter, numDecimalsEditing: numDecimalsEditing, animate = function* () {}, hoverCol = {selected: "black" ,notSelected: "#D3D3D3"}}){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.bgColor = bgColor;
        this.editing = false;
        this.numDecimalsEditing = numDecimalsEditing;
        this.value = function*() {
            let self = yield new AlgebraicEffect("GET SELF");
            if (self.editing){
                if (self.editingValue.length > 0){
                    return self.editingValue;
                }else{
                    return "0";
                }
            }
            let value = yield* runFn(getValue);
            return value.toFixed(self.numDecimalsEditing).toString();
        };
        this.valueToText = text;
        this.label = function* () {
            let self = yield new AlgebraicEffect("GET SELF");
            return self.valueToText(yield* self.value());
        }
        this.editingValue = 0;
        this.initalValue = 0;
        this.onEnter = onEnter;
        this.recalcFontOnDraw = true;
        this.font = "";
        this.animate = animate;
        this.hoverCol = hoverCol;
    }
    *getValue(){
        let self = this;
        return yield* chainEffectHandler({
            tryCode: function*() {
                return yield* self.value();
            },
            handleCode: function*(effect){
                if (effect === "GET SELF"){
                    return self;
                }
            }
        });
    }
    *draw(){
        let self = this;
        let label = yield* chainEffectHandler({
            tryCode: function*(){
                let self = yield new AlgebraicEffect("GET SELF");
                return yield* runFn(self.label);
            },
            handleCode: function*(effect){
                if (effect === "GET SELF"){
                    return self;
                }
            }
        });

        yield* runAnimation.call(this);

        if (this.recalcFontOnDraw){
            this.font = this.recalcFont(label);
        }

        ctx.fillStyle = this.hovering() ?
            this.hoverCol[(this.editing ? "selected" : "notSelected")]
        :
            this.bgColor[(this.editing ? "selected" : "notSelected")];
        ctx.beginPath();
        ctx.fillRect(this.x,this.y,this.width,this.height);

        ctx.font = this.font + "px Arial";
        ctx.fillStyle = this.color[(this.editing ? "selected" : "notSelected")];
        let textDimensions = ctx.measureText(label);
        let textHeight = textDimensions.actualBoundingBoxAscent + textDimensions.actualBoundingBoxDescent;

        ctx.save();

        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.clip();

        ctx.fillText(label, this.x + (this.width - textDimensions.width) / 2, this.y + textDimensions.actualBoundingBoxAscent + (this.height - textHeight) / 2);
        ctx.restore();
    }
    *checkClicked(){
        if (!window.mouse.down){
            return false;
        }

        //if the mouse is down, hovering, and not editing, set inital values
        // and return a button press
        if (this.hovering() && !this.editing){
            this.editingValue = yield* this.getValue();
            this.initalValue = yield* this.getValue();
            this.editing = true;
            let module = yield new AlgebraicEffect("GET MODULE");
            let self = this;
            let finishEditing = function* (module, self) {
                if (!Number.isNaN(self.getEditedValue()) && (self.getEditedValue() != self.initalValue)){
                    yield* runFn(self.onEnter,self.getEditedValue());
                }
                module.onKeyDown = module.defaultInputHandler.onKeyDown;
                module.onMouseDown = module.defaultInputHandler.onMouseDown;
                self.editing = false;
            }

            // initalize label text inputting
            module.onKeyDown = function* (e) {
                let numDecimals = (
                    self.editingValue.includes(".") ?
                        self.editingValue.length - 1 - self.editingValue.indexOf(".")
                    :
                        0
                );
                if ("1234567890".includes(e.key) && (numDecimals < self.numDecimalsEditing)){
                    self.editingValue += e.key;
                    return true;
                }
                if ((e.key === ".") && (numDecimals == 0)){
                    self.editingValue += ".";
                    return true;
                }
                if (
                    "1234567890.".includes(e.key)
                    && (self.getEditedValue() == parseFloat(self.initalValue))
                ){
                    self.editingValue = e.key;
                    return true;
                }
                if (e.key === "Enter"){
                    yield* finishEditing(module, self);
                    return true;
                }
                if ((e.key === "Backspace") && (self.editingValue.length > 0)){
                    self.editingValue = self.editingValue.substring(0,self.editingValue.length - 1);
                    return true;
                }
            };

            let currMouseDown = module.onMouseDown;
            module.onMouseDown = function* (e) {
                yield* finishEditing(module, self);
                yield* currMouseDown.call(this, e);
                return true;
            }
            return true;
        }else{
            //if the editing was not just initalized, finish the editing
            // mode and return buttonPress
            if (this.editing){
                this.editing = false;
                if (this.getEditedValue() != this.initalValue){
                    yield* runFn(this.onEnter,this.getEditedValue());
                }
                return true;
            }
        }
        return false;
    }
    getEditedValue(){
        if (this.editingValue === ""){
            return 0;
        }else{
            return parseFloat(this.editingValue)
        }
    }
    recalcFont(label){
        return getFontSize(this.width * 0.8,this.height * 0.6,label,(size) => `${size}px Arial`);
    }
    hovering(){
        return ((window.mouse.x >= this.x) && (window.mouse.x <= this.x + this.width) && (window.mouse.y >= this.y) && (window.mouse.y <= this.y + this.height));
    }
}