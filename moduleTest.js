import { getFontSize, getMin, getMax, convertUnit, clamp } from './utils.js';
import { TheraSeed200, Best2301, GammaMedHDRPlus, BEBIG_GK60M21, ElektaFlexisource } from './constants.js';
import { Button } from './UIclasses/Button.js';
import { Dropdown } from './UIclasses/Dropdown.js';
import { NumberInput } from './UIclasses/NumberInput.js';
import { Slider } from './UIclasses/Slider.js';
import { Seed } from './seed.js';
import { Graph } from './graph.js';
import { Module } from './module.js';

let canvas = document.getElementById("canvas");
export let ctx = canvas.getContext("2d");
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;
export let module = "single seed";
let scrollPos = {
    x: 0,
    y: 0
};
const airKermaSliderLimits = {
    HDR: {
        min: convertUnit("1 Ci","U"),
        max: convertUnit("10 Ci","U")
    },
    LDR: {
        min: convertUnit("1 µCi","U"),
        max: convertUnit("5 µCi","U")
    }
}
let view = {
    width: () => canvas.width,
    height: () => (canvas.height * 0.9)
}

window.mouse = {x: 0, y: 0, down: false};
export let moduleData = {
    "single seed": new Module({
        graphs: {
            graph1: new Graph({
                x: 0, y: 0, width: 0, height: 0, seeds: [
                    new Seed({x:0, y:0, z:0},{phi: 0, theta: 0},TheraSeed200,airKermaSliderLimits.LDR.min,0.00833)
                ],
                xTicks: getRange(-2, 2, 0.0625), yTicks: getRange(-2, 2, 0.0625), perspective: (point) => point, name: "graph1", refpoints: [{x: 0, y: 1, z: 0}]
            }),
            graph2: new Graph({
                x: 0, y: 0, width: 0, height: 0,
                seeds: [
                    new Seed({x:0, y:0, z:0},{phi: 0, theta: 0},GammaMedHDRPlus,airKermaSliderLimits.HDR.min,0.00833)
                ],
                xTicks: getRange(-2, 2, 0.0625), yTicks: getRange(-2, 2, 0.0625), perspective: (point) => point, name: "graph2", refpoints: [{x: 0, y: 1, z: 0}]
            })
        },
        sliders: {
            graph1AirKerma: function(thisModule,self) {return airKermaSlider(thisModule,"graph1")},
            graph2AirKerma: function(thisModule,self) {return airKermaSlider(thisModule,"graph2")},
            graph1DwellTime: function(thisModule,self) {return dwellTimeSlider(thisModule,"graph1");},
            graph2DwellTime: function(thisModule,self) {return dwellTimeSlider(thisModule,"graph2");}
        },
        dropDowns: {
            graph1Model: function(thisModule,self) {return modelDropdown([TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource],thisModule,self,"graph1");},
            graph2Model: function(thisModule,self) {return modelDropdown([TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource],thisModule,self,"graph2");}
        },
        labels: {
            graph1AirKerma: function(thisModule,self) {return airKermaLabel(thisModule,"graph1");},
            graph2AirKerma: function(thisModule,self) {return airKermaLabel(thisModule,"graph2");},
            graph1DwellTime: function(thisModule,self) {return dwellTimeLabel(thisModule,"graph1");},
            graph2DwellTime: function(thisModule,self) {return dwellTimeLabel(thisModule,"graph2");}
        },
        buttons: {
            graph1EnableSeed: function(thisModule,self) {return toggleSeedEnable(thisModule,self,"graph1",0);},
            graph2EnableSeed: function(thisModule,self) {return toggleSeedEnable(thisModule,self,"graph2",0);}
        },
        onUpdate: function () {
            ["sliders","dropDowns","labels","buttons"].forEach((obj) => {
                Object.values(this[obj]).forEach((attribute) => {
                    attribute.draw();
                });
            });
            Object.values(navBar).forEach((button) => {
                button.draw();
            });
        },
        onReload: function () {
            refrestNavBar();
            Object.values(this.graphs).forEach((graph) => {
                graph.drawGraph(document.getElementById(graph.name));
            });
        }
    })
};

//loop over moduleData and evaluate any attribute functions (these are neccisary since attributes that reference
//themselves must be intialized after the creation of moduleData, so they are stored in a function and after the
//creation of moduleData, they are evaluated and replaced based on the result of that function evaluation)
Object.keys(moduleData).forEach((module) => {
    ["graphs","sliders","dropDowns","labels","buttons"].forEach((obj) => {
        if (typeof moduleData[module][obj] !== "undefined"){
            Object.keys(moduleData[module][obj]).forEach((attribute) => {
                let attributefn = moduleData[module][obj][attribute];
                if (typeof attributefn === "function"){
                    moduleData[module][obj][attribute] = attributefn(moduleData[module],attribute);
                }
            });
        }
    });
});

let navBar = {};
refrestNavBar();
moduleData[module].onReload();

function refrestNavBar(){
    navBar = Object.keys(moduleData).reduce((navButtons, moduleName, ind, arr) => {
        navButtons[moduleName] = new Button({
            x: (canvas.width / arr.length) * ind,
            y: 0,
            width: (canvas.width / arr.length),
            height: canvas.height * 0.1,
            bgColor: "white",
            onClick: () => {
                navBar[module].bgColor = "white";
                navBar[module].label.color = "black";
                navBar[moduleName].bgColor = "black";
                navBar[moduleName].label.color = "white";
                module = moduleName;
                moduleData[moduleName].onReload();
            },
            label: {text: moduleName, font: "default", color: "black"},
            outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}
        });
        return navButtons;
    },{});
}

setInterval(tick,50);

function tick(){
    moduleData[module].onUpdate();
}

function getRange(min, max, step){
    let range = [];
    for (let i = min; i <= max; i+= step){range.push(i);}
    return range;
}

function toggleSeedEnable(thisModule,self,graph,seedInd){
    return new Button({
        x: 0, y: 0, width: 0, height: 0, bgColor: "black",
        onClick: () => {
            let seedEnabled = thisModule.graphs[graph].seeds[seedInd].enabled;
            thisModule.graphs[graph].seeds[seedInd].enabled != seedEnabled;
            self.label.text = (seedEnabled ? "disable seed" : "enable seed");
            thisModule.onReload();
        },
        label: {text: "disable seed", font: "default", color: "white"},
        outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}
    });
}

function dwellTimeLabel(thisModule, graph){
    let graphObj = thisModule.graphs[graph];
    return new NumberInput({
        x: 0, y: 0, width: 0, height: 0,
        label: {
            text: (value) => `Dwell Time: ${value} seconds`,
            color: {selected: "white", notSelected: "black"}
        },bgColor: {selected: "black", notSelected: "white"},
        getValue: () => graphObj.seeds[0].dwellTime * 3600,
        onEnter: function (value){
            let clampedVal = Math.max(Math.min(value / 3600,0.0833333333333),0);
            graphObj.seeds.forEach((seed) => {
                seed.dwellTime = clampedVal;
            });
        },
        numDecimalsEditing: 3
    })
}

function airKermaLabel(thisModule, graph){
    let graphObj = thisModule.graphs[graph];
    return new NumberInput({
        x: 0, y: 0, width: 0, height: 0,
        label: {
            text: (value) => `Air Kerma: ${value}U`,
            color: {selected: "white", notSelected: "black"}
        },bgColor: {selected: "black", notSelected: "white"},
        getValue: () => graphObj.seeds[0].airKerma,
        onEnter: function (value){
            let clampedVal = (
                (graphObj.seeds[0].model.HDRsource) ?
                    clamp(value, airKermaSliderLimits.HDR.min, airKermaSliderLimits.HDR.max)
                :
                    clamp(value, airKermaSliderLimits.LDR.min, airKermaSliderLimits.LDR.max)
            );
            graphObj.seeds.forEach((seed) => {
                seed.airKerma = clampedVal;
            });
        },
        numDecimalsEditing: 3
    })
}

function modelDropdown(modelOptions,thisModule,self,graph){
    let dropdown = new Dropdown(
        new Button({
            x: 0, y: 0, width: 0, height: 0, bgColor: "black",
            onClick: () => {},
            label: {text: "", font: "default", color: "white"},
            outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}}
        ),[]
    );
    for (let i = 0; i < modelOptions.length; i++){
        let model = modelOptions[i];
        dropdown.options.push(new Button({
            x: 0, y: 0, width: 0, height: 0, bgColor: "white",
            label: {text: model.name + " (" + model.isotope + ")", font: "default", color: "black"},
            outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
            onClick: () => {
                thisModule.graphs[graph].seeds.forEach((seed) => {
                    seed.model = model;
                    seed.airKerma = (seed.model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min);
                    seed.dwellTime = 0.00833;
                    seed.enabled = true;
                });
                thisModule.dropDowns[self].button.label = model.name + " (" + model.isotope + ")";
            },
        }));
    }
    return dropdown;
}

function airKermaSlider(thisModule,graph){
    return new Slider({
        x: 0, y: 0, length: 0, angle: 0, color: "black", thickness: 0,
        updateValue: (value) => {
            thisModule.graphs[graph].seeds.forEach((seed) => {
                seed.airKerma = getAirKermaFromSlider(value,seed);
            });
        },
        getValue: () => getValueFromAirKerma(thisModule.graphs[graph].seeds[0])
    });
}

function dwellTimeSlider(thisModule,graph){
    return new Slider({
        x: 0, y: 0, length: 0, angle: 0, color: "black", thickness: 0, initalValue: 0,
        updateValue: (value) => {
            let dwellTime = getDwellTimeFromSlider(value);
            thisModule.graphs[graph].seeds.forEach((seed) => {
                seed.dwellTime = dwellTime;
            });
        },
        getValue: () => getValueFromDwellTime(thisModule.graphs[graph].seeds[0])
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

addEventListener("scroll",function (e){
	scrollPos = {
		x: window.scrollX,
		y: window.scrollY
	}
});
addEventListener("mousemove",function (e){
	updateMousePos(e);
});
addEventListener("mousedown",function (e){
	updateMousePos(e);
	mouse.down = true;
});
addEventListener("mouseup",function (e){
	updateMousePos(e);
	mouse.down = false;
});

function updateMousePos(e){
	mouse.x = e.clientX + scrollPos.x;
	mouse.y = e.clientY + scrollPos.y;
}