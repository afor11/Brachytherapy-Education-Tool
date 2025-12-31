import { conversionFactors, airKermaSliderLimits } from './constants.js';
import { Button } from './UIclasses/Button.js';
import { Dropdown } from './UIclasses/Dropdown.js';
import { NumberInput } from './UIclasses/NumberInput.js';
import { Slider } from './UIclasses/Slider.js';

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
    for (let i = 0; (i < 10) || !checkFont(); i++) { // binary search for best font size based on width and height intil i > 10 and checkFont() is true
        if (checkFont()){
            size.min = (size.min + size.max) / 2;
        }else{
            size.max = (size.min + size.max) / 2;
        }
    }
    return (size.min + size.max) / 2;
}

export function getMin(arr){
    return arr.reduce((minVal,curVal) => ((curVal < minVal) ? curVal : minVal),arr[0]);
}

export function getMax(arr){
    return arr.reduce((minVal,curVal) => ((curVal > minVal) ? curVal : minVal),arr[0]);
}

export function convertUnit(unit,newUnit){
    return parseFloat(unit.split(" ")[0]) * conversionFactors[newUnit][unit.split(" ")[1]];
}

export function cloneObj(obj){
    return JSON.parse(JSON.stringify(obj));
}

export function clamp(value, min, max){
    return Math.min(Math.max(value, min), max);
}

export function arrEqual(arrA, arrB){
    if (arrA.length != arrB.length){
        return false;
    }
    for (let i = 0; i < arrA.length; i++){
        if (arrA[i] != arrB[i]){
            return false;
        }
    }
    return true;
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

export function setProps(obj, props){
    Object.keys(props).forEach((property) => {
        obj[property] = props[property];
    });
}

function setDropdownProps(dropdown, props){
    setProps(dropdown.button, props.button);
    dropdown.options.forEach((_,ind) => {
        setProps(dropdown.options[ind], props.optionProps(ind));
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
        onClick: function () {
            let seedIndValue = seedInd.call(this.module);
            if (seedIndValue == -1){return}

            let seedEnabled = this.module.graphs[graph].seeds[seedIndValue].enabled;
            this.module.graphs[graph].seeds[seedIndValue].enabled = !seedEnabled;
            this.self.label = (seedEnabled ? "enable seed" : "disable seed");

            this.module.onReload();
        },
        label: {text: "disable seed", font: "default", color: "white"},
        outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}
    });
}

export function referencePointLabel(moduleData, thisModule, graphName, refPointInd){
    return new NumberInput({
        x: 0, y: 0, width: 0, height: 0,
        label: {
            text: (value) => `Dose: ${value} Gy`,
            color: {selected: "white", notSelected: "black"}
        },bgColor: {selected: "black", notSelected: "white"},
        getValue: () => moduleData[thisModule].graphs[graphName].getPointDose(
            moduleData[thisModule].graphs[graphName].refpoints[refPointInd]
        ),
        onEnter: function (value){
            setDoseAtPoint(
                this.module.graphs[graphName],
                value,
                this.module,
                this.module.graphs[graphName].refpoints[refPointInd]
            );
        },
        numDecimalsEditing: 3
    });
}

function setDoseAtPoint(graph,dose,module,point){
    const searchPrecision = 20;
    if (graph.seeds[0].model.HDRsource){
        let dwellTime = {min: 0, max: 0.0833333333333};
        let testingDwellTime = () => (dwellTime.min + dwellTime.max) / 2;
        for (let i = 0; i < searchPrecision; i++){
            graph.seeds.forEach((seed) => {
                if (seed.dwellTime > 0){
                    seed.dwellTime = testingDwellTime();
                }
            });
            if (graph.getPointDose(point) > dose){
                dwellTime.max = testingDwellTime();
            }else{
                dwellTime.min = testingDwellTime();
            }
        }
    }else{
        let airKerma = {...airKermaSliderLimits.LDR};
        let testingAirKerma = () => (airKerma.min + airKerma.max) / 2;
        for (let i = 0; i < searchPrecision; i++){
            graph.seeds.forEach((seed) => {
                seed.airKerma = testingAirKerma();
            });
            if (graph.getPointDose(point) > dose){
                airKerma.max = testingAirKerma();
            }else{
                airKerma.min = testingAirKerma();
            }
        }
    }
    module.onReload();
}

export function multSeedDwellTimeLabel(moduleData, module, graph){
    let graphObj = moduleData[module].graphs[graph];
    return new NumberInput({
        x: 0, y: 0, width: 0, height: 0,
        label: {
            text: (value) => `Dwell Time: ${value} seconds`,
            color: {selected: "white", notSelected: "black"}
        },bgColor: {selected: "black", notSelected: "white"},
        getValue: () => {
            if (graphObj.selectedSeed != -1){
                return graphObj.seeds[graphObj.selectedSeed].dwellTime * 3600;
            }
            return 0;
        },
        onEnter: function (value){
            graphObj.seeds[graphObj.selectedSeed].dwellTime = clamp(value / 3600,0,0.0833333333333);
            this.module.onReload();
        },
        numDecimalsEditing: 3
    });
}

export function dwellTimeLabel(moduleData, module, graph){
    let graphObj = moduleData[module].graphs[graph];
    return new NumberInput({
        x: 0, y: 0, width: 0, height: 0,
        label: {
            text: (value) => `Dwell Time: ${value} seconds`,
            color: {selected: "white", notSelected: "black"}
        },bgColor: {selected: "black", notSelected: "white"},
        getValue: () => graphObj.seeds[0].dwellTime * 3600,
        onEnter: function (value){
            graphObj.seeds[0].dwellTime = clamp(value / 3600,0,0.0833333333333);
            this.module.onReload();
        },
        numDecimalsEditing: 3
    });
}

export function airKermaLabel(moduleData, module, graph){
    return new NumberInput({
        x: 0, y: 0, width: 0, height: 0,
        label: {
            text: (value) => `Air Kerma: ${value}U`,
            color: {selected: "white", notSelected: "black"}
        },bgColor: {selected: "black", notSelected: "white"},
        getValue: () => moduleData[module].graphs[graph].seeds[0].airKerma,
        onEnter: function (value){
            let clampedVal = (
                (this.module.graphs[graph].seeds[0].model.HDRsource) ?
                    clamp(value, airKermaSliderLimits.HDR.min, airKermaSliderLimits.HDR.max)
                :
                    clamp(value, airKermaSliderLimits.LDR.min, airKermaSliderLimits.LDR.max)
            );
            this.module.graphs[graph].seeds.forEach((seed) => {
                seed.airKerma = clampedVal;
            });
            this.module.onReload();
        },
        numDecimalsEditing: 3
    })
}

export function modelDropdown(modelOptions,graph,defaultLabel){
    let dropdown = new Dropdown(
        new Button({
            x: 0, y: 0, width: 0, height: 0, bgColor: "black",
            onClick: () => {},
            label: {text: defaultLabel, font: "default", color: "white"},
            outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}}
        ),[]
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
            outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
            onClick: function () {
                this.module.graphs[graph].seeds.forEach((seed) => {
                    seed.model = model;
                    seed.airKerma = (seed.model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min);
                    seed.dwellTime = 0.00833;
                    seed.enabled = true;
                });
                this.self.parent.button.label = model.name + " (" + model.isotope + ")";
                this.self.parent.collapseDropdown();
                this.module.onReload();
            },
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

export function airKermaSlider(moduleData,module,graph){
    return new Slider({
        x: 0, y: 0, length: 0, angle: 0, color: "black", thickness: 0,
        updateValue: function (value) {
            this.module.graphs[graph].seeds.forEach((seed) => {
                seed.airKerma = getAirKermaFromSlider(value,seed);
            });
            this.module.onReload();
        },
        getValue: () => getValueFromAirKerma(moduleData[module].graphs[graph].seeds[0])
    });
}

export function multSeedDwellTimeSlider(moduleData,module,graph){
    let graphObj = moduleData[module].graphs[graph];
    return new Slider({
        x: 0, y: 0, length: 0, angle: 0, color: "black", thickness: 0, initalValue: 0,
        updateValue: function (value) {
            graphObj.seeds[graphObj.selectedSeed].dwellTime = getDwellTimeFromSlider(value);
            this.module.onReload();
        },
        getValue: () => {
            if (graphObj.selectedSeed != -1){
                return getValueFromDwellTime(
                    graphObj.seeds[graphObj.selectedSeed]
                )
            }
            return 0;
        }
    });
}

export function dwellTimeSlider(moduleData,module,graph){
    return new Slider({
        x: 0, y: 0, length: 0, angle: 0, color: "black", thickness: 0, initalValue: 0,
        updateValue: function (value) {
            this.module.graphs[graph].seeds[0].dwellTime = getDwellTimeFromSlider(value);
            this.module.onReload();
        },
        getValue: () => getValueFromDwellTime(moduleData[module].graphs[graph].seeds[0])
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

// lets the event handler function know that the event has been handled (since the
// isNothing flag is undefined) but that it shouldn't do anything more
export const eventHandled = () => {}