import { conversionFactors, airKermaSliderLimits } from './constants.js';
import { Button } from './UIclasses/Button.js';
import { Dropdown } from './UIclasses/Dropdown.js';
import { NumberInput } from './UIclasses/NumberInput.js';
import { Slider } from './UIclasses/Slider.js';
import { AlgebraicEffect, effectHandler, chainEffectHandler } from './algebraicEffect.js';

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// get the magintude of a 3D vector
export function magnitude(vec){
    return Math.sqrt(vec.x ** 2 + vec.y ** 2 + vec.z ** 2);
}

export function distance(vec1, vec2){
    return (
        (vec1.length != vec2.length) ?
            0
        :
            Math.sqrt(vec1.reduce(
                (dist, component, ind) => dist + (component - vec2[ind]) ** 2
                ,0
            )
        )
    );
}

export function* runUntilTrue(func){
    let nextValue = {value: undefined, done: false};
    let generatorFunc = func();
    let args = undefined;
    while (!nextValue.done && (nextValue.value != true)){
        nextValue = generatorFunc.next(args);
        if (nextValue.value?.constructor.name === "AlgebraicEffect"){
            args = yield nextValue.value;
        }else{
            args = undefined;
        }
    }
}

export function interpolateTable(dataArr,spacingArr,ind){
    let neighborHigh = Math.min(getInterpolationIndex(spacingArr,ind),spacingArr.length);
    let neighborLow = Math.max(neighborHigh - 1,0);
    if (neighborHigh == neighborLow) {
        return dataArr[neighborLow];
    }
    return (
        lerp(
            dataArr[neighborLow],
            dataArr[neighborHigh],
            (ind - spacingArr[neighborLow]) / (spacingArr[neighborHigh] - spacingArr[neighborLow])
        )
    );
}

export function biliniarInterpolateTable(data,xSpacing,ySpacing,x,y){
    let x2 = Math.min(getInterpolationIndex(xSpacing,x),xSpacing.length);
    let x1 = Math.max(x2 - 1,0);
    let y2 = Math.min(getInterpolationIndex(ySpacing,y),ySpacing.length);
    let y1 = Math.max(y2 - 1,0);
    return lerp(
        lerp(data[x1][y1],data[x2][y1],(x - xSpacing[x1]) / (xSpacing[x2] - xSpacing[x1])),
        lerp(data[x1][y2],data[x2][y2],(x - xSpacing[x1]) / (xSpacing[x2] - xSpacing[x1])),
        (y - ySpacing[y1]) / (ySpacing[y2] - ySpacing[y1])
    );
}

//helper function for interpolate table and bilinear interpolate
function getInterpolationIndex(spacingArr,ind){
    for (let i = 0; i < spacingArr.length; i++){
        if (spacingArr[i] >= ind){
            return i;
        }
    }
    return spacingArr.length - 1;
}

export function lerp(a,b,t){
    return (a == b) ? a : (a + (t * (b - a)));
}


// binary searches for the best font size to match a given width and height knowing the text to be drawn and a function that takes a
// font size and returns the string representing that font, for example (size) => `${size}px monospace`
export function getFontSize(width,height,label,font){
    if (!width || !height || !label || !font){return 0}
    let metrics = ctx.measureText(label);
    let size = {min: 0, max: 200};
    let checkFont = () => {
        ctx.font = font((size.min + size.max) / 2);
        metrics = ctx.measureText(label);
        return ((metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft) < width) && ((metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) < height)
    };
    let validFont = false;
    for (let i = 0; (i < 10) || !validFont; i++) { // binary search for best font size based on width and height intil i > 10 and checkFont() is true
        if (validFont){
            size.min = (size.min + size.max) / 2;
        }else{
            size.max = (size.min + size.max) / 2;
        }
        validFont = checkFont()
    }
    return (size.min + size.max) / 2;
}

export function getMin(arr){
    return Math.min(...arr);
}

export function getMax(arr){
    return Math.max(...arr);
}

export function convertUnit(unit,newUnit){
    return parseFloat(unit.split(" ")[0]) * conversionFactors[newUnit][unit.split(" ")[1]];
}

export function cloneObj(obj){
    return JSON.parse(JSON.stringify(obj));
}

export function clone(obj){
    // (I later found this article: https://medium.com/@ayogesh1214/deep-cloning-objects-in-javascript-without-json-methods-object-assign-ca3aba5e60f6,
    // which does something very similar, though I did not intend to copy their code as close as I did)
    // handles cloning arrays, objects and functions
    if (Array.isArray(obj)){
        return obj.map((elm) => clone(elm));
    }

    if (typeof obj === "object"){
        let clonedObj = Object.keys(obj).reduce((newObj, key) =>
            Object.assign(newObj,{[key]: clone(obj[key])})
        ,{});

        /*if (Object.getPrototypeOf(obj).cloneable){
            Object.setPrototypeOf(
                clonedObj,
                clone(Object.getPrototypeOf(obj))
            );
        }*/
        return clonedObj;
    }
    return obj;
}


export function clamp(value, min, max){
    return Math.min(Math.max(value, min), max);
}

export function getRegionBound(region, padding = {horizontal: 0, vertical: 0}, aspectRatio = null){
    let width = region.width * (1 - padding.horizontal);
    let height = region.height * (1 - padding.vertical);
    if (aspectRatio !== null){
        if ((width / aspectRatio) > height){
            width = height * aspectRatio;
        }
        if ((aspectRatio * height) > width){
            height = width / aspectRatio;
        }
    }
    return {
        x: region.x + (region.width - width) / 2,
        y: region.y + (region.height - height) / 2,
        width: width,
        height: height
    };
}

export function setDropdownProps(dropdown, props){
    Object.assign(dropdown.button, props.button);
    dropdown.options.forEach((_,ind) => {
        Object.assign(dropdown.options[ind], props.optionProps(ind));
    });
}

export function getRange(min, max, step){
    let range = [];
    for (let i = min; i <= max; i+= step){range.push(i);}
    return range;
}

export function toggleSeedEnable(graph,seedInd){
    return new Button({
        x: 0, y: 0, width: 0, height: 0, bgColor: "black",
        onClick: function* () {
            let thisModule = yield new AlgebraicEffect("GET MODULE");
            let self = yield new AlgebraicEffect("GET SELF");
            let seedIndValue = seedInd.call(thisModule);
            if (seedIndValue == -1){return}

            let seedEnabled = thisModule.graphs[graph].seeds[seedIndValue].enabled;
            thisModule.graphs[graph].seeds[seedIndValue].enabled = !seedEnabled;
            self.label = (seedEnabled ? "enable seed" : "disable seed");

            yield* runFn(thisModule.onReload);
        },
        label: {text: "disable seed", font: "default", color: "white"},
        outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
        hoverCol: "black",
        animate: function* () {yield* expandOnHover(false)}
    });
}

export function referencePointLabel(graph, ind, label = (value) => `Dose: ${value} Gy`){
    return new NumberInput({
        x: 0, y: 0, width: 0, height: 0,
        label: {
            text: label,
            color: {selected: "white", notSelected: "black"}
        },bgColor: {selected: "black", notSelected: "white"},
        getValue: function* () {
            let module = yield new AlgebraicEffect("GET MODULE");
            return module.graphs[graph].getPointDose(module.graphs[graph].refpoints[ind]);
        },
        onEnter: function* (value){
            let module = yield new AlgebraicEffect("GET MODULE");
            yield* setDoseAtPoint(
                module.graphs[graph],
                value,
                module.graphs[graph].refpoints[ind]
            );
        },
        numDecimalsEditing: 3,
        animate: function* () {yield* expandOnHover(false)}
    })
}

export function* runFn(fn,...args){
    if (fn?.constructor.name === "GeneratorFunction"){
        return yield* fn(...args);
    }else if (typeof fn === "object"){
        return yield* fn;
    }else if (typeof fn === "function"){
        return fn(...args);
    }
    return fn;
}

export function* setDoseAtPoint(graph,dose,point){
    if (graph.seeds[0].model.HDRsource){
        // if no seeds are active, don't even try
        if (graph.seeds.filter((seed) => seed.dwellTime > 0).length == 0){return;}
        // calculate the dose, dividing out the contributions of the dwell time factor to the dose,
        // to find the dose without accounting for dwell time
        let doseWithoutDwellTime = graph.getPointDose(point) / graph.seeds.reduce(
            (dwellFactor, seed) =>
                dwellFactor + (
                    (seed.dwellTime > 0) ?
                        (1 - Math.exp(-seed.dwellTime / (1.44 * seed.model.halfLife)))
                    :
                        0
                    )
            ,0);
        let newFactor = -1.44 * Math.log(
            1 - ((dose / doseWithoutDwellTime)
            / graph.seeds.filter(
                (seed) => seed.dwellTime > 0
            ).length)
        );
        if (Number.isNaN(newFactor)){
            newFactor = 0.08333;
        }
        graph.seeds.forEach((seed) => {
            seed.dwellTime = clamp(
                seed.model.halfLife * newFactor,
                0,
                0.08333
            );
        });
    }else{
        // set all seeds of the graph to a uniform air kerma
        graph.seeds.forEach((seed) => {
            seed.airKerma = 1;
        });

        // since airk kerma linearly scales the dose at all points,
        // calculate the updated air kerma with simple division
        let updatedAirKerma = clamp(
            dose / (graph.getPointDose(point)),
            airKermaSliderLimits.LDR.min,
            airKermaSliderLimits.LDR.max
        );

        // update seeds with new air kerma
        graph.seeds.forEach((seed) => {
            seed.airKerma = updatedAirKerma;
        });
    }
    yield* runFn((yield new AlgebraicEffect("GET MODULE")).onReload);
}

export function multSeedDwellTimeLabel(graph){
    return new NumberInput({
        x: 0, y: 0, width: 0, height: 0,
        label: {
            text: (value) => `Dwell Time: ${value} seconds`,
            color: {selected: "white", notSelected: "black"}
        },bgColor: {selected: "black", notSelected: "white"},
        getValue: function* () {
            let module = yield new AlgebraicEffect("GET MODULE");
            if (module.graphs[graph].selectedSeed != -1){
                return module.graphs[graph].seeds[module.graphs[graph].selectedSeed].dwellTime * 3600;
            }
            return 0;
        },
        onEnter: function* (value){
            let module = yield new AlgebraicEffect("GET MODULE");
            module.graphs[graph].seeds[module.graphs[graph].selectedSeed].dwellTime = clamp(value / 3600,0,0.0833333333333);
            yield* runFn(module.onReload.bind(module));
        },
        numDecimalsEditing: 3,
        animate: function* () {yield* expandOnHover(false)}
    });
}

export function dwellTimeLabel(graph){
    return new NumberInput({
        x: 0, y: 0, width: 0, height: 0,
        label: {
            text: (value) => `Dwell Time: ${value} seconds`,
            color: {selected: "white", notSelected: "black"}
        },bgColor: {selected: "black", notSelected: "white"},
        getValue: function* () {
            let module = yield new AlgebraicEffect("GET MODULE");
            return module.graphs[graph].seeds[0].dwellTime * 3600;
        },
        onEnter: function* (value){
            let module = yield new AlgebraicEffect("GET MODULE");
            module.graphs[graph].seeds[0].dwellTime = clamp(value / 3600,0,0.0833333333333);
            yield* runFn(module.onReload);
        },
        numDecimalsEditing: 3,
        animate: function* () {yield* expandOnHover(false)}
    });
}

export function airKermaLabel(graph){
    return new NumberInput({
        x: 0, y: 0, width: 0, height: 0,
        label: {
            text: (value) => `Air Kerma: ${value}U`,
            color: {selected: "white", notSelected: "black"}
        },bgColor: {selected: "black", notSelected: "white"},
        getValue: function* () {
            return (yield new AlgebraicEffect("GET MODULE")).graphs[graph].seeds[0].airKerma;
        },
        onEnter: function* (value){
            let module = yield new AlgebraicEffect("GET MODULE");
            let clampedVal = (
                (module.graphs[graph].seeds[0].model.HDRsource) ?
                    clamp(value, airKermaSliderLimits.HDR.min, airKermaSliderLimits.HDR.max)
                :
                    clamp(value, airKermaSliderLimits.LDR.min, airKermaSliderLimits.LDR.max)
            );
            module.graphs[graph].seeds.forEach((seed) => {
                seed.airKerma = clampedVal;
            });
        },
        numDecimalsEditing: 3,
        animate: function* () {yield* expandOnHover(false)}
    })
}

export function* expandOnHover(detectClick = true) {
    let self = yield new AlgebraicEffect("GET SELF");

    // a function to store any properties that may be modified into a restingButtonProps attribute
    let storeProps = () => {
        self.restingButtonProps = {...self};
    }
    // a function to encode the element's properties as a string (checked to see if any updates have occured)
    let encodedProps = () => JSON.stringify([
        self.width,
        self.height,
        self.x,
        self.y,
    ]);

    // if any of the button's properties have been changed since this function was last there,
    // (if the button was modified by an outside source), assume that these are the new
    // dimensions to conform to
    if (Object.hasOwn(self, "lastButtonProps")){
        if (self.lastButtonProps !== encodedProps()){
            storeProps();
        }
    }

    // if the user is hovering expand slightly
    if (self.hovering()){
        if (!Object.hasOwn(self, "restingButtonProps")){
            storeProps();
        }

        // scale element
        if (mouse.down && detectClick){
            self.width = self.restingButtonProps.width;
            self.height = self.restingButtonProps.height;
        }else{
            self.width += (self.restingButtonProps.width * 1.1 - self.width) * 0.2;
            self.height += (self.restingButtonProps.height * 1.1 - self.height) * 0.2;
        }

        // offset it to maintain the center position
        self.x = self.restingButtonProps.x - (self.width - self.restingButtonProps.width) / 2;
        self.y = self.restingButtonProps.y - (self.height - self.restingButtonProps.height) / 2;
    }else if (Object.hasOwn(self, "restingButtonProps")){
        // otherwise shrink slightly
        self.width += (self.restingButtonProps.width - self.width) * 0.4;
        self.height += (self.restingButtonProps.height - self.height) * 0.4;
        self.x = self.restingButtonProps.x - (self.width - self.restingButtonProps.width) / 2;
        self.y = self.restingButtonProps.y - (self.height - self.restingButtonProps.height) / 2;
    }

    // record button properties to be checked next time
    self.lastButtonProps = encodedProps();
}

export function modelDropdown(modelOptions,graph,defaultLabel){
    let dropdown = new Dropdown(
        new Button({
            x: 0, y: 0, width: 0, height: 0, bgColor: "black",
            onClick: () => {},
            label: {text: defaultLabel, font: "default", color: "white"},
            outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.01},
            animate: expandOnHover,
            hoverCol: "black"
        }),[]
    );
    for (let i = 0; i < modelOptions.length; i++){
        let model = modelOptions[i];
        dropdown.options.push(new Button({
            x: 0, y: 0, width: 0, height: 0, bgColor: "white",
            label: {
                text: model.name + " (" + model.isotope + ")",
                font: "default",
                color: "black"
            },
            outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.01},
            onClick: function* () {
                let module = yield new AlgebraicEffect("GET MODULE");
                let parent = yield new AlgebraicEffect("GET PARENT");
                module.graphs[graph].seeds.forEach((seed) => {
                    seed.model = model;
                    seed.airKerma = (seed.model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min);
                    seed.dwellTime = 0.00833;
                    seed.enabled = true;
                });
                parent.button.label = model.name + " (" + model.isotope + ")";
                parent.collapseDropdown();
                yield* runFn(module.onReload.bind(module));
            },
            animate: expandOnHover
        }));
    }
    return dropdown;
}

export function rescaleDropdownButtons(dropdown, region, padding){
    let bound = getRegionBound(region, padding);
    setDropdownProps(dropdown, {
        button: bound,
        optionProps: (ind) => {
            return {
                x: bound.x,
                y: bound.y + bound.height + region.height * ind,
                width: bound.width,
                height: region.height
            };
        }
    });
}

export function airKermaSlider(graph){
    return new Slider({
        x: 0, y: 0, length: 0, angle: 0, color: "black", thickness: 0,
        updateValue: function* (value) {
            let module = yield new AlgebraicEffect("GET MODULE");
            module.graphs[graph].seeds.forEach((seed) => {
                seed.airKerma = getAirKermaFromSlider(value,seed);
            });
        },
        getValue: function* () {
            let module = yield new AlgebraicEffect("GET MODULE");
            return getValueFromAirKerma(module.graphs[graph].seeds[0]);
        }
    });
}

export function multSeedDwellTimeSlider(graph){
    return new Slider({
        x: 0, y: 0, length: 0, angle: 0, color: "black", thickness: 0, initalValue: 0,
        updateValue: function* (value) {
            let module = yield new AlgebraicEffect("GET MODULE");
            if (module.graphs[graph].selectedSeed != -1){
                module.graphs[graph].seeds[module.graphs[graph].selectedSeed].dwellTime = getDwellTimeFromSlider(value);
                yield* runFn(module.onReload.bind(module));
            }
        },
        getValue: function* () {
            let module = yield new AlgebraicEffect("GET MODULE");
            if (module.graphs[graph].selectedSeed != -1){
                return getValueFromDwellTime(
                    module.graphs[graph].seeds[module.graphs[graph].selectedSeed]
                );
            }
            return 0;
        }
    });
}

export function dwellTimeSlider(graph){
    return new Slider({
        x: 0, y: 0, length: 0, angle: 0, color: "black", thickness: 0, initalValue: 0,
        updateValue: function* (value) {
            let module = yield new AlgebraicEffect("GET MODULE");
            module.graphs[graph].seeds[0].dwellTime = getDwellTimeFromSlider(value);
            yield* runFn(module.onReload);
        },
        getValue: function*  () {
            let module = yield new AlgebraicEffect("GET MODULE");
            return getValueFromDwellTime(module.graphs[graph].seeds[0]);
        }
    });
}

function getAirKermaFromSlider(value,source){
    if (source.model.HDRsource){
        return airKermaSliderLimits.HDR.min + value * (airKermaSliderLimits.HDR.max - airKermaSliderLimits.HDR.min);
    }
    return airKermaSliderLimits.LDR.min + value * (airKermaSliderLimits.LDR.max - airKermaSliderLimits.LDR.min);
}

function getValueFromAirKerma(seed){
    return seed.model.HDRsource ?
            ((seed.airKerma - airKermaSliderLimits.HDR.min) / (airKermaSliderLimits.HDR.max - airKermaSliderLimits.HDR.min))
            : 
            ((seed.airKerma - airKermaSliderLimits.LDR.min) / (airKermaSliderLimits.LDR.max - airKermaSliderLimits.LDR.min))
}

function getDwellTimeFromSlider(value){
    return value * 0.0833333333333; // slider from 30 seconds to 10 minutes
}

function getValueFromDwellTime(seed){
    return seed.dwellTime / 0.0833333333333;
}

export function buttonPress () {
    //nothing more will happen on the next mouse down call (to prevent not double-pressing the same button)
    this.onMouseDown = nothing;

    // on the next mouse up call, both the mouse down and mouse up functions will be reset
    this.onMouseUp = function () {
        this.onMouseDown = this.defaultInputHandler.onMouseDown;
        this.onMouseUp = this.defaultInputHandler.onMouseUp;
    }
}

let nothingSetup = function () {};
nothingSetup.isNothing = true;
export const nothing = nothingSetup; //it looks like a useless function, but it's nice for shorthand

export function* setEqualFont(elms) {
    // get font
    let font = Infinity;
    for (let elm of elms){
        if (elm.constructor.name === "Dropdown"){
            font = Math.min(font, elm.normalizeFont());
        }
        if (elm.constructor.name === "Button"){
            font = Math.min(font, elm.getDefaultFont());
        }
        if (elm.constructor.name === "NumberInput"){
            font = Math.min(font, elm.recalcFont(
                yield* chainEffectHandler({
                    tryCode: function*(){
                        let self = yield new AlgebraicEffect("GET SELF");
                        return yield* runFn(self.label);
                    },
                    handleCode: function*(effect){
                        if (effect === "GET SELF"){
                            return elm;
                        }
                    }
                })
            ));
        }
    }

    // set font
    elms.forEach((elm) => {
        if (elm.constructor.name === "Dropdown"){
            elm.recalcFontOnDraw = false; // ensures the Dropdown class does not try to correct this font size when drawing
            elm.button.font = font + "px Arial";
        }
        if (elm.constructor.name === "Button"){
            elm.font = font + "px Arial";
        }
        if (elm.constructor.name === "NumberInput"){
            elm.recalcFontOnDraw = false; // ensures the NumberInput class does not try to correct this font size when drawing
            elm.font = font;
        }
    });
}

export function blankDropdown(buttonText){
    return new Dropdown(
        new Button({
            x: 0, y: 0, width: 0, height: 0, bgColor: "white",
            onClick: () => {},
            label: {text: buttonText, font: "default", color: "black"},
            outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.01}}
        ),[]
    )
}

export function *addDropdownOptions(dropdown, options, text, onClick, module){
    if (typeof module === "undefined"){
        module = yield new AlgebraicEffect("GET MODULE");
    }
    dropdown.options = [];
    for (let opt of options){
        dropdown.options.push(
            new Button({
                x: 0, y: 0, width: 0, height: 0, bgColor: "white",
                label: {
                    text: text(opt),
                    font: "default",
                    color: "black"
                },
                outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
                onClick: onClick(opt),
            })
        );
    }
}