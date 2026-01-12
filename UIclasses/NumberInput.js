import { getFontSize, runFn, clamp } from '../utils.js';
import { AlgebraicEffect, chainEffectHandler } from '../algebraicEffect.js';

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

export class NumberInput {
    constructor({x:x, y:y, width:width, height:height, label:{text:text, color: color}, bgColor:bgColor, getValue: getValue, onEnter: onEnter, numDecimalsEditing: numDecimalsEditing, mouseSlider = {active: false, min: 0, max: 0}}){
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
        this.mouseSlider = mouseSlider;
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

        if (this.recalcFontOnDraw){
            this.font = this.recalcFont(label);
        }

        ctx.fillStyle = this.bgColor[(this.editing ? "selected" : "notSelected")];
        ctx.beginPath();
        ctx.fillRect(this.x,this.y,this.width,this.height);

        ctx.font = this.font + "px Arial";
        ctx.fillStyle = this.color[(this.editing ? "selected" : "notSelected")];
        let textDimensions = ctx.measureText(label);
        let textHeight = textDimensions.actualBoundingBoxAscent + textDimensions.actualBoundingBoxDescent;

        ctx.save()

        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.clip();

        ctx.fillText(label, this.x + (this.width - textDimensions.width) / 2, this.y + textDimensions.actualBoundingBoxAscent + (this.height - textHeight) / 2);
        ctx.restore();
    }
    *checkClicked(){
        //if the mouse is not down, return nothing
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
                if (self.mouseSlider.min != self.mouseSlider.max){
                    // reactive mouse slider if the bounds have been set once finished editing
                    self.mouseSlider.active = true;
                }
                if (self.mouseSlider.active){
                    module.onMouseMove = module.defaultInputHandler.onMouseMove;
                    module.onMouseUp = module.defaultInputHandler.onMouseUp;
                }
                self.editing = false;
            }

            if (this.mouseSlider.active){
                // initalize label slider handling
                this.clickData = {
                    startTime: new Date(),
                    x: mouse.x,
                    y: mouse.y
                };

                let mouseMovedTooMuch = () => Math.abs(mouse.x - self.clickData.x) < 8 * Math.abs(mouse.y - self.clickData.y);
                let waitedTooLong = () => new Date().getTime() - self.clickData.startTime > 500;

                module.onMouseMove = function* (e) {
                    if (!self.mouseSlider.active){return}

                    // if self.clickData.startTime = -1, the user likely indended to use this element as a slider 
                    if (!mouseMovedTooMuch() && waitedTooLong()){
                        self.clickData.startTime = -1;
                    }

                    self.editing = false;
                    self.editingValue = yield* runFn(self.getValue());

                    if (!mouse.down || (mouseMovedTooMuch() || waitedTooLong()) && (self.clickData.startTime != -1)){
                        self.mouseSlider.active = false;
                        self.editing = true;
                        self.initalValue = yield* runFn(self.getValue());
                        return;
                    }

                    let min = yield* runFn(self.mouseSlider.min);
                    let max = yield* runFn(self.mouseSlider.max);
                    let value = clamp(
                        parseFloat(self.initalValue) + ((mouse.x - self.clickData.x) / (self.width / 2)) * (max - min),
                        min,
                        max
                    );
                    if (value != parseFloat(self.initalValue)){
                        yield* runFn(self.onEnter, value);
                    }
                    yield* runFn(module.defaultInputHandler.onMouseMove.call(this, e));
                    return true;
                }

                mouse.onMouseUp = function* (){
                    if (self.mouseSlider.active && waitedTooLong()){
                        yield* finishEditing(module, self);
                        return true;
                    }
                }
            }

            // initalize label text inputting
            module.onKeyDown = function* (e) {
                if (self.mouseSlider.active) {return}
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