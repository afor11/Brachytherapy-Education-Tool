import { conversionFactors, airKermaSliderLimits, colorPalette } from './constants.js';
import { Button } from './UIclasses/Button.js';
import { Dropdown } from './UIclasses/Dropdown.js';
import { NumberInput } from './UIclasses/NumberInput.js';
import { Slider } from './UIclasses/Slider.js';
import { AlgebraicEffect, chainEffectHandler } from './algebraicEffect.js';

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
    let neighborHigh = getInterpolationIndex(spacingArr,ind);
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
    let x2 = getInterpolationIndex(xSpacing,x);
    let x1 = Math.max(x2 - 1,0);
    let y2 = getInterpolationIndex(ySpacing,y);
    let y1 = Math.max(y2 - 1,0);
    let xLerp = (x - xSpacing[x1]) / (xSpacing[x2] - xSpacing[x1]);
    return lerp(
        lerp(
            data[x1][y1],
            data[x2][y1],
            xLerp
        ),
        lerp(
            data[x1][y2],
            data[x2][y2],
            xLerp
        ),
        (y - ySpacing[y1]) / (ySpacing[y2] - ySpacing[y1])
    );
}

//helper function for interpolate table and bilinear interpolate
function getInterpolationIndex(spacingArr, ind){
    let min = 0;
    let max = spacingArr.length - 1;;
    let retInd = Math.ceil((min + max) / 2);
    while ((max - min) > 1){
        if (spacingArr[retInd] <= ind){
            min = retInd;
        }else{
            max = retInd;
        }
        retInd = Math.ceil((min + max) / 2);
    }
    return retInd;
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

export function toggleSeedEnable(graph, seedInd){
    return new Button({
        x: 0, y: 0, width: 0, height: 0, bgColor: colorPalette.secondary,
        onClick: function* () {
            // get module and self
            let thisModule = yield new AlgebraicEffect("GET MODULE");
            let self = yield new AlgebraicEffect("GET SELF");

            // get the seed index
            let seedIndValue = seedInd.call(thisModule);
            if (seedIndValue == -1){return}

            // toggle seed being enabled
            let seedEnabled = thisModule.graphs[graph].seeds[seedIndValue].enabled;
            thisModule.graphs[graph].seeds[seedIndValue].enabled = !seedEnabled;

            // toggle label
            self.label = (seedEnabled ? "enable seed" : "disable seed");

            // reload page
            yield* runFn(thisModule.onReload);
        },
        label: {text: "disable seed", font: "default", color: colorPalette.primary},
        outline: {color: colorPalette.accent, thickness: Math.min(canvas.width,canvas.height) * 0.001},
        hoverCol: colorPalette.secondary,
        animate: function* () {
            // get module, graph, and self
            let thisModule = yield new AlgebraicEffect("GET MODULE");
            let thisGraph = thisModule.graphs[graph];
            let self = yield new AlgebraicEffect("GET SELF");

            // set seed label according to if seed is enabled or disabled
            let seedIndValue = seedInd.call(thisModule);
            if (seedIndValue != -1) {
                self.label = (thisGraph.seeds[seedIndValue].enabled ? "disable seed" : "enable seed");
                yield* expandOnHover(false);
            }
        },
    });
}

export function referencePointLabel(graph, ind, label = (value) => `Dose: ${value} Gy`, outline){
    return new NumberInput({
        x: 0, y: 0, width: 0, height: 0,
        label: {
            text: label,
            color: {selected: colorPalette.primary, notSelected: colorPalette.accent}
        },bgColor: {selected: colorPalette.secondary, notSelected: colorPalette.primary},
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
        animate: function* () {yield* expandOnHover(false)},
        outline: outline
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
        if (graph.seeds.filter((seed) => seed.dwellTime > 0).length == 0){return}
        // setting the dwell time to infinity cancels out the effect of the dwell time
        graph.seeds.forEach((seed) => {
            seed.dwellTime = (seed.dwellTime > 0) ? Infinity : 0;
        });
        // divide the target dose by the dose without the effect of the dwell time to get the
        // effect the dwell time should have
        let newFactor = -1.44 * Math.log(1 - (dose / graph.getPointDose(point)));
        if (Number.isNaN(newFactor)){
            newFactor = 0.08333;
        }
        // set the dose waccoring to the new factor
        graph.seeds.forEach((seed) => {
            if (seed.dwellTime > 0){
                seed.dwellTime = clamp(
                    newFactor * seed.model.halfLife,
                    0,
                    0.08333
                );
            }
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
            airKermaSliderLimits[graph.seedType().isotope].min,
            airKermaSliderLimits[graph.seedType().isotope].max
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
            color: {selected: colorPalette.primary, notSelected: colorPalette.accent}
        },bgColor: {selected: colorPalette.secondary, notSelected: colorPalette.primary},
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
        animate: function* () {yield* expandOnHover(false)},
    });
}

export function dwellTimeLabel(graph){
    return new NumberInput({
        x: 0, y: 0, width: 0, height: 0,
        label: {
            text: (value) => `Dwell Time: ${value} seconds`,
            color: {selected: colorPalette.primary, notSelected: colorPalette.accent}
        },bgColor: {selected: colorPalette.secondary, notSelected: colorPalette.primary},
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
        animate: function* () {yield* expandOnHover(false)},
    });
}

export function airKermaLabel(graph) {
    return new NumberInput({
        x: 0, y: 0, width: 0, height: 0,
        label: {
            text: (value) => `Air Kerma: ${value}U`,
            color: {selected: colorPalette.primary, notSelected: colorPalette.accent}
        },bgColor: {selected: colorPalette.secondary, notSelected: colorPalette.primary},
        getValue: function* () {
            return (yield new AlgebraicEffect("GET MODULE")).graphs[graph].seeds[0].airKerma;
        },
        onEnter: function* (value){
            let module = yield new AlgebraicEffect("GET MODULE");
            let editingGraph = module.graphs[graph];
            let clampedVal = clamp(
                value,
                airKermaSliderLimits[editingGraph.seedType().isotope].min,
                airKermaSliderLimits[editingGraph.seedType().isotope].max
            );
            editingGraph.seeds.forEach((seed) => {
                seed.airKerma = clampedVal;
            });
        },
        numDecimalsEditing: 3,
    })
}

// check if an object has bee changed since it was last passed through this function
function objChanged(obj, changePropName, stateFn) {
    if (Object.hasOwn(obj, changePropName)) {
        if (obj[changePropName] === stateFn(obj)) {
            return false;
        } else {
            obj[changePropName] = stateFn(obj);
            return true;
        }
    } else {
        obj[changePropName] = stateFn(obj);
        return true;
    }
}

export function* expandOnHover(detectClick = true, expandHeight = false) {
    let self = yield new AlgebraicEffect("GET SELF");

    // a function to store any properties that may be modified into a restingButtonProps attribute
    let storeProps = () => {
        self.restingButtonProps = {
            x: self.x,
            y: self.y,
            width: self.width,
            height: self.height
        };
    }
    // a function to encode the element's properties as a string (checked to see if any updates have occured)
    let encodedProps = (obj) => JSON.stringify([
        obj.width,
        obj.height,
        obj.x,
        obj.y,
    ]);

    // if any of the button's properties have been changed since this function was last there,
    // (if the button was modified by an outside source), assume that these are the new
    // dimensions to conform to
    if (objChanged(self, "lastButtonProps", encodedProps)) {
        storeProps();
    }

    // if the user is hovering expand slightly
    if ((yield* self.hovering())){
        if (!Object.hasOwn(self, "restingButtonProps")){
            storeProps();
        }

        // scale element
        if (mouse.down && detectClick){
            self.width = self.restingButtonProps.width;
            if (expandHeight) {
                self.height = self.restingButtonProps.height;
            }
        }else{
            self.width += (self.restingButtonProps.width * 1.1 - self.width) * 0.2;
            if (expandHeight) {
                self.height += (self.restingButtonProps.height * 1.1 - self.height) * 0.2;
            }
        }

        // offset it to maintain the center position
        self.x = self.restingButtonProps.x - (self.width - self.restingButtonProps.width) / 2;
        self.y = self.restingButtonProps.y - (self.height - self.restingButtonProps.height) / 2;
    }else if (Object.hasOwn(self, "restingButtonProps")){
        // otherwise shrink slightly
        self.width += (self.restingButtonProps.width - self.width) * 0.4;
        if (expandHeight) {
            self.height += (self.restingButtonProps.height - self.height) * 0.4;
        }
        self.x = self.restingButtonProps.x - (self.width - self.restingButtonProps.width) / 2;
        self.y = self.restingButtonProps.y - (self.height - self.restingButtonProps.height) / 2;
    }

    // record button properties to be checked next time
    objChanged(self, "lastButtonProps", encodedProps);
}

export function modelDropdown(modelOptions, graph, defaultModel){
    let dropdown = new Dropdown(
        new Button({
            x: 0, y: 0, width: 0, height: 0, bgColor: colorPalette.secondary,
            onClick: () => {},
            label: {text: defaultModel.name + " (" + defaultModel.isotope + ")", font: "default", color: colorPalette.primary},
            outline: {color: colorPalette.accent, thickness: Math.min(canvas.width,canvas.height) * 0.01},
            animate: expandOnHover,
            hoverCol: colorPalette.secondary,
        }),
        []
    );
    dropdown.button.onClick = function* () {
        dropdown.showing = !dropdown.showing;

        dropdown.animStart = Date.now();
    }
    for (let i = 0; i < modelOptions.length; i++){
        let model = modelOptions[i];
        dropdown.options.push(new Button({
            x: 0, y: 0, width: 0, height: 0, bgColor: colorPalette.primary,
            label: {
                text: model.name + " (" + model.isotope + ")",
                font: "default",
                color: colorPalette.accent
            },
            outline: {color: colorPalette.accent, thickness: Math.min(canvas.width,canvas.height) * 0.01},
            onClick: function* () {
                let module = yield new AlgebraicEffect("GET MODULE");
                module.graphs[graph].seeds.forEach((seed) => {
                    seed.model = model;
                    seed.airKerma = airKermaSliderLimits[model.isotope].min
                    seed.dwellTime = 0.00833;
                    seed.enabled = true;
                });
                dropdown.button.label = model.name + " (" + model.isotope + ")";
                dropdown.collapseDropdown();
                yield* runFn(module.onReload.bind(module));
            },
            animate: function* () {
                if (objChanged(this, "dropDownState", (self) => JSON.stringify([self.x, self.y]))) {
                    this.animEndPos = {x: this.x, y: this.y};
                }
                // if a dropdown animation is playing
                if (Object.hasOwn(dropdown, "animStart")) {

                    // if the animation is not initalized
                    if (!Object.hasOwn(this, "animEndPos")) {
                        this.animEndPos = {x: this.x, y: this.y};
                    }

                    // if the dropdown has different "resting properties" (for when the
                    // dropdown button is expanding), set the animation start position
                    // based off these resting properties, otherwise, set it based on
                    // how it is
                    let animStartPos;
                    if (Object.hasOwn(dropdown.button, "restingButtonProps")) {
                        let restingProps = dropdown.button.restingButtonProps;
                        animStartPos = {
                            x: restingProps.x,
                            y: restingProps.y + restingProps.height / 2
                        };
                    } else {
                        animStartPos = {
                            x: dropdown.button.x,
                            y: dropdown.button.y + dropdown.button.height / 2
                        };
                    }

                    // easing function found here: https://easings.net/#easeOutQuint
                    let t = clamp(1 - Math.pow(1 - (Date.now() - dropdown.animStart) / 1000, 5), 0, 1);
                    this.x = animStartPos.x + t * (this.animEndPos.x - animStartPos.x);
                    this.y = animStartPos.y + t * (this.animEndPos.y - animStartPos.y);

                    if (t == 1) {
                        delete dropdown.animStart;
                        delete this.animEndPos;
                    }
                }

                objChanged(this, "dropDownState", (self) => JSON.stringify([self.x, self.y]))
            },
            cornerRounding: (
                (i == 0) ?
                    [0.5, 0.5, 0, 0]
                : (i == (modelOptions.length - 1)) ?
                    [0, 0, 0.5, 0.5]
                :
                    0
            )
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
        x: 0, y: 0, length: 0, angle: 0, color: colorPalette.accent, thickness: 0,
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
        x: 0, y: 0, length: 0, angle: 0, color: colorPalette.accent, thickness: 0, initalValue: 0,
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
        x: 0, y: 0, length: 0, angle: 0, color: colorPalette.accent, thickness: 0, initalValue: 0,
        updateValue: function* (value) {
            let module = yield new AlgebraicEffect("GET MODULE");
            module.graphs[graph].seeds[0].dwellTime = getDwellTimeFromSlider(value);
            // no need to reload the module if there is only one seed :)
        },
        getValue: function*  () {
            let module = yield new AlgebraicEffect("GET MODULE");
            return getValueFromDwellTime(module.graphs[graph].seeds[0]);
        }
    });
}

function getAirKermaFromSlider(value, source) {
    let sliderLimits = airKermaSliderLimits[source.model.isotope];
    return sliderLimits.min + value * (sliderLimits.max - sliderLimits.min);
}

function getValueFromAirKerma(seed){
    let sliderLimits = airKermaSliderLimits[seed.model.isotope];
    return (seed.airKerma - sliderLimits.min) / (sliderLimits.max - sliderLimits.min);
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
        if (elm instanceof Dropdown){
            font = Math.min(font, elm.normalizeFont());
        }
        if (elm instanceof Button){
            font = Math.min(font, elm.getDefaultFont());
        }
        if (elm instanceof NumberInput){
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
        if (elm instanceof Dropdown){
            elm.recalcFontOnDraw = false; // ensures the Dropdown class does not try to correct this font size when drawing
            elm.button.font = font + "px Arial";
        }
        if (elm instanceof Button){
            elm.font = font + "px Arial";
        }
        if (elm instanceof NumberInput){
            elm.recalcFontOnDraw = false; // ensures the NumberInput class does not try to correct this font size when drawing
            elm.font = font;
        }
    });
}

export function blankDropdown(buttonText){
    return new Dropdown(
        new Button({
            x: 0, y: 0, width: 0, height: 0, bgColor: colorPalette.primary,
            onClick: () => {},
            label: {text: buttonText, font: "default", color: colorPalette.accent},
            outline: {color: colorPalette.accent, thickness: Math.min(canvas.width,canvas.height) * 0.01}}
        ),[]
    )
}

// this function just initalizes the options of a dropdown; the width, height, position, corner rounding, etc can be set later
export function *addDropdownOptions(dropdown, options, text, onClick, module){
    if (typeof module === "undefined"){
        module = yield new AlgebraicEffect("GET MODULE");
    }
    dropdown.options = [];
    for (let opt of options){
        dropdown.options.push(
            new Button({
                x: 0, y: 0, width: 0, height: 0, bgColor: colorPalette.primary,
                label: {
                    text: text(opt),
                    font: "default",
                    color: colorPalette.accent
                },
                outline: {color: colorPalette.accent, thickness: Math.min(canvas.width,canvas.height) * 0.001},
                onClick: onClick(opt),
            })
        );
    }
}

export function getCornerRounding(dimensions, cornerRounding) {
    // get how much the corners of the rectangle should be rounded
    let cornerRoundAmount = Math.min(dimensions.width / 2, dimensions.height / 2);
    return (
        Array.isArray(cornerRounding) ?
            cornerRounding.map((corner) => corner * cornerRoundAmount)
        :
            cornerRounding * cornerRoundAmount
    );
}

export function resetCanvas(context) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.fillStyle = colorPalette.primary;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
}


export function getPropFromAddress(obj, address) {
    return address.reduce((currObj, path) => currObj[path], obj);
}