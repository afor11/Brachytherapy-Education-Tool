import {drawAnatomy} from './interpolateAnatomy.js';
import {anatomyData, TheraSeed200, Best2301, GammaMedHDRPlus, BEBIG_GK60M21, ElektaFlexisource} from './constants.js';
import {Button} from './UIclasses/Button.js';
import {Dropdown} from './UIclasses/Dropdown.js';
import {NumberInput} from './UIclasses/NumberInput.js';
import {Slider} from './UIclasses/Slider.js';

let formattedAnatomy = {};
scaleAnatomyData({x: 0,y: 0},500,10);
console.log(formattedAnatomy);

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

window.mouse = {x: 0, y: 0, down: false};
let mouseGraphPos = {x: 0, y: 0};
let scrollPos = {x: 0, y: 0};
let render = true; // used to indicate if the graphs should be re-drawn
let resetGraphs = true;
let module = "single seed";
let moduleData = {};
let savedModuleData = {};

const conversionFactors = {
    µCi: {
        µCi: 1,
        Ci: 1000,
        U: 1,
    },
    Ci: {
        µCi: 0.001,
        Ci: 1,
        U: 0.001,
    },
    U: {
        µCi: 1,
        Ci: 1000,
        U: 1,
    },
};
const airKermaSliderLimits ={
    HDR: {
        min: convertUnit("1 Ci","U"),
        max: convertUnit("10 Ci","U")
    },
    LDR: {
        min: convertUnit("1 µCi","U"),
        max: convertUnit("5 µCi","U")
    }
}

class Seed {
    constructor (pos, rot, model, airKerma, dwellTime){
        this.model = model;
        this.pos = pos; // measured in cm
        this.rot = rot; // measured in radians
        this.airKerma = airKerma; // measured in U
        this.dwellTime = dwellTime; // Measured in hours
        this.enabled = true;
        this.directionVec;
        this.geometryRef = {x: 0, y: 1, z: 0, r: 1, theta: Math.PI / 2};
        this.recalcDirection();
    }
    g(r){
        if (this.model.pointSource){
            return interpolateTable(this.model.pointSourcegValues,this.model.pointSourcegMeasurementPoints,r);
        }
        return interpolateTable(this.model.gValues,this.model.gMeasurementPoints,r);
    }
    F(pos){
        if (pos.r == 0){
            return 1;
        }
        let transformedTheta;
        if (this.model.maxAngle > 90){
            transformedTheta = pos.theta;
        }else{
            if (pos.theta > Math.PI / 2){
                transformedTheta = Math.PI - pos.theta;
            }else{
                transformedTheta = pos.theta;
            }
        }
        return biliniarInterpolateTable(
            this.model.FValues,
            this.model.FAngleMeasured,
            this.model.FDistanceMeasured,
            transformedTheta,
            pos.r
        );
    }
    geometryFactor(pos){
        if (pos.r == 0){
            return 1;
        }
        let geometry;
        if (this.model.pointSource){
            geometry = 1/(pos.r ** 2);
        }else{
            if ((pos.theta == 0) || (pos.theta == Math.PI)){
                geometry = 1 / ((pos.r ** 2) - ((this.model.sourceLength ** 2) / 4)); // case for if theta == 0, since that would lead to a divide by 0 error
            }else{
                let vec1 = {
                    x: (pos.x - this.pos.x + this.directionVec.x * (this.model.sourceLength / 2)),
                    y: (pos.y - this.pos.y + this.directionVec.y * (this.model.sourceLength / 2)),
                    z: (pos.z - this.pos.z + this.directionVec.z * (this.model.sourceLength / 2))
                }; //calculates vector from one end of the seed to the given pos
                let vec2 = {
                    x: (pos.x - this.pos.x - this.directionVec.x * (this.model.sourceLength / 2)),
                    y: (pos.y - this.pos.y - this.directionVec.y * (this.model.sourceLength / 2)),
                    z: (pos.z - this.pos.z - this.directionVec.z * (this.model.sourceLength / 2))
                }; //calculates vector from the opposite end of the seed to the given pos
                let beta = Math.acos((vec1.x * vec2.x + vec1.y * vec2.y + vec1.z * vec2.z) / (magnitude(vec1) * magnitude(vec2))) //finds the angle between vec1 and vec2 using dot product
                geometry = beta / (this.model.sourceLength * pos.r * Math.abs(Math.sin(pos.theta)));
            }
        }
        return geometry;
    }
    calculateDose(pos){ //this all assumes the camera is looking such that further away is positive z, so none of these calcs include z
        if (this.enabled){
            let doseRate = this.airKerma * this.model.doseRateConstant * (this.geometryFactor(pos)/this.geometryFactor({r: this.geometryRef.r, theta: this.geometryRef.theta, x:this.geometryRef.x + this.pos.x, y:this.geometryRef.y + this.pos.y, z: this.geometryRef.z})) * this.g(pos.r) * this.F(pos);
            return doseRate * 1.44 * this.model.halfLife * (this.model.HDRsource ? (1 - Math.exp(-this.dwellTime / (1.44 * this.model.halfLife))) : 1) / 100; // this is divided by 100 to convert to Gy
        }else{
            return 0;
        }
    }
    recalcDirection(){
        // calculate direction vec
        this.directionVec = {
            x: Math.cos(this.rot.theta) * Math.cos(this.rot.phi),
            y: Math.sin(this.rot.phi),
            z: Math.sin(this.rot.theta) * Math.cos(this.rot.phi)
        };
        let norm = magnitude(this.directionVec);
        this.directionVec = {
            z: this.directionVec.z / norm,
            x: this.directionVec.x / norm,
            y: this.directionVec.y / norm,
        };

        // calculate geometry reference point
        if (this.directionVec.z == 0) {
            if (this.directionVec.x == 0) {
                this.geometryRef = {x: 1, y: ((-this.directionVec.x - this.directionVec.z) / this.directionVec.y), z: 1};
            }else{
                this.geometryRef = {x: ((-this.directionVec.y - this.directionVec.z) / this.directionVec.x), y: 1, z: 1};
            }
        }else{
            this.geometryRef = {x: 1, y: 1, z: (-this.directionVec.x - this.directionVec.y) / this.directionVec.z};
        }
        norm = magnitude(this.geometryRef);
        this.geometryRef = {
            x: this.geometryRef.x / norm,
            y: this.geometryRef.y / norm,
            z: this.geometryRef.z / norm,
            r: 1,
            theta: Math.PI / 2
        };
    }
}
class Graph {
    constructor({x, y, width, height, seeds, xTicks, yTicks, perspective}){
        this.x = x;
        this.y = y;
        this.zSlice = 0; // depth of the slice being rendered by this graph from the perspective of the graph itself
        this.width = width;
        this.height = height;
        this.seeds = seeds;
        this.xTicks = xTicks;
        this.yTicks = yTicks;
        this.perspective = perspective; //maps coordinates on the graph to coordinates in space (allows to adjust perspective)
    }
    getPointDose(pos){
        return this.seeds.reduce((z,seed) => {
            let relativePos = {
                x: (pos.x - seed.pos.x),
                y: (pos.y - seed.pos.y),
                z: (pos.z - seed.pos.z)
            };
            let dot = (relativePos.x * seed.directionVec.x + relativePos.y * seed.directionVec.y + relativePos.z * seed.directionVec.z) / magnitude(relativePos);
            dot = Math.min(Math.max(dot,-1),1); // this clamps the dot product between -1 and 1 to reduce floating point error
            return z + seed.calculateDose({
                x: pos.x,
                y: pos.y,
                z: pos.z,
                r: magnitude(relativePos),
                theta: Math.acos(dot)
            });
        },0)
    }
    getIsodose(refPoint){
        let isodose = [];
        let refDose = this.getPointDose(this.perspective({x: refPoint.x, y: refPoint.y, z: this.zSlice}));
        refDose = ((refDose == 0) ? 1 : refDose);
        for (let i = 0; i < this.yTicks.length; i++){
            let slice = [];
            for (let j = 0; j < this.xTicks.length; j++){
                slice.push(100 * this.getPointDose(this.perspective({x: this.xTicks[j], y: this.yTicks[i], z: this.zSlice})) / refDose);
            }
            isodose.push(slice);
        }
        return isodose;
    }
    drawGraph(div,refPoints){
        let data = [];
        for (let i = 1; i < 128; i *= 2){
            data.push(
                {
                    z: this.getIsodose(refPoints[0]),
                    x: this.xTicks,
                    y: this.yTicks,
                    type: 'contour',
                    colorscale: "Jet",
                    contours: {
                        type: 'constraint',
                        operation: '=',
                        value: 100 * i / 8,
                        coloring: "lines",
                        showlabels: true,
                        labelfont: {
                            family: "Raleway",
                            size: 12,
                            color: "black"
                        }
                    },
                    line:{
                        width: 2,
                        smoothing: 0.85
                    },
                    name: 100 * (i / 8) + "%",
                },
            );
        };
        div.style.width = this.width + "px";
        div.style.height = this.height + "px";
        div.style.left = this.x + "px";
        div.style.top = this.y + "px";
        Plotly.newPlot(div.id, data); //does not update after window rescaling
        return div.children[0].children[0].children[0].children[4].children[0].children[3].getBoundingClientRect();
    }
}
initModule(module);
setInterval(tick,50);

function tick(){
    if ((canvas.width != window.innerWidth) || (canvas.height != window.innerHeight)){
        adjustFormatting();
        render = true;
        resetGraphs = false;
        tick();
        return;
    }else{
        if (render){
            if (module === "brachytherapy applicators"){
                if (resetGraphs){
                    adjustApplicatorGraphFormat(moduleData.graph1,moduleData.applicatorModel,{refPoints: "graph1refPoints", drawFunction: "graph1DrawApplicator", boundingBox: moduleData.divBoundGraph1, view: "front"});
                    if (!(moduleData.applicatorModel.name === "Vaginal Cylinder")){
                        adjustApplicatorGraphFormat(moduleData.graph2,moduleData.applicatorModel,{refPoints: "graph2refPoints", drawFunction: "graph2DrawApplicator", boundingBox: moduleData.divBoundGraph2, view: ((moduleData.applicatorModel.name === "Tandem/Ring") ? "top" : "side")});
                    }
                    if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
                        adjustApplicatorGraphFormat(moduleData.graph3,moduleData.applicatorModel,{refPoints: "graph3refPoints", drawFunction: "graph3DrawApplicator", boundingBox: moduleData.divBoundGraph3, view: "top"});
                    }
                    moduleData.graph1refPointLabel = [];
                    moduleData.graph1refPoints.forEach((refPoint) => {
                        moduleData.graph1refPointLabel.push(new NumberInput({
                            x: 0, y: 0, width: 0, height: 0,
                            label: {
                                text: (value) => `${value}Gy`,
                                color: {selected: "white", notSelected: "black"}
                            },bgColor: {selected: "black", notSelected: "white"},
                            getValue: () => moduleData.graph1.getPointDose(refPoint),
                            onEnter: function (value){
                                setDoseAtPoint(moduleData.graph1,refPoint,value,moduleData.graphDwellTimeSlider,moduleData.graphAirKermaSlider);
                                if (moduleData.applicatorModel.name != "Vaginal Cylinder"){
                                    setDoseAtPoint(moduleData.graph2,refPoint,value,moduleData.graphDwellTimeSlider,moduleData.graphAirKermaSlider);
                                }
                                if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
                                    setDoseAtPoint(moduleData.graph3,refPoint,value,moduleData.graphDwellTimeSlider,moduleData.graphAirKermaSlider);
                                }
                            },
                            numDecimalsEditing: 3
                        }));
                    });
                    resetGraphs = false;
                }
                adjustFormatting();
                moduleData.divBoundGraph1 = moduleData.graph1.drawGraph(document.getElementById("graph1"),moduleData.graph1refPoints);
                if (!(moduleData.applicatorModel.name === "Vaginal Cylinder")){
                    moduleData.divBoundGraph2 = moduleData.graph2.drawGraph(document.getElementById("graph2"),moduleData.graph2refPoints);
                }
                if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
                    moduleData.divBoundGraph3 = moduleData.graph3.drawGraph(document.getElementById("graph3"),moduleData.graph3refPoints);
                }
            }else{
                adjustFormatting();
                if (moduleData.divBoundGraph1){
                    moduleData.divBoundGraph1 = moduleData.graph1.drawGraph(document.getElementById("graph1"),moduleData.graph1refPoints);
                }
                if (moduleData.divBoundGraph2){
                    moduleData.divBoundGraph2 = moduleData.graph2.drawGraph(document.getElementById("graph2"),moduleData.graph2refPoints);
                }
            }
            render = false;
        }
    }

    adjustFormatting();

    if (module === "single seed"){
        ctx.clearRect(0,0,canvas.width,canvas.height);

        //update graph1 seed air kerma based on slider values
        moduleData.graph1AirKermaSlider.checkClicked();
        moduleData.graph1AirKermaSlider.draw();
        if (moduleData.graph1.seeds[0].airKerma != getAirKermaFromSlider(moduleData.graph1AirKermaSlider,moduleData.graph1.seeds[0])){
            moduleData.graph1.seeds[0].airKerma = getAirKermaFromSlider(moduleData.graph1AirKermaSlider,moduleData.graph1.seeds[0]);
            render = true;
        }
        moduleData.graph2AirKermaSlider.checkClicked();
        moduleData.graph2AirKermaSlider.draw();
        if (moduleData.graph2.seeds[0].airKerma != getAirKermaFromSlider(moduleData.graph2AirKermaSlider,moduleData.graph2.seeds[0])){
            moduleData.graph2.seeds[0].airKerma = getAirKermaFromSlider(moduleData.graph2AirKermaSlider,moduleData.graph2.seeds[0]);
            render = true;
        }

        //Draw AirKerma slider text
        moduleData.graph1AirKermaLabel.draw();
        moduleData.graph2AirKermaLabel.draw();

        // draw and update graph1 dwell time
        if (moduleData.graph1.seeds[0].model.HDRsource){
            moduleData.graph1DwellTimeSlider.checkClicked();
            moduleData.graph1DwellTimeSlider.draw();
            if (moduleData.graph1.seeds[0].dwellTime != getDwellTimeFromSlider(moduleData.graph1DwellTimeSlider)){
                moduleData.graph1.seeds[0].dwellTime = getDwellTimeFromSlider(moduleData.graph1DwellTimeSlider);
                render = true;
            }
            moduleData.graph1DwellTimeLabel.draw();
        }
        // draw and update graph2 dwell time
        if (moduleData.graph2.seeds[0].model.HDRsource){
            moduleData.graph2DwellTimeSlider.checkClicked();
            moduleData.graph2DwellTimeSlider.draw();
            if (moduleData.graph2.seeds[0].dwellTime != getDwellTimeFromSlider(moduleData.graph2DwellTimeSlider)){
                moduleData.graph2.seeds[0].dwellTime = getDwellTimeFromSlider(moduleData.graph2DwellTimeSlider);
                render = true;
            }
            moduleData.graph2DwellTimeLabel.draw();
        }

        //draw dropdowns
        moduleData.graph1ModelDropdown.drawDropdown();
        moduleData.graph2ModelDropdown.drawDropdown();

        drawSeed(moduleData.graph1.seeds[0],moduleData.graph1,moduleData.divBoundGraph1);
        drawSeed(moduleData.graph2.seeds[0],moduleData.graph2,moduleData.divBoundGraph2);

        drawAnatomy("axialView",{BladderWidth: 100, CervixWidth: 25}, formattedAnatomy);
    }
    if (module === "string of seeds"){
        ctx.clearRect(0,0,canvas.width,canvas.height);

        // update and draw spacing slider + update add seed button
        moduleData.seedSpacingSlider.checkClicked();
        if (moduleData.seedSpacing != (moduleData.seedSpacingSlider.value + 0.5)){
            moduleData.seedSpacing = (moduleData.seedSpacingSlider.value + 0.5);
            render = true;
        }
        //draw delete seed button
        if (moduleData.selectedSeed != -1){
            moduleData.airKermaSlider.checkClicked();
            let airKerma = getAirKermaFromSlider(moduleData.airKermaSlider,moduleData.graph1.seeds[moduleData.selectedSeed])
            if (moduleData.graph1.seeds[moduleData.selectedSeed].airKerma != airKerma){
                moduleData.graph1.seeds[moduleData.selectedSeed].airKerma = airKerma;
                render = true;
            }
            moduleData.airKermaLabel.draw();
            moduleData.deleteSeed.draw();
            moduleData.airKermaSlider.draw();

            if (moduleData.graph1.seeds[moduleData.selectedSeed].model.HDRsource){
                moduleData.dwellTimeSlider.checkClicked();
                let dwellTime = getDwellTimeFromSlider(moduleData.dwellTimeSlider);
                if (moduleData.graph1.seeds[moduleData.selectedSeed].dwellTime != dwellTime){
                    moduleData.graph1.seeds[moduleData.selectedSeed].dwellTime = dwellTime;
                    render = true;
                }
                moduleData.dwellTimeLabel.draw();
                moduleData.dwellTimeSlider.draw();
            }
        }
        moduleData.addSeed.draw();
        moduleData.seedSpacingSlider.draw();

        //draw "Source Spacing" text
        moduleData.seedSpacingLabel.draw();

        // draw model dropdown graph1
        moduleData.graph1ModelDropdown.drawDropdown();
    }
    if (module === "planar array of seeds"){
        ctx.clearRect(0,0,canvas.width,canvas.height);

        // seed spacing slider graph 1
        moduleData.graph1SeedSpacingSlider.checkClicked();
        if (moduleData.graph1SeedSpacing != 0.5 + moduleData.graph1SeedSpacingSlider.value){
            moduleData.graph1SeedSpacing = 0.5 + moduleData.graph1SeedSpacingSlider.value;
            render = true;
            tick();
        }
        moduleData.graph1SeedSpacingSlider.draw();
        moduleData.graph1SeedSpacingLabel.draw();
        // seed spacing slider graph 2
        moduleData.graph2SeedSpacingSlider.checkClicked();
        if (moduleData.graph2SeedSpacing != 0.5 + moduleData.graph2SeedSpacingSlider.value){
            moduleData.graph2SeedSpacing = 0.5 + moduleData.graph2SeedSpacingSlider.value;
            render = true;
            tick();
        }
        moduleData.graph2SeedSpacingSlider.draw();
        moduleData.graph2SeedSpacingLabel.draw();

        moduleData.graph1AddSeeds.draw();
        moduleData.graph1RemoveSeeds.draw();
        moduleData.graph2AddSeeds.draw();
        moduleData.graph2RemoveSeeds.draw();

        //draw seed editing sliders graph1
        if ((moduleData.selectedGraph === "graph1") && (moduleData.selectedSeed != -1)){
            moduleData.graph1AirKermaSlider.checkClicked();
            moduleData.graph1AirKermaSlider.draw();
            if (moduleData.graph1.seeds[moduleData.selectedSeed].airKerma != getAirKermaFromSlider(moduleData.graph1AirKermaSlider,moduleData.graph1.seeds[moduleData.selectedSeed])){
                moduleData.graph1.seeds[moduleData.selectedSeed].airKerma = getAirKermaFromSlider(moduleData.graph1AirKermaSlider,moduleData.graph1.seeds[moduleData.selectedSeed]);
                render = true;
            }
            moduleData.airKermaLabel.draw();
            if (moduleData.graph1.seeds[moduleData.selectedSeed].model.HDRsource){
                moduleData.graph1DwellTimeSlider.checkClicked();
                moduleData.graph1DwellTimeSlider.draw();
                if (moduleData.graph1.seeds[moduleData.selectedSeed].dwellTime != getDwellTimeFromSlider(moduleData.graph1DwellTimeSlider,moduleData.graph1.seeds[moduleData.selectedSeed])){
                    moduleData.graph1.seeds[moduleData.selectedSeed].dwellTime = getDwellTimeFromSlider(moduleData.graph1DwellTimeSlider,moduleData.graph1.seeds[moduleData.selectedSeed]);
                    render = true;
                }
                moduleData.dwellTimeLabel.draw();
            }
        }

        //draw seed editing sliders graph2
        if ((moduleData.selectedGraph === "graph2") && (moduleData.selectedSeed != -1)){
            moduleData.graph2AirKermaSlider.checkClicked();
            moduleData.graph2AirKermaSlider.draw();
            if (moduleData.graph2.seeds[moduleData.selectedSeed].airKerma != getAirKermaFromSlider(moduleData.graph2AirKermaSlider,moduleData.graph2.seeds[moduleData.selectedSeed])){
                moduleData.graph2.seeds[moduleData.selectedSeed].airKerma = getAirKermaFromSlider(moduleData.graph2AirKermaSlider,moduleData.graph2.seeds[moduleData.selectedSeed]);
                render = true;
            }
            moduleData.airKermaLabel.draw();
            if (moduleData.graph2.seeds[moduleData.selectedSeed].model.HDRsource){
                moduleData.graph2DwellTimeSlider.checkClicked();
                moduleData.graph2DwellTimeSlider.draw();
                if (moduleData.graph2.seeds[moduleData.selectedSeed].dwellTime != getDwellTimeFromSlider(moduleData.graph2DwellTimeSlider,moduleData.graph2.seeds[moduleData.selectedSeed])){
                    moduleData.graph2.seeds[moduleData.selectedSeed].dwellTime = getDwellTimeFromSlider(moduleData.graph2DwellTimeSlider,moduleData.graph2.seeds[moduleData.selectedSeed]);
                    render = true;
                }
                moduleData.dwellTimeLabel.draw();
            }
        }

        moduleData.graph1ModelDropdown.drawDropdown();
        moduleData.graph2ModelDropdown.drawDropdown();
    }
    if ((typeof moduleData.selectedSeed != "undefined") && (typeof moduleData.sourceToggle != "undefined")){
        // draw source toggle if an LDR source is selected
        if ((moduleData.selectedSeed != -1) && (!moduleData[moduleData.selectedGraph].seeds[moduleData.selectedSeed].model.HDRsource)){
            moduleData.sourceToggle.draw();
        }
    }
    if (module === "brachytherapy applicators"){
        //brachytheapy appliators window
        ctx.clearRect(0,0,canvas.width,canvas.height);

        //draw treatment time
        let treatmentTime = "Total Treatment Time: " + (moduleData.graph1.seeds.reduce((acc,curr) => acc + curr.dwellTime, 0) * 60).toFixed(2) + " mins";
        let airKermaText = "Air Kerma: " + getAirKermaFromSlider(moduleData.graphAirKermaSlider,moduleData.graph1.seeds[0]).toFixed(2) + " Ci";
        ctx.font = Math.min(
            getFontSize(canvas.width / 3,canvas.height * 0.05,treatmentTime,(size) => `${size}px monospace`),
            getFontSize(canvas.width * 0.25,canvas.height * 0.05,airKermaText,(size) => `${size}px monospace`)
        ) + "px monospace";
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.fillText(treatmentTime,0,canvas.height * 0.15);

        moduleData.graphAirKermaSlider.x = canvas.width * 0.65;
        let airKermaTextMetrics = ctx.measureText(airKermaText);
        moduleData.graphAirKermaSlider.y = canvas.height * 0.15 + (airKermaTextMetrics.actualBoundingBoxDescent - airKermaTextMetrics.actualBoundingBoxAscent) / 2;
        moduleData.graphAirKermaSlider.length = canvas.width * 0.16;
        moduleData.graphAirKermaSlider.thickness = Math.min(canvas.width,canvas.height) * 0.01;

        moduleData.airKermaLabel.draw();

        if (moduleData.graph1.seeds[0].airKerma != getAirKermaFromSlider(moduleData.graphAirKermaSlider,moduleData.graph1.seeds[0])){
            moduleData.graphAirKermaSlider.value = getValueFromAirKerma(moduleData.graph1.seeds[0]);
        }
        moduleData.graphAirKermaSlider.draw();
        moduleData.graphAirKermaSlider.checkClicked();
        if (moduleData.graph1.seeds[0].airKerma != getAirKermaFromSlider(moduleData.graphAirKermaSlider,moduleData.graph1.seeds[0])){
            let editingSeeds = [moduleData.graph1];
            if (moduleData.applicatorModel.name != "Vaginal Cylinder"){editingSeeds.push(moduleData.graph2);}
            if (moduleData.applicatorModel.name === "Tandem/Ovoids"){editingSeeds.push(moduleData.graph3);}
            editingSeeds.forEach((graph) => {
                graph.seeds.forEach((seed) => {
                    seed.airKerma = getAirKermaFromSlider(moduleData.graphAirKermaSlider,seed);
                });
            });
            render = true;
            resetGraphs = false;
        }

        //reset dwell times button
        moduleData.resetDwellTimes.draw();

        adjustApplicatorRenderer(moduleData.graph1,moduleData.applicatorModel,{refPoints: "graph1refPoints", drawFunction: "graph1DrawApplicator", boundingBox: moduleData.divBoundGraph1, view: "front"});
        moduleData.graph1DrawApplicator();
        // erase graph2 if applicator is Vaginal Cylinder
        if (!(moduleData.applicatorModel.name === "Vaginal Cylinder")){
            adjustApplicatorRenderer(moduleData.graph2,moduleData.applicatorModel,{refPoints: "graph2refPoints", drawFunction: "graph2DrawApplicator", boundingBox: moduleData.divBoundGraph2, view: ((moduleData.applicatorModel.name === "Tandem/Ring") ? "top" : "side")});
            moduleData.graph2DrawApplicator();
        }else{
            let div = document.getElementById("graph2");
            while (div.firstChild){
                div.removeChild(div.firstChild);
            }
        }
        // add graph3 if applicator is Tandem/Ovoids
        if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
            adjustApplicatorRenderer(moduleData.graph3,moduleData.applicatorModel,{refPoints: "graph3refPoints", drawFunction: "graph3DrawApplicator", boundingBox: moduleData.divBoundGraph3, view: "top"});
            moduleData.graph3DrawApplicator();
        }else{
            let div = document.getElementById("graph3");
            while (div.firstChild){
                div.removeChild(div.firstChild);
            }
        }
        moduleData.applicatorModelDropdown.drawDropdown();

        // draw model dropdown graphs
        moduleData.graphModelDropdown.drawDropdown();

        //draw positioning bars
        let numGraphs;
        if (moduleData.applicatorModel.name === "Vaginal Cylinder"){numGraphs = 1;}
        if (moduleData.applicatorModel.name === "Tandem/Ovoids"){numGraphs = 3;}
        if (moduleData.applicatorModel.name === "Tandem/Ring"){numGraphs = 2;}
        if (numGraphs > 1){
            for (let i = 0; i < numGraphs; i++){
                for (let j = 0; j < numGraphs; j++){
                    /*
                    Transforms ((zSlice of graph k) + 1, (zSlice of graph k) + 1,zSlice of graph k) from the of
                    perspective of graph k to the actual point in space then transforms that new point based on
                    the perspective of graph i. For example if i = 1 and k = 3 then this new point would be
                    ((zSlice of graph k) k + 1, zSlice of graph k, (zSlice of graph k) k + 1)). Notice that this
                    transformation will swap zSlice with the x or y position, assuming i != k, and we can check
                    which coords were swapped by comparing them with the known zSlice value. This allows us to
                    color that axis at the specified zSlice value.
                    */
                    if (i != j){
                        let transformedSlice = moduleData[`graph${i + 1}`].perspective(
                            moduleData[`graph${j + 1}`].perspective({
                                x: moduleData[`graph${j + 1}`].zSlice + 1,
                                y: moduleData[`graph${j + 1}`].zSlice + 1,
                                z: moduleData[`graph${j + 1}`].zSlice
                            })
                        );
                        let barPos1 = graphToScreenPos(
                            transformedSlice,
                            moduleData[`graph${i + 1}`],
                            moduleData[`divBoundGraph${i + 1}`]
                        );
                        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
                        ctx.lineWidth = Math.min(canvas.width, canvas.height) * 0.003;
                        ctx.beginPath();
                        if (transformedSlice.x == moduleData[`graph${j + 1}`].zSlice){
                            ctx.moveTo(barPos1.x,moduleData[`graph${i + 1}`].y);
                            ctx.lineTo(barPos1.x,moduleData[`graph${i + 1}`].y + moduleData[`graph${i + 1}`].height);
                        }else{
                            ctx.moveTo(moduleData[`graph${i + 1}`].x, barPos1.y);
                            ctx.lineTo(moduleData[`graph${i + 1}`].x + moduleData[`graph${i + 1}`].width, barPos1.y);
                        }
                        ctx.stroke();
                    }
                }
            }
        }
    }
    // draw reference point labels
    let numGraphs;
    if (module === "single seed"){numGraphs = 2;}
    if (module === "string of seeds"){numGraphs = 1;}
    if (module === "planar array of seeds"){numGraphs = 2;}
    if (module === "brachytherapy applicators"){
        if (moduleData.applicatorModel.name === "Vaginal Cylinder"){numGraphs = 1;}
        if (moduleData.applicatorModel.name === "Tandem/Ovoids"){numGraphs = 3;}
        if (moduleData.applicatorModel.name === "Tandem/Ring"){numGraphs = 2;}
        moduleData.graph1refPointLabel.forEach((label) => label.draw()); // brachytherapy applicators only have labels for graph 1 (since all graphs are the same) so they are drawn here
    }
    for (let i = 0; i < numGraphs; i++){
        moduleData[`graph${i + 1}refPoints`].forEach((refPoint,ind) => {
            let divBound = moduleData[`divBoundGraph${i + 1}`];
            let refPos = graphToScreenPos(moduleData[`graph${i + 1}`].perspective(refPoint),moduleData[`graph${i + 1}`],divBound);
            let size = Math.min(divBound.width,divBound.height) * 0.01;
            ctx.strokeStyle = "red";
            ctx.lineWidth = Math.min(canvas.width, canvas.height) * 0.003;
            ctx.beginPath();
            ctx.moveTo(refPos.x + size,refPos.y + size);
            ctx.lineTo(refPos.x - size,refPos.y - size);
            ctx.lineTo(refPos.x,refPos.y);
            ctx.lineTo(refPos.x - size,refPos.y + size);
            ctx.lineTo(refPos.x + size,refPos.y - size);
            ctx.stroke();

            if (module != "brachytherapy applicators"){
                moduleData[`graph${i + 1}refPointLabel`][ind].draw();
            }
        });
    }
    if ((module === "string of seeds") || (module === "planar array of seeds") || (module === "brachytherapy applicators")){
        //draw "dwell positions of seeds" graph1
        drawGraphSeeds(moduleData.graph1,moduleData.divBoundGraph1,"graph1");
    }
    if (moduleData.graph1){
        // label dose at cursor graph 1
        if ((mouse.x > moduleData.divBoundGraph1.x) && (mouse.x < moduleData.divBoundGraph1.x + moduleData.divBoundGraph1.width)
            && (mouse.y > moduleData.divBoundGraph1.y) && (mouse.y < moduleData.divBoundGraph1.y + moduleData.divBoundGraph1.height)){
            mouseGraphPos = {
                x: (((mouse.x - moduleData.divBoundGraph1.x) / moduleData.divBoundGraph1.width)*
                    (getMax(moduleData.graph1.xTicks) - getMin(moduleData.graph1.xTicks)) + getMin(moduleData.graph1.xTicks)),
                y: (((mouse.y - moduleData.divBoundGraph1.y) / moduleData.divBoundGraph1.height)*
                    (getMin(moduleData.graph1.yTicks) - getMax(moduleData.graph1.yTicks)) + getMax(moduleData.graph1.yTicks))
            }
            ctx.beginPath();
            ctx.font = "16px serif";
            let dose = moduleData.graph1.getPointDose({x: mouseGraphPos.x, y: mouseGraphPos.y, z: moduleData.graph1.zSlice}).toFixed(2);
            let textDimensions = ctx.measureText(dose + " Gy");
            let textHeight = textDimensions.actualBoundingBoxAscent + textDimensions.actualBoundingBoxDescent;
            ctx.fillStyle = "white";
            ctx.fillRect(mouse.x,mouse.y - textHeight,textDimensions.width,textHeight);
            ctx.fillStyle = "black";
            ctx.fillText(dose + " Gy",mouse.x,mouse.y);
        }
    }
    if (moduleData.graph2){

        //dose label for graph 2
        if ((mouse.x > moduleData.divBoundGraph2.x) && (mouse.x < moduleData.divBoundGraph2.x + moduleData.divBoundGraph2.width)
            && (mouse.y > moduleData.divBoundGraph2.y) && (mouse.y < moduleData.divBoundGraph2.y + moduleData.divBoundGraph2.height)){
            mouseGraphPos = {
                x: (((mouse.x - moduleData.divBoundGraph2.x) / moduleData.divBoundGraph2.width)*
                    (getMax(moduleData.graph2.xTicks) - getMin(moduleData.graph2.xTicks)) + getMin(moduleData.graph2.xTicks)),
                y: (((mouse.y - moduleData.divBoundGraph2.y) / moduleData.divBoundGraph2.height)*
                    (getMin(moduleData.graph2.yTicks) - getMax(moduleData.graph2.yTicks)) + getMax(moduleData.graph2.yTicks))
            }
            ctx.beginPath();
            ctx.font = "16px serif";
            let dose = moduleData.graph2.getPointDose({x: mouseGraphPos.x, y: mouseGraphPos.y, z: moduleData.graph2.zSlice}).toFixed(2);
            let textDimensions = ctx.measureText(dose + " Gy");
            let textHeight = textDimensions.actualBoundingBoxAscent + textDimensions.actualBoundingBoxDescent;
            ctx.fillStyle = "white";
            ctx.fillRect(mouse.x,mouse.y - textHeight,textDimensions.width,textHeight);
            ctx.fillStyle = "black";
            ctx.fillText(dose +" Gy",mouse.x,mouse.y);
        }

        //draw "dwell positions of seeds" graph2
        if (module != "single seed"){
            if (module === "brachytherapy applicators"){
                if (moduleData.applicatorModel.name != "Vaginal Cylinder"){
                    drawGraphSeeds(moduleData.graph2,moduleData.divBoundGraph2,"graph2");
                }
            }else{
                drawGraphSeeds(moduleData.graph2,moduleData.divBoundGraph2,"graph2");
            }
        }
    }
    if (moduleData.graph3 && (moduleData.applicatorModel.name === "Tandem/Ovoids")){
        //dose label for graph 3
        if ((mouse.x > moduleData.divBoundGraph3.x) && (mouse.x < moduleData.divBoundGraph3.x + moduleData.divBoundGraph3.width)
            && (mouse.y > moduleData.divBoundGraph3.y) && (mouse.y < moduleData.divBoundGraph3.y + moduleData.divBoundGraph3.height)){
            mouseGraphPos = {
                x: (((mouse.x - moduleData.divBoundGraph3.x) / moduleData.divBoundGraph3.width)*
                    (getMax(moduleData.graph3.xTicks) - getMin(moduleData.graph3.xTicks)) + getMin(moduleData.graph3.xTicks)),
                y: (((mouse.y - moduleData.divBoundGraph3.y) / moduleData.divBoundGraph3.height)*
                    (getMin(moduleData.graph3.yTicks) - getMax(moduleData.graph3.yTicks)) + getMax(moduleData.graph3.yTicks))
            }
            ctx.beginPath();
            ctx.font = "16px serif";
            let dose = moduleData.graph3.getPointDose({x: mouseGraphPos.x, y: mouseGraphPos.y, z: moduleData.graph3.zSlice}).toFixed(2);
            let textDimensions = ctx.measureText(dose + " Gy");
            let textHeight = textDimensions.actualBoundingBoxAscent + textDimensions.actualBoundingBoxDescent;
            ctx.fillStyle = "white";
            ctx.fillRect(mouse.x,mouse.y - textHeight,textDimensions.width,textHeight);
            ctx.fillStyle = "black";
            ctx.fillText(dose +" Gy",mouse.x,mouse.y);
        }

        //draw "dwell positions of seeds" graph3
        drawGraphSeeds(moduleData.graph3,moduleData.divBoundGraph3,"graph3");
    }
    if ((typeof moduleData.selectedSeed != "undefined") && (moduleData.selectedSeed != -1) && (module === "brachytherapy applicators")){
        // draw Dwell time box in brachy applicators module
        let selectedGraph = moduleData[moduleData.selectedGraph];
        let seedPos = graphToScreenPos(selectedGraph.perspective(selectedGraph.seeds[moduleData.selectedSeed].pos),selectedGraph,moduleData["divBoundG" + moduleData.selectedGraph.substring(1)]);
        let editMenuPos = {x: 0, y: 0};
        if (seedPos.x < canvas.width * 0.5){
            editMenuPos.x = seedPos.x + canvas.width * 0.05;;
        }else{
            editMenuPos.x = seedPos.x - canvas.width * 0.25;
        }
        if (seedPos.y < canvas.height * 0.5){
            editMenuPos.y = seedPos.y + canvas.height * 0.05;
        }else{
            editMenuPos.y = seedPos.y - canvas.height * 0.25;
        }
        ctx.strokeStyle = "black";
        ctx.lineWidth = Math.min(canvas.width,canvas.height) * 0.01;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.moveTo(seedPos.x,seedPos.y);
        ctx.lineTo(editMenuPos.x + canvas.width * 0.1,editMenuPos.y + canvas.height * 0.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.rect(editMenuPos.x,editMenuPos.y,canvas.width * 0.2, canvas.height * 0.1);
        ctx.fill();
        ctx.stroke();

        moduleData.graphDwellTimeSlider.draw();
        moduleData.graphDwellTimeSlider.checkClicked();
        if (selectedGraph.seeds[moduleData.selectedSeed].dwellTime != getDwellTimeFromSlider(moduleData.graphDwellTimeSlider,selectedGraph.seeds[moduleData.selectedSeed])){
            let editingSeeds = [moduleData.graph1.seeds[moduleData.selectedSeed]];
            if (moduleData.applicatorModel.name != "Vaginal Cylinder"){editingSeeds.push(moduleData.graph2.seeds[moduleData.selectedSeed]);}
            if (moduleData.applicatorModel.name === "Tandem/Ovoids"){editingSeeds.push(moduleData.graph3.seeds[moduleData.selectedSeed]);}
            editingSeeds.forEach((seed) => {
                seed.dwellTime = getDwellTimeFromSlider(moduleData.graphDwellTimeSlider,seed);
            });
            render = true;
            resetGraphs = false;
        }

        moduleData.dwellTimeLabel.draw();
    }

    //draw module selection bar
    moduleData.moduleSelectBar.forEach((button) => {
        button.draw();
    });
}

function initModule(mod,previousMod){
    // this function initalizes a module, or loads a previously initalized module
    if (mod === "string of seeds"){
        let div = document.getElementById("graph2");
        while (div.firstChild){
            div.removeChild(div.firstChild);
        }
    }
    if (!(mod === "brachytherapy applicators")){
        let div = document.getElementById("graph3");
        while (div.firstChild){
            div.removeChild(div.firstChild);
        }
    }
    if (previousMod && savedModuleData[mod]){ //everything below this is only run if the page is opened for the first time, everything above is run every time a page is opened
        savedModuleData[previousMod] = {...moduleData}; // save module data
        moduleData = {...savedModuleData[mod]}; // load module data
        render = true;
        resetGraphs = true;
        tick();
        return;
    }
    if (previousMod){
        savedModuleData[previousMod] = moduleData; // save module data
    }
    if (mod === "single seed"){
        let ticks = [];
        for (let j = -2; j <= 2; j+= 0.0625){ticks.push(j);}
        moduleData = {
            graph1: (
                new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [new Seed({x:0, y:0, z:0},{phi: 0, theta: 0},TheraSeed200,airKermaSliderLimits.LDR.min,0.00833)], xTicks: ticks, yTicks: ticks, perspective: (point) => point}) //x,y,width, and height are all set to 0 since they will be later formatted with an adjustFormatting() call
            ),
            divBoundGraph1: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph2: (
                new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [new Seed({x:0, y:0, z:0},{phi: 0, theta: 0},GammaMedHDRPlus,airKermaSliderLimits.HDR.min,0.00833)], xTicks: ticks, yTicks: ticks, perspective: (point) => point}) //x,y,width, and height are all set to 0 since they will be later formatted with an adjustFormatting() call
            ),
            divBoundGraph2: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph1ModelDropdown: new Dropdown(
                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "black", onClick: () => {},label: {text: "", font: "default", color: "white"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}}),[]
            ),
            graph2ModelDropdown: new Dropdown(
                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "black", onClick: () => {},label: {text: "", font: "default", color: "white"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}}),[]
            ),
            graph1refPoints: [{x: 0, y: 1, z: 0}],
            graph2refPoints: [{x: 0, y: 1, z: 0}],
            graph1AirKermaSlider: new Slider(0,0,0,0,"black",0,0),
            graph2AirKermaSlider: new Slider(0,0,0,0,"black",0,0),
            graph1DwellTimeSlider: new Slider(0,0,0,0,"black",0,0),
            graph2DwellTimeSlider: new Slider(0,0,0,0,"black",0,0),
        };
        moduleData.graph1DwellTimeSlider.value = getValueFromDwellTime(moduleData.graph1.seeds[0]);
        moduleData.graph2DwellTimeSlider.value = getValueFromDwellTime(moduleData.graph2.seeds[0]);
        moduleData.graph1AirKermaLabel = new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Air Kerma: ${value}U`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: () => moduleData.graph1.seeds[0].airKerma,
            onEnter: function (value){
                let clampedVal = Math.min(value,(moduleData.graph1.seeds[0].model.HDRsource) ? airKermaSliderLimits.HDR.max : airKermaSliderLimits.LDR.max);
                clampedVal = Math.max(clampedVal,(moduleData.graph1.seeds[0].model.HDRsource) ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min);
                moduleData.graph1.seeds[0].airKerma = clampedVal;
                moduleData.graph1AirKermaSlider.value = getValueFromAirKerma(moduleData.graph1.seeds[0]);
            },
            numDecimalsEditing: 3
        });
        moduleData.graph2AirKermaLabel = new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Air Kerma: ${value}U`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: () => moduleData.graph2.seeds[0].airKerma,
            onEnter: function (value){
                let clampedVal = Math.min(value,(moduleData.graph2.seeds[0].model.HDRsource) ? airKermaSliderLimits.HDR.max : airKermaSliderLimits.LDR.max);
                clampedVal = Math.max(clampedVal,(moduleData.graph2.seeds[0].model.HDRsource) ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min);
                moduleData.graph2.seeds[0].airKerma = clampedVal;
                moduleData.graph2AirKermaSlider.value = getValueFromAirKerma(moduleData.graph2.seeds[0]);
            },
            numDecimalsEditing: 3
        });
        moduleData.graph1DwellTimeLabel = new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Dwell Time: ${value} seconds`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: () => moduleData.graph1.seeds[0].dwellTime * 3600,
            onEnter: function (value){
                let clampedVal = Math.min(value / 3600,0.0833333333333);
                clampedVal = Math.max(clampedVal,0);
                moduleData.graph1.seeds[0].dwellTime = clampedVal;
                moduleData.graph1DwellTimeSlider.value = getValueFromDwellTime(moduleData.graph1.seeds[0]);
            },
            numDecimalsEditing: 3
        });
        moduleData.graph2DwellTimeLabel = new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Dwell Time: ${value} seconds`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: () => moduleData.graph2.seeds[0].dwellTime * 3600,
            onEnter: function (value){
                let clampedVal = Math.min(value / 3600,0.0833333333333);
                clampedVal = Math.max(clampedVal,0);
                moduleData.graph2.seeds[0].dwellTime = clampedVal;
                moduleData.graph2DwellTimeSlider.value = getValueFromDwellTime(moduleData.graph2.seeds[0]);
            },
            numDecimalsEditing: 3
        });
    }
    if (mod === "string of seeds"){
        let xTicks = [];
        let yTicks = [];
        for (let j = -10; j <= 10; j+= 0.25){xTicks.push(j);}
        for (let j = -2; j <= 2; j += 0.125){yTicks.push(j);}
        moduleData = {
            graph1: new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [new Seed({x: 0, y: 0, z: 0},{phi: 0, theta: 0},BEBIG_GK60M21,airKermaSliderLimits.HDR.min,0.00833)],xTicks: xTicks, yTicks: yTicks, perspective: (point) => point}),
            divBoundGraph1: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph1refPoints: [{x: 0, y: 1, z: 0}],
            addSeed: new Button({x: 0, y: 0, width: 0, height: 0, label: {text: "Add Source +",font: "default", color: "black"}, bgColor: "rgb(40, 197, 53)",
                onClick: () => {
                    if ((moduleData.graph1.seeds.length * moduleData.seedSpacing) <= (getMax(moduleData.graph1.xTicks) - getMin(moduleData.graph1.xTicks))){
                        moduleData.graph1.seeds.push(
                            new Seed(
                                {x: 0, y: 0, z: 0},
                                {phi: 0, theta: 0},
                                moduleData.graph1.seeds[0].model,
                                (moduleData.graph1.seeds[0].model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min)
                                ,0.00833
                            )
                        );
                        render = true;
                        tick();
                    }
                },outline: {color: "black",thickness: Math.min(canvas.width,canvas.height) * 0.001}
            }),
            seedSpacing: 1, // measured in cm
            seedSpacingSlider: new Slider(0,0,0,0,"black",0,0.5),
            selectedSeed: -1,
            deleteSeed: new Button({x: 0, y: 0, width: 0, height: 0, label: {text: "Delete Source -",font: "default", color: "black"}, bgColor: "rgb(197, 40, 40)",
                onClick: () => {
                    if (moduleData.graph1.seeds.length > 1){
                        moduleData.graph1.seeds.splice(moduleData.selectedSeed,1);
                        moduleData.selectedSeed = -1;
                        render = true;
                        tick();
                    }
                },outline: {color: "black",thickness: Math.min(canvas.width,canvas.height) * 0.001}
            }),
            airKermaSlider: new Slider(0,0,0,0,"black",0,0.5),
            graph1ModelDropdown: new Dropdown(
                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "black", onClick: () => {},label: {text: "", font: "default", color: "white"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}}),[]
            ),
            dwellTimeSlider: new Slider(0,0,0,0,"black",0,0.5),
        };
        moduleData.seedSpacingLabel = new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Source Spacing: ${value}cm`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: () => moduleData.seedSpacing,
            onEnter: function (value){
                let clampedVal = Math.max(Math.min(value,1.5),0.5);
                moduleData.seedSpacing = clampedVal;
                moduleData.seedSpacingSlider.value = clampedVal - 0.5;
                render = true;
            },
            numDecimalsEditing: 2
        });
    }
    if (mod === "planar array of seeds"){
        let graphTick = [];
        for (let j = -5; j <= 5; j+= 0.25){graphTick.push(j);}
        moduleData = {
            graph1: new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [],xTicks: graphTick, yTicks: graphTick, perspective: (point) => point}),
            divBoundGraph1: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph1refPoints: [{x: 0, y: 0, z: 0}],
            graph1SeedSpacing: 1,
            graph1SeedSpacingSlider: new Slider(0,0,0,0,"black",0,0.5),
            graph1ModelDropdown: new Dropdown(
                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "black", onClick: () => {},label: {text: "", font: "default", color: "white"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}}),[]
            ),
            graph1AirKermaSlider: new Slider(0,0,0,0,"black",0,0.5),
            graph1DwellTimeSlider: new Slider(0,0,0,0,"black",0,0.5),
            graph1AddSeeds: new Button({x: 0, y: 0, width: 0, height: 0, label: {text: "Expand Array +",font: "default", color: "black"}, bgColor: "rgb(40, 197, 53)",
                onClick: () => {
                    if (
                        (Math.sqrt(moduleData.graph1.seeds.length) + 2) * moduleData.graph1SeedSpacing
                        <= Math.min(
                            getMax(moduleData.graph1.xTicks) - getMin(moduleData.graph1.xTicks),
                            getMax(moduleData.graph1.yTicks) - getMin(moduleData.graph1.yTicks)
                        )
                    ){ //restricts adding seeds if they exceed the bound of the graph
                        let numNewSeeds = (4 * Math.sqrt(moduleData.graph1.seeds.length) + 4);
                        for (let i = 0; i < numNewSeeds; i++){
                            moduleData.graph1.seeds.push(
                                new Seed(
                                    {x: 0, y: 0, z: 0},
                                    {phi: 0, theta: 0},
                                    moduleData.graph1.seeds[0].model,
                                    (moduleData.graph1.seeds[0].model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min)
                                    ,0.00833
                                )
                            );
                        }
                        render = true;
                        tick();
                    }
                },outline: {color: "black",thickness: Math.min(canvas.width,canvas.height) * 0.001}
            }),
            graph1RemoveSeeds: new Button({x: 0, y: 0, width: 0, height: 0, label: {text: "Shrink Array -",font: "default", color: "black"}, bgColor: "rgb(197, 40, 40)",
                onClick: () => {
                    if (moduleData.graph1.seeds.length > 4){ //restricts adding seeds if they exceed the bound of the graph
                        moduleData.graph1.seeds.splice(0,4 * Math.sqrt(moduleData.graph1.seeds.length) - 4);
                        render = true;
                        tick();
                    }
                },outline: {color: "black",thickness: Math.min(canvas.width,canvas.height) * 0.001}
            }),
            graph2: new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [],xTicks: graphTick, yTicks: graphTick, perspective: (point) => point}),
            divBoundGraph2: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph2refPoints: [{x: 0, y: 0, z: 0}],
            graph2SeedSpacing: 1,
            graph2SeedSpacingSlider: new Slider(0,0,0,0,"black",0,0.5),
            graph2ModelDropdown: new Dropdown(
                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "black", onClick: () => {},label: {text: "", font: "default", color: "white"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}}),[]
            ),
            graph2AddSeeds: new Button({x: 0, y: 0, width: 0, height: 0, label: {text: "Expand Array +",font: "default", color: "black"}, bgColor: "rgb(40, 197, 53)",
                onClick: () => {
                    if (
                        (Math.sqrt(moduleData.graph2.seeds.length) + 2) * moduleData.graph2SeedSpacing
                        <= Math.min(
                            getMax(moduleData.graph2.xTicks) - getMin(moduleData.graph2.xTicks),
                            getMax(moduleData.graph2.yTicks) - getMin(moduleData.graph2.yTicks)
                        )
                    ){ //restricts adding seeds if they exceed the bound of the graph
                        let numNewSeeds = (4 * Math.sqrt(moduleData.graph2.seeds.length) + 4);
                        for (let i = 0; i < numNewSeeds; i++){
                            moduleData.graph2.seeds.push(
                                new Seed(
                                    {x: 0, y: 0, z: 0},
                                    {phi: 0, theta: 0},
                                    moduleData.graph2.seeds[0].model,
                                    (moduleData.graph2.seeds[0].model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min)
                                    ,0.00833
                                )
                            );
                        }
                        render = true;
                        tick();
                    }
                },outline: {color: "black",thickness: 0}
            }),
            graph2RemoveSeeds: new Button({x: 0, y: 0, width: 0, height: 0, label: {text: "Shrink Array -",font: "default", color: "black"}, bgColor: "rgb(197, 40, 40)",
                onClick: () => {
                    if (moduleData.graph2.seeds.length > 4){ //restricts adding seeds if they exceed the bound of the graph
                        moduleData.graph2.seeds.splice(0,4 * Math.sqrt(moduleData.graph2.seeds.length) - 4);
                        render = true;
                        tick();
                    }
                },outline: {color: "black",thickness: Math.min(canvas.width,canvas.height) * 0.001}
            }),
            graph2AirKermaSlider: new Slider(0,0,0,0,"black",0,0.5),
            graph2DwellTimeSlider: new Slider(0,0,0,0,"black",0,0.5),
        }
        for (let i = -1.5; i <= 1.5; i += 1){
            for (let j = -1.5; j <= 1.55; j += 1){
                moduleData.graph1.seeds.push(new Seed({x: j, y: i, z: 0},{phi: 0, theta: 0},TheraSeed200,airKermaSliderLimits.LDR.min,0.00833));
                moduleData.graph2.seeds.push(new Seed({x: j, y: i, z: 0},{phi: 0, theta: 0},GammaMedHDRPlus,airKermaSliderLimits.HDR.min,0.00833));
            }
        }
        moduleData.graph1SeedSpacingLabel = new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Source Spacing: ${value}cm`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: () => moduleData.graph1SeedSpacing,
            onEnter: function (value){
                let clampedVal = Math.max(Math.min(value,1.5),0.5);
                moduleData.graph1SeedSpacing = clampedVal;
                moduleData.graph1SeedSpacingSlider.value = clampedVal - 0.5;
                render = true;
            },
            numDecimalsEditing: 2
        });
        moduleData.graph2SeedSpacingLabel = new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Source Spacing: ${value}cm`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: () => moduleData.graph2SeedSpacing,
            onEnter: function (value){
                let clampedVal = Math.max(Math.min(value,1.5),0.5);
                moduleData.graph2SeedSpacing = clampedVal;
                moduleData.graph2SeedSpacingSlider.value = clampedVal - 0.5;
                render = true;
            },
            numDecimalsEditing: 2
        });
    }
    if (mod === "brachytherapy applicators"){
        moduleData = {
            graph1: new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [],xTicks: [], yTicks: [], perspective: (point) => point}),
            divBoundGraph1: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph1refPoints: [{x: 0, y: 0, z: 0}],
            graph2: new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [],xTicks: [], yTicks: [],
                perspective: (point) => {
                    return {
                        x: point.z,
                        y: point.y,
                        z: point.x
                    };
                }
            }),
            divBoundGraph2: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph2refPoints: [{x: 0, y: 0, z: 0}],
            graph3: new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [],xTicks: [], yTicks: [],
                perspective: (point) => {
                    return {
                        x: point.x,
                        y: point.z,
                        z: point.y
                    };
                }
            }),
            divBoundGraph3: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph3refPoints: [{x: 0, y: 0, z: 0}],
            graphModelDropdown: new Dropdown(
                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "black", onClick: () => {},label: {text: "", font: "default", color: "white"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}}),[]
            ),
            applicatorModelDropdown: new Dropdown(
                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "black", onClick: () => {},label: {text: "", font: "default", color: "white"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}}),[]
            ),
            graphAirKermaSlider: new Slider(0,0,0,0,"black",0,0),
            graphDwellTimeSlider: new Slider(0,0,0,0,"black",0,0.5),
            resetDwellTimes: new Button({
                x: 0, y: 0, width: 0, height: 0, bgColor: "black",
                onClick: () => {
                    moduleData.graph1.seeds.forEach((seed) => {seed.dwellTime = 0.00833});
                    if (moduleData.graph2.seeds){moduleData.graph2.seeds.forEach((seed) => {seed.dwellTime = 0.00833});}
                    if (moduleData.graph3.seeds){moduleData.graph3.seeds.forEach((seed) => {seed.dwellTime = 0.00833});}
                    moduleData.selectedSeed = -1;
                    render = true;
                },
                label: {text: "Reset Dwell Times", font: "default", color: "white"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}
            }),
        }
        moduleData.applicatorModel = {name: "Vaginal Cylinder", length: 4, diameter: 2, angle: 90};
        adjustApplicatorGraphFormat(moduleData.graph1,moduleData.applicatorModel,{refPoints: "graph1refPoints", drawFunction: "graph1DrawApplicator", boundingBox: moduleData.divBoundGraph1, view: "front"});
        adjustApplicatorGraphFormat(moduleData.graph2,moduleData.applicatorModel,{refPoints: "graph2refPoints", drawFunction: "graph2DrawApplicator", boundingBox: moduleData.divBoundGraph2, view: ((moduleData.applicatorModel.name === "Tandem/Ring") ? "top" : "side")});
        adjustApplicatorGraphFormat(moduleData.graph3,moduleData.applicatorModel,{refPoints: "graph3refPoints", drawFunction: "graph3DrawApplicator", boundingBox: moduleData.divBoundGraph3, view: "top"});
        // fill options for seed model dropdown
        for (let i = 0; i < 3; i++){
            let seedModel = [GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource][i];
            moduleData.graphModelDropdown.options.push(new Button({
                x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: seedModel.name + " (" + seedModel.isotope + ")", font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
                onClick: () => {
                    moduleData.graph1.seeds.forEach((seed) => {
                        seed.model = seedModel;
                        seed.airKerma = (seed.model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min);
                        seed.dwellTime = 0.00833;
                    });
                    if (moduleData.selectedSeed && (moduleData.selectedSeed != -1)){
                        moduleData.graphAirKermaSlider.value = getValueFromAirKerma(moduleData.graph1.seeds[moduleData.selectedSeed]);
                        moduleData.graphDwellTimeSlider.value = getValueFromDwellTime(moduleData.graph1.seeds[moduleData.selectedSeed]);
                    }
                    moduleData.graphModelDropdown.button.label = seedModel.name + " (" + seedModel.isotope + ")";
                    render = true;
                    resetGraphs = true;
                },
            }));
        }
        for (let i = 0; i < 3; i ++){ // push applicator type selection to dropdown
            moduleData.applicatorModelDropdown.options.push(
                new Dropdown(new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: (["Vaginal Cylinder","Tandem/Ovoids","Tandem/Ring"][i]), font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},onClick: () => {}}),[])
            );
        }
        moduleData.applicatorModelDropdown.options.forEach((button) => { // push second layer to module selection dropdown
            if (button.button.label == "Vaginal Cylinder"){
                for (let i = 30; i <= 60; i+= 10){
                    button.options.push(
                        new Dropdown(new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: ("length: " + i / 10 + " cm"), font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},onClick: () => {}}),[]),
                    );
                }
            }else{
                for (let i = 0; i < 4; i++){
                    button.options.push(
                        new Dropdown(new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: ("Angle: " + [30,45,60,90][i] + " Deg"), font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},onClick: () => {}}),[]),
                    );
                }
            }
        });
        moduleData.applicatorModelDropdown.options.forEach((applicatorType) => {
            if (applicatorType.button.label === "Vaginal Cylinder"){
                applicatorType.options.forEach((lengthSelection,lengthInd) => {
                    for (let i = 20; i <= 35; i+= 5){
                        lengthSelection.options.push(
                            new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: ("diameter: " + i / 10 + " cm"), font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
                                onClick: () => {
                                    moduleData.applicatorModel = {name: "Vaginal Cylinder", length: [3,4,5,6][lengthInd], diameter: i / 10, angle: 90};
                                    moduleData.applicatorModelDropdown.collapseDropdown();
                                    moduleData.selectedSeed = -1;
                                    render = true;
                                    resetGraphs = true;
                                    tick();
                                }
                            })
                        );
                    }
                });
            }else{
                applicatorType.options.forEach((angleSelection) => {
                    for (let i = 20; i <= 60; i+= 10){
                        angleSelection.options.push(
                            new Dropdown(new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: ("length: " + i + " mm"), font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},onClick: () => {}}),[])
                        );
                    }
                });
            }
        });
        moduleData.applicatorModelDropdown.options.forEach((applicatorType) => {
            if (applicatorType.button.label === "Tandem/Ovoids"){
                applicatorType.options.forEach((angleSelection,angleInd) => {
                    angleSelection.options.forEach((lengthSelection,lengthInd) => {
                        for (let i = 20; i <= 35; i+= 5){
                            lengthSelection.options.push(
                                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: ("Ovoids: " + i + " mm"), font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
                                    onClick: () => {
                                        moduleData.applicatorModel = {name: "Tandem/Ovoids", length: [2,3,4,5,6][lengthInd], diameter: 0.6, angle: [30,45,60,90][angleInd], ovoidDiameter: i / 10};
                                        moduleData.applicatorModelDropdown.collapseDropdown();
                                        moduleData.selectedSeed = -1;
                                        render = true;
                                        resetGraphs = true;
                                        tick();
                                    }
                                })
                            );
                        }
                    });
                });
            }
            if (applicatorType.button.label === "Tandem/Ring"){
                applicatorType.options.forEach((angleSelection,angleInd) => {
                    angleSelection.options.forEach((lengthSelection,lengthInd) => {
                        for (let i = 20; i <= 35; i+= 5){
                            lengthSelection.options.push(
                                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: ("Ring Diameter: " + i + " mm"), font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
                                    onClick: () => {
                                        moduleData.applicatorModel = {name: "Tandem/Ring", length: [2,3,4,5,6][lengthInd], diameter: 0.6, angle: [30,45,60,90][angleInd], ringDiameter: i / 10};
                                        moduleData.applicatorModelDropdown.collapseDropdown();
                                        moduleData.selectedSeed = -1;
                                        render = true;
                                        resetGraphs = true;
                                        tick();
                                    }
                                })
                            );
                        }
                    });
                });
            }
        });
    }
    if (mod != "single seed"){
        // add the source toggle button for every module other than single seed
        moduleData.sourceToggle = new Button({x: 0, y: 0, width: 0, height: 0, label: {text: "Source",font: "default", color: "black"}, bgColor: "white",
            onClick: () => {
                let enabledUpdate = !moduleData[moduleData.selectedGraph].seeds[moduleData.selectedSeed].enabled;
                moduleData[moduleData.selectedGraph].seeds[moduleData.selectedSeed].enabled = enabledUpdate;
                if (enabledUpdate){
                    moduleData.sourceToggle.bgColor = "white";
                    moduleData.sourceToggle.fontColor = "black";
                }else{
                    moduleData.sourceToggle.bgColor = "black";
                    moduleData.sourceToggle.fontColor = "white";
                }
                render = true;
                tick();
            },outline: {color: "black",thickness: Math.min(canvas.width,canvas.height) * 0.001}
        });
        //add air kerma label
        moduleData.airKermaLabel = new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Air Kerma: ${value}U`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: () => {
                if (module === "brachytherapy applicators"){
                    return moduleData.graph1.seeds[0].airKerma;
                }else{
                    if (typeof moduleData.selectedSeed != "undefined"){
                        if (moduleData.selectedSeed != -1){
                            return moduleData[moduleData.selectedGraph].seeds[moduleData.selectedSeed].airKerma;
                        }
                    }
                    return 0;
                }
            },
            onEnter: function (value){
                if (module === "brachytherapy applicators"){
                    let clampedVal = Math.min(value,airKermaSliderLimits.HDR.max);
                    clampedVal = Math.max(clampedVal,airKermaSliderLimits.HDR.min);
                    let numGraphs;
                    if (moduleData.applicatorModel.name === "Vaginal Cylinder"){numGraphs = 1;}
                    if (moduleData.applicatorModel.name === "Tandem/Ovoids"){numGraphs = 3;}
                    if (moduleData.applicatorModel.name === "Tandem/Ring"){numGraphs = 2;}
                    for (let i = 0; i < numGraphs; i++){
                        moduleData[`graph${i + 1}`].seeds.forEach((seed) => {seed.airKerma = clampedVal});
                    }
                    render = true;
                }else{
                    if (typeof moduleData.selectedSeed != "undefined"){
                        if (moduleData.selectedSeed != -1){
                            let seedSelected = moduleData[moduleData.selectedGraph].seeds[moduleData.selectedSeed];
                            let clampedVal = Math.min(value,(seedSelected.model.HDRsource) ? airKermaSliderLimits.HDR.max : airKermaSliderLimits.LDR.max);
                            clampedVal = Math.max(clampedVal,(seedSelected.model.HDRsource) ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min);
                            seedSelected.airKerma = clampedVal;
                            if (mod === "string of seeds"){
                                moduleData.airKermaSlider.value = getValueFromAirKerma(seedSelected);
                            }
                            if (mod === "planar array of seeds"){
                                moduleData[moduleData.selectedGraph + "AirKermaSlider"].value = getValueFromAirKerma(seedSelected);
                            }
                            render = true;
                        }
                    }
                }
            },
            numDecimalsEditing: 3
        });
        // add dwell time label
        moduleData.dwellTimeLabel = new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Dwell Time: ${value} second(s)`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: () => {
                if (typeof moduleData.selectedSeed != "undefined"){
                    if (moduleData.selectedSeed != -1){
                        return moduleData[moduleData.selectedGraph].seeds[moduleData.selectedSeed].dwellTime * 3600
                    }
                }
                return 0;
            },
            onEnter: function (value){
                if (typeof moduleData.selectedSeed != "undefined"){
                    if (moduleData.selectedSeed != -1){
                        let seedSelected = moduleData[moduleData.selectedGraph].seeds[moduleData.selectedSeed];
                        if (!(seedSelected.model.HDRsource && (seedSelected.dwellTime == 0))){
                            let clampedVal = Math.max(Math.min(value / 3600,0.0833333333333),0);
                            seedSelected.dwellTime = clampedVal;
                            if (mod === "string of seeds"){
                                moduleData.dwellTimeSlider.value = getValueFromDwellTime(seedSelected);
                            }
                            if (mod === "planar array of seeds"){
                                moduleData[moduleData.selectedGraph + "DwellTimeSlider"].value = getValueFromDwellTime(seedSelected);
                            }
                            if (mod === "brachytherapy applicators"){
                                moduleData.graphDwellTimeSlider.value = getValueFromDwellTime(seedSelected);
                            }
                            render = true;
                        }
                    }
                }
            },
            numDecimalsEditing: 3
        });
    }
    // add reference point labels
    let numGraphs;
    let dwellTimeSliders; // array representing which dwell time slider corresponds to which graph
    let airKermaSliders; // array representing which air kerma slider corresponds to which graph
    if (mod === "single seed"){
        numGraphs = 2;
        dwellTimeSliders = [moduleData.graph1DwellTimeSlider,moduleData.graph2DwellTimeSlider];
        airKermaSliders = [moduleData.graph1AirKermaSlider,moduleData.graph2AirKermaSlider];
    }
    if (mod === "string of seeds"){
        numGraphs = 1;
        dwellTimeSliders = [moduleData.dwellTimeSlider];
        airKermaSliders = [moduleData.airKermaSlider];
    }
    if (mod === "planar array of seeds"){
        numGraphs = 2;
        dwellTimeSliders = [moduleData.graph1DwellTimeSlider,moduleData.graph2DwellTimeSlider];
        airKermaSliders = [moduleData.graph1AirKermaSlider,moduleData.graph2AirKermaSlider];
    }
    if (mod === "brachytherapy applicators"){
        numGraphs = 1;
        dwellTimeSliders = [moduleData.graphDwellTimeSlider];
        airKermaSliders = [moduleData.graphAirKermaSlider];
    }
    for (let i = 0; i < numGraphs; i++){
        moduleData[`graph${i + 1}refPointLabel`] = [];
        moduleData[`graph${i + 1}refPoints`].forEach((refPoint) => {
            moduleData[`graph${i + 1}refPointLabel`].push(new NumberInput({
                x: 0, y: 0, width: 0, height: 0,
                label: {
                    text: (value) => `${value}Gy`,
                    color: {selected: "white", notSelected: "black"}
                },bgColor: {selected: "black", notSelected: "white"},
                getValue: () => moduleData[`graph${i + 1}`].getPointDose(refPoint),
                onEnter: function (value){
                    setDoseAtPoint(moduleData[`graph${i + 1}`],refPoint,value,dwellTimeSliders[i],airKermaSliders[i]);
                },
                numDecimalsEditing: 3
            }));
        });
    }
    // add options to model dropdown menu 1
    if (moduleData.graph1ModelDropdown){
        for (let i = 0; i < 5; i++){
            let seedModel = [TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource][i];
            moduleData.graph1ModelDropdown.options.push(new Button({
                x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: seedModel.name + " (" + seedModel.isotope + ")", font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
                onClick: () => {
                    moduleData.graph1.seeds.forEach((seed) => {
                        seed.model = seedModel;
                        seed.airKerma = (seed.model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min);
                        seed.dwellTime = 0.00833;
                        seed.enabled = true;
                    });
                    let selectedSeed = moduleData.graph1.seeds[moduleData.selectedSeed];
                    if (mod === "string of seeds"){
                        moduleData.airKermaSlider.value = selectedSeed ? getValueFromAirKerma(selectedSeed) : 0;
                        moduleData.dwellTimeSlider.value = selectedSeed ? getValueFromDwellTime(selectedSeed) : 0.1;
                    }else{
                        moduleData.graph1AirKermaSlider.value = selectedSeed ? getValueFromAirKerma(selectedSeed) : 0;
                        moduleData.graph1DwellTimeSlider.value = selectedSeed ? getValueFromDwellTime(selectedSeed) : 0.1;
                    }
                    moduleData.graph1ModelDropdown.button.label = seedModel.name + " (" + seedModel.isotope + ")";
                    render = true;
                    resetGraphs = true;
                },
            }));
        }
    }
    // add options to model dropdown menu 2
    if (moduleData.graph2ModelDropdown){
        for (let i = 0; i < 5; i++){
            let seedModel = [TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource][i];
            moduleData.graph2ModelDropdown.options.push(new Button({
                x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: seedModel.name + " (" + seedModel.isotope + ")", font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
                onClick: () => {
                    moduleData.graph2.seeds.forEach((seed) => {
                        seed.model = seedModel;
                        seed.airKerma = (seed.model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min);
                        seed.dwellTime = 0.00833;
                        seed.enabled = true;
                    });
                    let selectedSeed = moduleData.graph2.seeds[moduleData.selectedSeed];
                    if (mod === "string of seeds"){
                        moduleData.airKermaSlider.value = selectedSeed ? getValueFromAirKerma(selectedSeed) : 0;
                        moduleData.dwellTimeSlider.value = selectedSeed ? getValueFromDwellTime(selectedSeed) : 0.1;
                    }else{
                        moduleData.graph2AirKermaSlider.value = selectedSeed ? getValueFromAirKerma(selectedSeed) : 0;
                        moduleData.graph2DwellTimeSlider.value = selectedSeed ? getValueFromDwellTime(selectedSeed) : 0.1;
                    }
                    moduleData.graph2ModelDropdown.button.label = seedModel.name + " (" + seedModel.isotope + ")";
                    render = true;
                    resetGraphs = true;
                },
            }));
        }
    }
    // add module selection bar
    moduleData.moduleSelectBar = [];
    for (let i = 0; i < 4; i++){
        moduleData.moduleSelectBar.push(
            new Button({
                x: i * canvas.width / 4,
                y: 0,
                width: canvas.width / 4,
                height: canvas.height * 0.1,
                label: {
                    text: ["Single Seed","String of Seeds","Planar Array of Seeds","Brachytherapy Applicators"][i],
                    font: "default",
                    color: (mod === ["single seed","string of seeds","planar array of seeds","brachytherapy applicators"][i]) ? "white" : "black"
                },
                bgColor: (mod === ["single seed","string of seeds","planar array of seeds","brachytherapy applicators"][i]) ? "black" : "white",
                onClick: () => {
                    let previousModule = module;
                    module = ["single seed","string of seeds","planar array of seeds","brachytherapy applicators"][i];
                    initModule(module,previousModule);
                },
                outline: {
                    color: "black",
                    thickness: Math.min(canvas.width,canvas.height) * 0.001
                }
            })
        );
    }
    render = true;
    resetGraphs = true;
    tick();
}
function cloneObj(obj){
    return JSON.parse(JSON.stringify(obj));
}
function scaleAnatomyData(origin, screenDist, cmDistance){
    let scaleFactor = screenDist / cmDistance;
    let scaledAnatomy = cloneObj(anatomyData);
    Object.values(scaledAnatomy).forEach((view) => {
        view.forEach((point) => {
            point.blocks.forEach((block) => {
                block.outlineThickness = block.outlineThickness * scaleFactor;
                block.curves.forEach((curve) => {
                    for (let i = 1; i < 5; i++){
                        curve["x" + i] = (curve["x" + i] * scaleFactor) + origin.x;
                        curve["y" + i] = (curve["y" + i] * scaleFactor) + origin.y;
                    }
                });
            });
        });
    });
    formattedAnatomy = scaledAnatomy;
}
function adjustFormatting(){
    // this function adjusts the formatting of various UI elements based on the screen's aspect ratio and the state of the module

    //resize canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    scaleAnatomyData({x: (canvas.width / 2), y: (canvas.height / 2)},50,10);
    if (module === "single seed"){
        // resize graph dimenstions
        let graph1 = moduleData.graph1;
        let graph2 = moduleData.graph2;
        let graph1ModelDropdown = moduleData.graph1ModelDropdown.button;
        let graph2ModelDropdown = moduleData.graph2ModelDropdown.button;
        let graph1AirKermaSlider = moduleData.graph1AirKermaSlider;
        let graph2AirKermaSlider = moduleData.graph2AirKermaSlider;
        let graph1DwellTimeSlider = moduleData.graph1DwellTimeSlider;
        let graph2DwellTimeSlider = moduleData.graph2DwellTimeSlider;
        let graph1AirKermaLabel = moduleData.graph1AirKermaLabel;
        let graph2AirKermaLabel = moduleData.graph2AirKermaLabel;
        let graph1DwellTimeLabel = moduleData.graph1DwellTimeLabel;
        let graph2DwellTimeLabel = moduleData.graph2DwellTimeLabel;

        if (canvas.height / canvas.width > 0.8){
            // graphs stacked on top of eachother
            let splitX = canvas.width - Math.min(canvas.width * 0.75, canvas.height * 0.45);

            graph1.x = splitX;
            graph1.y = canvas.height * 0.1;
            graph1.width = Math.min(canvas.width * 0.75, canvas.height * 0.45);
            graph1.height = Math.min(canvas.width * 0.75, canvas.height * 0.45);

            graph2.x = splitX;
            graph2.y = canvas.height * 0.55;
            graph2.width = Math.min(canvas.width * 0.75, canvas.height * 0.45);
            graph2.height = Math.min(canvas.width * 0.75, canvas.height * 0.45);

            graph1ModelDropdown.x = 0;
            graph1ModelDropdown.y = canvas.height * 0.15;
            graph1ModelDropdown.width = splitX * 0.9;
            graph1ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph1ModelDropdown.options.length + 1);
            graph1ModelDropdown.label = graph1.seeds[0].model.name + " (" + graph1.seeds[0].model.isotope + ")";

            graph2ModelDropdown.x = 0;
            graph2ModelDropdown.y = canvas.height * 0.55;
            graph2ModelDropdown.width = splitX * 0.9;
            graph2ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph2ModelDropdown.options.length + 1);
            graph2ModelDropdown.label = graph2.seeds[0].model.name + " (" + graph2.seeds[0].model.isotope + ")";

            graph1AirKermaSlider.x = graph1ModelDropdown.width * 0.1;
            graph1AirKermaSlider.y = graph1ModelDropdown.y + 3 * graph1ModelDropdown.height;
            graph1AirKermaSlider.thickness = canvas.height * 0.01;
            graph1AirKermaSlider.length = graph1ModelDropdown.width * 0.8;

            graph2AirKermaSlider.x = graph2ModelDropdown.width * 0.1;
            graph2AirKermaSlider.y = graph2ModelDropdown.y + 3 * graph2ModelDropdown.height;
            graph2AirKermaSlider.thickness = canvas.height * 0.01;
            graph2AirKermaSlider.length = graph2ModelDropdown.width * 0.8;

            graph1DwellTimeSlider.x = graph1ModelDropdown.width * 0.1;
            graph1DwellTimeSlider.y = graph1ModelDropdown.y + graph1ModelDropdown.height * 5;
            graph1DwellTimeSlider.thickness = canvas.height * 0.01;
            graph1DwellTimeSlider.length = graph1ModelDropdown.width * 0.8;

            graph2DwellTimeSlider.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 0.1;
            graph2DwellTimeSlider.y = graph2ModelDropdown.y + graph2ModelDropdown.height * 5;
            graph2DwellTimeSlider.thickness = canvas.height * 0.01;
            graph2DwellTimeSlider.length = graph2ModelDropdown.width * 0.8;
        }else{
            //graphs side by side
            graph1.x = canvas.width * 0.125;
            graph1.y = canvas.height * 0.1 + (canvas.height * 0.9 - Math.min(canvas.width * 0.375, canvas.height * 0.9)) / 2;
            graph1.width = Math.min(canvas.width * 0.375, canvas.height * 0.9);
            graph1.height = Math.min(canvas.width * 0.375, canvas.height * 0.9);

            graph2.x = canvas.width * 0.625;
            graph2.y = canvas.height * 0.1 + (canvas.height * 0.9 - Math.min(canvas.width * 0.375, canvas.height * 0.9)) / 2;
            graph2.width = Math.min(canvas.width * 0.375, canvas.height * 0.9);
            graph2.height = Math.min(canvas.width * 0.375, canvas.height * 0.9);

            graph1ModelDropdown.x = 0;
            graph1ModelDropdown.y = canvas.height * 0.3;
            graph1ModelDropdown.width = canvas.width * 0.125;
            graph1ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph1ModelDropdown.options.length + 1);
            graph1ModelDropdown.label = graph1.seeds[0].model.name + " (" + graph1.seeds[0].model.isotope + ")";

            graph2ModelDropdown.x = canvas.width * 0.5;
            graph2ModelDropdown.y = canvas.height * 0.3;
            graph2ModelDropdown.width = canvas.width * 0.125;
            graph2ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph2ModelDropdown.options.length + 1);
            graph2ModelDropdown.label = graph2.seeds[0].model.name + " (" + graph2.seeds[0].model.isotope + ")";

            graph1AirKermaSlider.x = graph1ModelDropdown.width * 0.1;
            graph1AirKermaSlider.y = canvas.height * 0.3 + graph1ModelDropdown.height * 3;
            graph1AirKermaSlider.thickness = canvas.height * 0.01;
            graph1AirKermaSlider.length = graph1ModelDropdown.width * 0.8;

            graph2AirKermaSlider.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 0.1;
            graph2AirKermaSlider.y = canvas.height * 0.3 + graph2ModelDropdown.height * 3;
            graph2AirKermaSlider.thickness = canvas.height * 0.01;
            graph2AirKermaSlider.length = graph2ModelDropdown.width * 0.8;

            graph1DwellTimeSlider.x = graph1ModelDropdown.width * 0.1;
            graph1DwellTimeSlider.y = canvas.height * 0.3 + graph1ModelDropdown.height * 5;
            graph1DwellTimeSlider.thickness = canvas.height * 0.01;
            graph1DwellTimeSlider.length = graph1ModelDropdown.width * 0.8;

            graph2DwellTimeSlider.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 0.1;
            graph2DwellTimeSlider.y = canvas.height * 0.3 + graph2ModelDropdown.height * 5;
            graph2DwellTimeSlider.thickness = canvas.height * 0.01;
            graph2DwellTimeSlider.length = graph2ModelDropdown.width * 0.8;
        }
        graph1AirKermaLabel.x = graph1ModelDropdown.x + graph1ModelDropdown.width * 0.1;
        graph1AirKermaLabel.y = graph1ModelDropdown.y + 1.5 * graph1ModelDropdown.height;
        graph1AirKermaLabel.width = graph1ModelDropdown.width * 0.8;
        graph1AirKermaLabel.height = graph1ModelDropdown.height;

        graph2AirKermaLabel.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 0.1;
        graph2AirKermaLabel.y = graph2ModelDropdown.y + 1.5 * graph2ModelDropdown.height;
        graph2AirKermaLabel.width = graph2ModelDropdown.width * 0.8;
        graph2AirKermaLabel.height = graph2ModelDropdown.height;
        
        graph1DwellTimeLabel.x = graph1ModelDropdown.x + graph1ModelDropdown.width * 0.1;
        graph1DwellTimeLabel.y = graph1ModelDropdown.y + 3.5 * graph1ModelDropdown.height;
        graph1DwellTimeLabel.width = graph1ModelDropdown.width * 0.8;
        graph1DwellTimeLabel.height = graph1ModelDropdown.height;

        graph2DwellTimeLabel.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 0.1;
        graph2DwellTimeLabel.y = graph2ModelDropdown.y + 3.5 * graph2ModelDropdown.height;
        graph2DwellTimeLabel.width = graph2ModelDropdown.width * 0.8;
        graph2DwellTimeLabel.height = graph2ModelDropdown.height;
    }
    if (module === "string of seeds"){
        let graph1 = moduleData.graph1;
        let addSeedButton = moduleData.addSeed;
        let deleteSeedButton = moduleData.deleteSeed;
        let seedSpacingSlider = moduleData.seedSpacingSlider;
        let seedSpacingLabel = moduleData.seedSpacingLabel;
        let airKermaSlider = moduleData.airKermaSlider;
        let airKermaLabel = moduleData.airKermaLabel;
        let graph1ModelDropdown = moduleData.graph1ModelDropdown.button
        let dwellTimeSlider = moduleData.dwellTimeSlider;
        let dwellTimeLabel = moduleData.dwellTimeLabel;
        let sourceToggle = moduleData.sourceToggle;

        graph1.width = Math.min(canvas.width,(canvas.height * 0.65) * 2.5);
        graph1.height = canvas.height * 0.65;
        graph1.x = (canvas.width - graph1.width) / 2;
        graph1.y = (canvas.height * 0.35) + (canvas.height * 0.65) - graph1.height;

        addSeedButton.x = 0;
        addSeedButton.y = canvas.height * 0.15;
        addSeedButton.width = canvas.width * 0.2;
        addSeedButton.height = canvas.height * 0.05;

        seedSpacingSlider.x = addSeedButton.width * 0.05;
        seedSpacingSlider.y = canvas.height * 0.29;
        seedSpacingSlider.thickness = canvas.height * 0.01;
        seedSpacingSlider.length = addSeedButton.width * 0.9;

        seedSpacingLabel.x = seedSpacingSlider.x;
        seedSpacingLabel.y = (addSeedButton.y + seedSpacingSlider.y) / 2;
        seedSpacingLabel.height = addSeedButton.height;
        seedSpacingLabel.width = addSeedButton.width * 0.9;

        deleteSeedButton.x = canvas.width * 0.5;
        deleteSeedButton.y = canvas.height * 0.15;
        deleteSeedButton.width = canvas.width * 0.2;
        deleteSeedButton.height = canvas.height * 0.05;

        airKermaSlider.x = canvas.width * 0.5;
        airKermaSlider.y = canvas.height * 0.3;
        airKermaSlider.thickness = canvas.height * 0.01;
        airKermaSlider.length = deleteSeedButton.width;

        airKermaLabel.x = deleteSeedButton.x;
        airKermaLabel.y = (deleteSeedButton.y + airKermaSlider.y) / 2;
        airKermaLabel.width = addSeedButton.width;
        airKermaLabel.height = addSeedButton.height;

        dwellTimeSlider.x = canvas.width * 0.75;
        dwellTimeSlider.y = canvas.height * 0.225;
        dwellTimeSlider.thickness = canvas.height * 0.01;
        dwellTimeSlider.length = deleteSeedButton.width;

        dwellTimeLabel.x = dwellTimeSlider.x;
        dwellTimeLabel.y = canvas.height * 0.15;
        dwellTimeLabel.height = deleteSeedButton.height;
        dwellTimeLabel.width = deleteSeedButton.width;

        if (typeof moduleData.selectedGraph != "undefined"){
            if (moduleData.selectedSeed != -1){
                sourceToggle.x = canvas.width * 0.75;
                sourceToggle.y = canvas.height * 0.15;
                sourceToggle.width = deleteSeedButton.width;
                sourceToggle.height = deleteSeedButton.height;
                sourceToggle.label = ("Source " + ((moduleData[moduleData.selectedGraph].seeds[moduleData.selectedSeed].enabled) ? "Enabled" : "Disabled"));
            }
        }

        graph1ModelDropdown.x = canvas.width * 0.25;
        graph1ModelDropdown.y = canvas.height * 0.15;
        graph1ModelDropdown.width = canvas.width * 0.2;
        graph1ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph1ModelDropdown.options.length + 1);
        graph1ModelDropdown.label = graph1.seeds[0].model.name + " (" + graph1.seeds[0].model.isotope + ")";

        graph1.seeds.forEach((seed,ind) => {
            seed.pos.x = (ind * moduleData.seedSpacing) - ((graph1.seeds.length - 1) * moduleData.seedSpacing / 2);
        });
    }
    if (module === "planar array of seeds"){
        let graph1 = moduleData.graph1;
        let graph2 = moduleData.graph2;
        let graph1ModelDropdown = moduleData.graph1ModelDropdown.button;
        let graph1AirKermaSlider = moduleData.graph1AirKermaSlider;
        let graph1DwellTimeSlider = moduleData.graph1DwellTimeSlider;
        let addSeedsGraph1 = moduleData.graph1AddSeeds;
        let removeSeedsGraph1 = moduleData.graph1RemoveSeeds;
        let graph1SeedSpacing = moduleData.graph1SeedSpacingSlider;
        let graph2ModelDropdown = moduleData.graph2ModelDropdown.button;
        let graph2AirKermaSlider = moduleData.graph2AirKermaSlider;
        let graph2DwellTimeSlider = moduleData.graph2DwellTimeSlider;
        let addSeedsGraph2 = moduleData.graph2AddSeeds;
        let removeSeedsGraph2 = moduleData.graph2RemoveSeeds;
        let graph2SeedSpacing = moduleData.graph2SeedSpacingSlider;
        let graph1SeedSpacingLabel = moduleData.graph1SeedSpacingLabel;
        let graph2SeedSpacingLabel = moduleData.graph2SeedSpacingLabel;
        let airKermaLabel = moduleData.airKermaLabel;
        let dwellTimeLabel = moduleData.dwellTimeLabel;
        let sourceToggle = moduleData.sourceToggle;

        if (canvas.width > canvas.height * 0.9){
            // graphs are side-by side
            graph1.width = Math.min(canvas.height * 0.65, canvas.width * 0.5);
            graph1.height = graph1.width;
            graph1.x = ((canvas.width * 0.5) - graph1.width) / 2;
            graph1.y = canvas.height * 0.35;

            graph2.width = Math.min(canvas.height * 0.65, canvas.width * 0.5);
            graph2.height = graph2.width;
            graph2.x = (canvas.width * 0.5) + ((canvas.width * 0.5) - graph2.width) / 2;
            graph2.y = canvas.height * 0.35;

            graph1ModelDropdown.x = 0;
            graph1ModelDropdown.y = canvas.height * 0.125;
            graph1ModelDropdown.width = moduleData.graph1.width * 0.5;
            graph1ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph1ModelDropdown.options.length + 1);
            graph1ModelDropdown.label = graph1.seeds[0].model.name + " (" + graph1.seeds[0].model.isotope + ")";

            let splitY = graph1ModelDropdown.y + graph1ModelDropdown.height
            let spaceAboveGraph = canvas.height * 0.35 - splitY;

            addSeedsGraph1.x = 0;
            addSeedsGraph1.y = splitY + spaceAboveGraph * 0.1;
            addSeedsGraph1.width = graph1ModelDropdown.width;
            addSeedsGraph1.height = spaceAboveGraph * 0.2;

            removeSeedsGraph1.x = 0;
            removeSeedsGraph1.y = splitY + spaceAboveGraph * 0.4;
            removeSeedsGraph1.width = graph1ModelDropdown.width;
            removeSeedsGraph1.height = spaceAboveGraph * 0.2;

            graph1SeedSpacing.x = graph1ModelDropdown.width * 0.1;
            graph1SeedSpacing.y = splitY + spaceAboveGraph * 0.9;
            graph1SeedSpacing.thickness = canvas.height * 0.01;
            graph1SeedSpacing.length = graph1ModelDropdown.width * 0.8;

            graph1AirKermaSlider.x = graph1ModelDropdown.width * 1.1;
            graph1AirKermaSlider.y = canvas.height * 0.2;
            graph1AirKermaSlider.thickness = canvas.height * 0.01;
            graph1AirKermaSlider.length = graph1ModelDropdown.width * 0.8;

            graph1DwellTimeSlider.x = graph1ModelDropdown.width * 1.1;
            graph1DwellTimeSlider.y = canvas.height * 0.3;
            graph1DwellTimeSlider.thickness = canvas.height * 0.01;
            graph1DwellTimeSlider.length = graph1ModelDropdown.width * 0.8;

            graph2ModelDropdown.x = graph2.x;
            graph2ModelDropdown.y = canvas.height * 0.125;
            graph2ModelDropdown.width = moduleData.graph2.width * 0.5;
            graph2ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph2ModelDropdown.options.length + 1);
            graph2ModelDropdown.label = graph2.seeds[0].model.name + " (" + graph2.seeds[0].model.isotope + ")";

            addSeedsGraph2.x = graph2ModelDropdown.x;
            addSeedsGraph2.y = splitY + spaceAboveGraph * 0.1;
            addSeedsGraph2.width = graph2ModelDropdown.width;
            addSeedsGraph2.height = spaceAboveGraph * 0.2;

            removeSeedsGraph2.x = graph2ModelDropdown.x;
            removeSeedsGraph2.y = splitY + spaceAboveGraph * 0.4;
            removeSeedsGraph2.width = graph2ModelDropdown.width;
            removeSeedsGraph2.height = spaceAboveGraph * 0.2;

            graph2SeedSpacing.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 0.1;
            graph2SeedSpacing.y = splitY + spaceAboveGraph * 0.9;
            graph2SeedSpacing.thickness = canvas.height * 0.01;
            graph2SeedSpacing.length = graph2ModelDropdown.width * 0.8;

            graph2AirKermaSlider.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 1.1;
            graph2AirKermaSlider.y = canvas.height * 0.2;
            graph2AirKermaSlider.thickness = canvas.height * 0.01;
            graph2AirKermaSlider.length = graph2ModelDropdown.width * 0.8;

            graph2DwellTimeSlider.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 1.1;
            graph2DwellTimeSlider.y = canvas.height * 0.3;
            graph2DwellTimeSlider.thickness = canvas.height * 0.01;
            graph2DwellTimeSlider.length = graph2ModelDropdown.width * 0.8;

            if (typeof moduleData.selectedGraph != "undefined"){
                // if a graph is selected
                if (moduleData.selectedGraph === "graph1"){
                    airKermaLabel.x = graph1ModelDropdown.width * 1.1;
                    airKermaLabel.y = graph1ModelDropdown.y;
                    airKermaLabel.width = addSeedsGraph1.width * 0.8;
                    airKermaLabel.height = addSeedsGraph1.height;

                    dwellTimeLabel.x = graph1ModelDropdown.width * 1.1;
                    dwellTimeLabel.y = canvas.height * 0.25;
                    dwellTimeLabel.width = addSeedsGraph1.width * 0.8;
                    dwellTimeLabel.height = addSeedsGraph1.height;
                }else{
                    airKermaLabel.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 1.1;
                    airKermaLabel.y = graph2ModelDropdown.y;
                    airKermaLabel.width = addSeedsGraph2.width * 0.8;
                    airKermaLabel.height = addSeedsGraph2.height;

                    dwellTimeLabel.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 1.1;
                    dwellTimeLabel.y = canvas.height * 0.25;
                    dwellTimeLabel.width = addSeedsGraph2.width * 0.8;
                    dwellTimeLabel.height = addSeedsGraph2.height;
                }
            }
        }else{
            // graphs are stacked
            graph1.width = Math.min(canvas.width * 0.75, canvas.height * 0.5);
            graph1.height = graph1.width;
            graph1.x = canvas.width * 0.25;
            graph1.y = (canvas.height * 0.1) + ((graph1.height - (canvas.height * 0.45)) / 2);

            graph2.width = Math.min(canvas.width * 0.75, canvas.height * 0.5);
            graph2.height = graph2.width;
            graph2.x = canvas.width * 0.25;
            graph2.y = (canvas.height * 0.55) + ((graph2.height - (canvas.height * 0.45)) / 2);

            graph1ModelDropdown.x = 0;
            graph1ModelDropdown.y = canvas.height * 0.125;
            graph1ModelDropdown.width = graph1.x;
            graph1ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph1ModelDropdown.options.length + 1);
            graph1ModelDropdown.label = graph1.seeds[0].model.name + " (" + graph1.seeds[0].model.isotope + ")";

            let splitY = graph1ModelDropdown.y + graph1ModelDropdown.height
            let spaceToYSplit = graph2.y - splitY;

            addSeedsGraph1.x = 0;
            addSeedsGraph1.y = splitY + spaceToYSplit * 0.05;
            addSeedsGraph1.width = graph1ModelDropdown.width;
            addSeedsGraph1.height = spaceToYSplit * 0.1;

            removeSeedsGraph1.x = 0;
            removeSeedsGraph1.y = splitY + spaceToYSplit * 0.2;
            removeSeedsGraph1.width = graph1ModelDropdown.width;
            removeSeedsGraph1.height = spaceToYSplit * 0.1;

            graph1SeedSpacing.x = graph1ModelDropdown.width * 0.1;
            graph1SeedSpacing.y = splitY + spaceToYSplit * 0.50;
            graph1SeedSpacing.thickness = canvas.height * 0.01;
            graph1SeedSpacing.length = graph1ModelDropdown.width * 0.8;

            graph1AirKermaSlider.x = graph1ModelDropdown.width * 0.1;
            graph1AirKermaSlider.y = splitY + spaceToYSplit * 0.75;
            graph1AirKermaSlider.thickness = canvas.height * 0.01;
            graph1AirKermaSlider.length = graph1ModelDropdown.width * 0.8;

            graph1DwellTimeSlider.x = graph1ModelDropdown.width * 0.1;
            graph1DwellTimeSlider.y = splitY + spaceToYSplit * 0.90;
            graph1DwellTimeSlider.thickness = canvas.height * 0.01;
            graph1DwellTimeSlider.length = graph1ModelDropdown.width * 0.8;

            graph2ModelDropdown.x = 0;
            graph2ModelDropdown.y = canvas.height * 0.625;
            graph2ModelDropdown.width = graph2.x;
            graph2ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph2ModelDropdown.options.length + 1);
            graph2ModelDropdown.label = graph2.seeds[0].model.name + " (" + graph2.seeds[0].model.isotope + ")";

            splitY = graph2ModelDropdown.y + graph2ModelDropdown.height
            spaceToYSplit = canvas.height - splitY;

            addSeedsGraph2.x = 0;
            addSeedsGraph2.y = splitY + spaceToYSplit * 0.05;
            addSeedsGraph2.width = graph2ModelDropdown.width;
            addSeedsGraph2.height = spaceToYSplit * 0.1;

            removeSeedsGraph2.x = 0;
            removeSeedsGraph2.y = splitY + spaceToYSplit * 0.2;
            removeSeedsGraph2.width = graph2ModelDropdown.width;
            removeSeedsGraph2.height = spaceToYSplit * 0.1;

            graph2SeedSpacing.x = graph2ModelDropdown.width * 0.1;
            graph2SeedSpacing.y = splitY + spaceToYSplit * 0.50;
            graph2SeedSpacing.thickness = canvas.height * 0.01;
            graph2SeedSpacing.length = graph2ModelDropdown.width * 0.8;

            graph2AirKermaSlider.x = graph2ModelDropdown.width * 0.1;
            graph2AirKermaSlider.y = splitY + spaceToYSplit * 0.75;
            graph2AirKermaSlider.thickness = canvas.height * 0.01;
            graph2AirKermaSlider.length = graph2ModelDropdown.width * 0.8;

            graph2DwellTimeSlider.x = graph2ModelDropdown.width * 0.1;
            graph2DwellTimeSlider.y = splitY + spaceToYSplit * 0.90;
            graph2DwellTimeSlider.thickness = canvas.height * 0.01;
            graph2DwellTimeSlider.length = graph2ModelDropdown.width * 0.8;

            if (typeof moduleData.selectedGraph != "undefined"){
                if (moduleData.selectedGraph === "graph1"){
                    airKermaLabel.x = graph1ModelDropdown.width * 0.1;
                    airKermaLabel.y = (graph1SeedSpacing.y + graph1AirKermaSlider.y) / 2
                    airKermaLabel.width = addSeedsGraph1.width * 0.8;
                    airKermaLabel.height = addSeedsGraph1.height;

                    dwellTimeLabel.x = graph1ModelDropdown.width * 0.1;
                    dwellTimeLabel.width = addSeedsGraph1.width * 0.8;
                    dwellTimeLabel.height = addSeedsGraph1.height;
                    dwellTimeLabel.y = graph1AirKermaSlider.y + (graph1DwellTimeSlider.y - (graph1AirKermaSlider.y + dwellTimeLabel.height)) / 2;
                }else{
                    airKermaLabel.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 0.1;
                    airKermaLabel.y = (graph2SeedSpacing.y + graph2AirKermaSlider.y) / 2
                    airKermaLabel.width = addSeedsGraph2.width * 0.8;
                    airKermaLabel.height = addSeedsGraph2.height;

                    dwellTimeLabel.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 0.1;
                    dwellTimeLabel.width = addSeedsGraph2.width * 0.8;
                    dwellTimeLabel.height = addSeedsGraph2.height;
                    dwellTimeLabel.y = graph2AirKermaSlider.y + (graph2DwellTimeSlider.y - (graph2AirKermaSlider.y + dwellTimeLabel.height)) / 2;
                }
            }
        }

        if (typeof moduleData.selectedGraph != "undefined"){
            if (moduleData.selectedSeed != -1){
                sourceToggle.x = dwellTimeLabel.x;
                sourceToggle.y = dwellTimeLabel.y;
                sourceToggle.width = dwellTimeLabel.width;
                sourceToggle.height = dwellTimeLabel.height;
                sourceToggle.label = ("Source " + ((moduleData[moduleData.selectedGraph].seeds[moduleData.selectedSeed].enabled) ? "Enabled" : "Disabled"));
            }
        }

        graph1SeedSpacingLabel.x = graph1ModelDropdown.width * 0.1;
        graph1SeedSpacingLabel.y = removeSeedsGraph1.y + removeSeedsGraph1.height + addSeedsGraph1.height * 0.2;
        graph1SeedSpacingLabel.width = addSeedsGraph1.width * 0.8;
        graph1SeedSpacingLabel.height = addSeedsGraph1.height * 0.8;

        graph2SeedSpacingLabel.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 0.1;
        graph2SeedSpacingLabel.y = removeSeedsGraph2.y + removeSeedsGraph2.height + addSeedsGraph2.height * 0.2;
        graph2SeedSpacingLabel.width = addSeedsGraph2.width * 0.8;
        graph2SeedSpacingLabel.height = addSeedsGraph2.height * 0.8;

        let planeSize =  Math.sqrt(moduleData.graph1.seeds.length)
        moduleData.graph1.seeds.forEach((seed,ind) => {
            seed.pos.x = moduleData.graph1SeedSpacing * (ind % planeSize - (planeSize - 1) / 2);
            seed.pos.y = moduleData.graph1SeedSpacing * (Math.floor(ind / planeSize) - (planeSize - 1) / 2);
        });

        planeSize =  Math.sqrt(moduleData.graph2.seeds.length)
        moduleData.graph2.seeds.forEach((seed,ind) => {
            seed.pos.x = moduleData.graph2SeedSpacing * (ind % planeSize - (planeSize - 1) / 2);
            seed.pos.y = moduleData.graph2SeedSpacing * (Math.floor(ind / planeSize) - (planeSize - 1) / 2);
        });
    }
    if (module === "brachytherapy applicators"){
        let graph1 = moduleData.graph1;
        let graph2 = moduleData.graph2;
        let graph3 = moduleData.graph3;
        let resetDwellTimes = moduleData.resetDwellTimes;
        let graphModelDropdown = moduleData.graphModelDropdown.button;
        let applicatorModelDropdown = moduleData.applicatorModelDropdown.button;
        let dwellTimeSlider = moduleData.graphDwellTimeSlider;
        let dwellTimeLabel = moduleData.dwellTimeLabel;
        let airKermaLabel = moduleData.airKermaLabel;

        let graph1Dimensions = {
            width: getMax(graph1.xTicks) - getMin(graph1.xTicks),
            height: getMax(graph1.yTicks) - getMin(graph1.yTicks)
        }
        let graph2Dimensions = {
            width: getMax(graph2.xTicks) - getMin(graph2.xTicks),
            height: getMax(graph2.yTicks) - getMin(graph2.yTicks)
        }
        let graph3Dimensions = {
            width: getMax(graph3.xTicks) - getMin(graph3.xTicks),
            height: getMax(graph3.yTicks) - getMin(graph3.yTicks)
        }

        let format;
        if (moduleData.applicatorModel.name === "Vaginal Cylinder"){
            // get format based on aspect ratio of graph1
            format = (Math.abs((graph1Dimensions.height / graph1Dimensions.width) - 1.2 * (canvas.height / canvas.width))
                < Math.abs((graph1Dimensions.height / graph1Dimensions.width) - 0.75 * (canvas.height / canvas.width)))
                    ? "sideUI" : "topUI";
            
            // stretch graph according to format
            let graph1Stretchfactor;
            if (format === "sideUI"){
                graph1Stretchfactor = Math.min((canvas.width * 0.75) / graph1Dimensions.width, (canvas.height * 0.9) / graph1Dimensions.height);
            }else{
                graph1Stretchfactor = Math.min(canvas.width / graph1Dimensions.width, (canvas.height * 0.75) / graph1Dimensions.height);
            }
            // apply stretch
            graph1.width = graph1Stretchfactor * graph1Dimensions.width;
            graph1.height = graph1Stretchfactor * graph1Dimensions.height;

            moduleData.graph1refPoints = [{
                x: (moduleData.applicatorModel.diameter / 2) + 0.5,
                y: moduleData.applicatorModel.length / 2,
                z: 0,
            }];
        }
        if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
            // get format based on aspect ratio of graph1
            format = (Math.abs((graph1Dimensions.height / graph1Dimensions.width) - 3.6 * (canvas.height / canvas.width))
                < Math.abs((graph1Dimensions.height / graph1Dimensions.width) - 2.25 * (canvas.height / canvas.width)))
                    ? "sideUI" : "topUI";
            
            // stretch graphs according to format
            let graph1Stretchfactor;
            let graph2Stretchfactor;
            let graph3Stretchfactor;
            if (format === "sideUI"){
                graph1Stretchfactor = Math.min((canvas.width * 0.25) / graph1Dimensions.width, (canvas.height * 0.9) / graph1Dimensions.height);
                graph2Stretchfactor = Math.min((canvas.width * 0.25) / graph2Dimensions.width, (canvas.height * 0.9) / graph2Dimensions.height);
                graph3Stretchfactor = Math.min((canvas.width * 0.25) / graph3Dimensions.width, (canvas.height * 0.9) / graph3Dimensions.height);
            }else{
                graph1Stretchfactor = Math.min((canvas.width / 3) / graph1Dimensions.width, (canvas.height * 0.75) / graph1Dimensions.height);
                graph2Stretchfactor = Math.min((canvas.width / 3) / graph2Dimensions.width, (canvas.height * 0.75) / graph2Dimensions.height);
                graph3Stretchfactor = Math.min((canvas.width / 3) / graph3Dimensions.width, (canvas.height * 0.75) / graph3Dimensions.height);
            }

            // apply stretch
            graph1.width = graph1Stretchfactor * graph1Dimensions.width;
            graph1.height = graph1Stretchfactor * graph1Dimensions.height;
            graph2.width = graph2Stretchfactor * graph2Dimensions.width;
            graph2.height = graph2Stretchfactor * graph2Dimensions.height;
            graph3.width = graph3Stretchfactor * graph3Dimensions.width;
            graph3.height = graph3Stretchfactor * graph3Dimensions.height;

            moduleData.graph1refPoints = [{x: 2,y: 2,z: 0},{x: -2,y: 2,z: 0}];
            moduleData.graph2refPoints = [{x: 2,y: 2,z: 0},{x: -2,y: 2,z: 0}];
            moduleData.graph3refPoints = [{x: 2,y: 2,z: 0},{x: -2,y: 2,z: 0}];
        }
        if (moduleData.applicatorModel.name === "Tandem/Ring"){
            // get format based on aspect ratio of graph1
            format = (Math.abs((graph1Dimensions.height / graph1Dimensions.width) - 2.4 * (canvas.height / canvas.width))
                < Math.abs((graph1Dimensions.height / graph1Dimensions.width) - 1.5 * (canvas.height / canvas.width)))
                    ? "sideUI" : "topUI";
            
            // stretch graphs according to format
            let graph1Stretchfactor;
            let graph2Stretchfactor;
            if (format === "sideUI"){
                graph1Stretchfactor = Math.min((canvas.width * 0.375) / graph1Dimensions.width, (canvas.height * 0.9) / graph1Dimensions.height);
                graph2Stretchfactor = Math.min((canvas.width * 0.375) / graph2Dimensions.width, (canvas.height * 0.9) / graph2Dimensions.height);
            }else{
                graph1Stretchfactor = Math.min((canvas.width * 0.5) / graph1Dimensions.width, (canvas.height * 0.75) / graph1Dimensions.height);
                graph2Stretchfactor = Math.min((canvas.width * 0.5) / graph2Dimensions.width, (canvas.height * 0.75) / graph2Dimensions.height);
            }

            graph1.width = graph1Stretchfactor * graph1Dimensions.width;
            graph1.height = graph1Stretchfactor * graph1Dimensions.height;
            graph2.width = graph2Stretchfactor * graph2Dimensions.width;
            graph2.height = graph2Stretchfactor * graph2Dimensions.height;

            moduleData.graph1refPoints = [{x: 2,y: 2.2,z: 0},{x: -2,y: 2.2,z: 0}];
            moduleData.graph2refPoints = [{x: 2,y: 2.2,z: 0},{x: -2,y: 2.2,z: 0}];
        }
        if (format === "sideUI"){
            if (moduleData.applicatorModel.name === "Vaginal Cylinder"){
                graph1.x = (canvas.width * 0.25) + ((canvas.width * 0.75) - graph1.width) / 2;
                graph1.y = canvas.height * 0.1 + ((canvas.height * 0.9) - graph1.height) / 2;

                moduleData.graph1refPointLabel[0].x = 0;
                moduleData.graph1refPointLabel[0].y = canvas.height * 0.2;
                moduleData.graph1refPointLabel[0].width = canvas.width * 0.25;
                moduleData.graph1refPointLabel[0].height = canvas.height * 0.05;
                moduleData.graph1refPointLabel[0].valueToText = (value) => `5mm Depth Dose: ${value}Gy`;
            }else{
                moduleData.graph1refPointLabel[0].x = 0;
                moduleData.graph1refPointLabel[0].y = canvas.height * 0.155;
                moduleData.graph1refPointLabel[0].width = canvas.width * 0.25;
                moduleData.graph1refPointLabel[0].height = canvas.height * 0.04;
                moduleData.graph1refPointLabel[0].valueToText = (value) => `Point A Right: ${value}Gy`;

                moduleData.graph1refPointLabel[1].x = 0;
                moduleData.graph1refPointLabel[1].y = canvas.height * 0.205;
                moduleData.graph1refPointLabel[1].width = canvas.width * 0.25;
                moduleData.graph1refPointLabel[1].height = canvas.height * 0.04;
                moduleData.graph1refPointLabel[1].valueToText = (value) => `Point A Left: ${value}Gy`;
            }
            if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
                graph1.x = (canvas.width * 0.25) + ((canvas.width * 0.25) - graph1.width) / 2;
                graph1.y = canvas.height * 0.1 + ((canvas.height * 0.9) - graph1.height) / 2;
                graph2.x = (canvas.width * 0.5) + ((canvas.width * 0.25) - graph2.width) / 2;
                graph2.y = canvas.height * 0.1 + ((canvas.height * 0.9) - graph2.height) / 2;
                graph3.x = (canvas.width * 0.75) + ((canvas.width * 0.25) - graph3.width) / 2;
                graph3.y = canvas.height * 0.1 + ((canvas.height * 0.9) - graph3.height) / 2;
            }
            if (moduleData.applicatorModel.name === "Tandem/Ring"){
                graph1.x = (canvas.width * 0.25) + ((canvas.width * 0.375) - graph1.width) / 2;
                graph1.y = canvas.height * 0.1 + ((canvas.height * 0.9) - graph1.height) / 2;
                graph2.x = (canvas.width * 0.625) + ((canvas.width * 0.375) - graph1.width) / 2;
                graph2.y = canvas.height * 0.1 + ((canvas.height * 0.9) - graph2.height) / 2;
            }

            resetDwellTimes.width = canvas.width * 0.25;
            resetDwellTimes.height = canvas.height * 0.05;
            resetDwellTimes.x = 0;
            resetDwellTimes.y = canvas.height * 0.3;

            graphModelDropdown.x = 0;
            graphModelDropdown.y = canvas.height * 0.4;
            graphModelDropdown.width = canvas.width * 0.25;
            graphModelDropdown.height = canvas.height * 0.05;
            graphModelDropdown.label = graph1.seeds[0].model.name + " (" + graph1.seeds[0].model.isotope + ")";

            applicatorModelDropdown.x = 0;
            applicatorModelDropdown.y = canvas.height * 0.5;
            applicatorModelDropdown.width = canvas.width * 0.25;
            applicatorModelDropdown.height = canvas.height * 0.05; //label is reolved at the bottom of this if statement
        }else{
            if (moduleData.applicatorModel.name === "Vaginal Cylinder"){
                graph1.x = (canvas.width - graph1.width) / 2;
                graph1.y = canvas.height * 0.25 + ((canvas.height * 0.75) - graph1.height) / 2;

                moduleData.graph1refPointLabel[0].x = (2 * (canvas.width / 3)) * 0.1;
                moduleData.graph1refPointLabel[0].y = canvas.height * 0.155;
                moduleData.graph1refPointLabel[0].width = (2 * (canvas.width / 3)) * 0.8;
                moduleData.graph1refPointLabel[0].height = canvas.height * 0.04;
                moduleData.graph1refPointLabel[0].valueToText = (value) => `5mm Depth Dose: ${value}Gy`;
            }else{
                moduleData.graph1refPointLabel[0].x = (canvas.width / 3) * 0.1;
                moduleData.graph1refPointLabel[0].y = canvas.height * 0.155;
                moduleData.graph1refPointLabel[0].width = (canvas.width / 3) * 0.8;
                moduleData.graph1refPointLabel[0].height = canvas.height * 0.04;
                moduleData.graph1refPointLabel[0].valueToText = (value) => `Point A Right: ${value}Gy`;

                moduleData.graph1refPointLabel[1].x = (canvas.width / 3) * 1.1;
                moduleData.graph1refPointLabel[1].y = canvas.height * 0.155;
                moduleData.graph1refPointLabel[1].width = (canvas.width / 3) * 0.8;
                moduleData.graph1refPointLabel[1].height = canvas.height * 0.04;
                moduleData.graph1refPointLabel[1].valueToText = (value) => `Point A Left: ${value}Gy`;
            }
            if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
                graph1.x = ((canvas.width / 3) - graph1.width) / 2;
                graph1.y = canvas.height * 0.25 + ((canvas.height * 0.75) - graph1.height) / 2;
                graph2.x = (canvas.width / 3) + ((canvas.width / 3) - graph2.width) / 2;
                graph2.y = canvas.height * 0.25 + ((canvas.height * 0.75) - graph2.height) / 2;
                graph3.x = 2 * (canvas.width / 3) + ((canvas.width / 3) - graph3.width) / 2;
                graph3.y = canvas.height * 0.25 + ((canvas.height * 0.75) - graph3.height) / 2;
            }
            if (moduleData.applicatorModel.name === "Tandem/Ring"){
                graph1.x = ((canvas.width / 2) - graph1.width) / 2;
                graph1.y = canvas.height * 0.25 + ((canvas.height * 0.75) - graph1.height) / 2;
                graph2.x = (canvas.width / 2) + ((canvas.width / 2) - graph2.width) / 2;
                graph2.y = canvas.height * 0.25 + ((canvas.height * 0.75) - graph2.height) / 2;
            }

            resetDwellTimes.width = (canvas.width / 3) * 0.8;
            resetDwellTimes.height = canvas.height * 0.04;
            resetDwellTimes.x = (canvas.width / 3) * 2.1;
            resetDwellTimes.y = canvas.height * 0.155;

            graphModelDropdown.x = canvas.width * 0.55;
            graphModelDropdown.y = canvas.height * 0.205;
            graphModelDropdown.width = canvas.width * 0.4;
            graphModelDropdown.height = canvas.height * 0.04;
            graphModelDropdown.label = graph1.seeds[0].model.name + " (" + graph1.seeds[0].model.isotope + ")";

            applicatorModelDropdown.x = canvas.width * 0.05;
            applicatorModelDropdown.y = canvas.height * 0.205;
            applicatorModelDropdown.width = canvas.width * 0.4;
            applicatorModelDropdown.height = canvas.height * 0.04;
        }

        if (typeof moduleData.selectedGraph != "undefined"){
            if (moduleData.selectedSeed != -1){
                let selectedGraph = moduleData[moduleData.selectedGraph];
                let seedPos = graphToScreenPos(selectedGraph.perspective(selectedGraph.seeds[moduleData.selectedSeed].pos),selectedGraph,moduleData["divBoundG" + moduleData.selectedGraph.substring(1)]);
                let editMenuPos = {x: 0, y: 0};
                if (seedPos.x < canvas.width * 0.5){
                    editMenuPos.x = seedPos.x + canvas.width * 0.05;;
                }else{
                    editMenuPos.x = seedPos.x - canvas.width * 0.25;
                }
                if (seedPos.y < canvas.height * 0.5){
                    editMenuPos.y = seedPos.y + canvas.height * 0.05;
                }else{
                    editMenuPos.y = seedPos.y - canvas.height * 0.25;
                }

                dwellTimeSlider.x = editMenuPos.x + canvas.width * 0.02;
                dwellTimeSlider.y = editMenuPos.y + canvas.height * 0.07;
                dwellTimeSlider.length = canvas.width * 0.16;
                dwellTimeSlider.thickness = Math.min(canvas.width,canvas.height) * 0.01;

                dwellTimeLabel.x = editMenuPos.x + canvas.width * 0.025;
                dwellTimeLabel.y = editMenuPos.y + canvas.height * 0.01;
                dwellTimeLabel.width = canvas.width * 0.15;
                dwellTimeLabel.height = canvas.height * 0.05;
            }
        }

        airKermaLabel.x = (canvas.width / 3) + canvas.width * 0.05;
        airKermaLabel.y = canvas.height * 0.115;
        airKermaLabel.width = canvas.width * 0.25;
        airKermaLabel.height = canvas.height * 0.05;

        if (moduleData.applicatorModel.name === "Vaginal Cylinder"){
            applicatorModelDropdown.label = "Vaginal Cylinder: " + moduleData.applicatorModel.length * 10 + "mm length, " + moduleData.applicatorModel.diameter + "cm diameter";
        }
        if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
            applicatorModelDropdown.label = "Tandem/Ovoids: " + moduleData.applicatorModel.length * 10 + "mm Tandem, " + moduleData.applicatorModel.angle + "°, " + moduleData.applicatorModel.ovoidDiameter + "cm Ovoids";
        }
        if (moduleData.applicatorModel.name === "Tandem/Ring"){
            applicatorModelDropdown.label = "Tandem/Ring: " + moduleData.applicatorModel.length * 10 + "mm Tandem, " + moduleData.applicatorModel.angle + "°, " + moduleData.applicatorModel.ringDiameter + "cm Ring";
        }

        moduleData.applicatorModelDropdown.options.forEach(({button: opt},ind) => {
            opt.x = applicatorModelDropdown.x;
            opt.y = applicatorModelDropdown.y + applicatorModelDropdown.height * (ind + 1);
            opt.width = applicatorModelDropdown.width / 4;
            opt.height = applicatorModelDropdown.height;
        });

        let fontSizes = [];
        moduleData.applicatorModelDropdown.options.forEach(({button: button}) => fontSizes.push(getFontSize(button.width,button.height,button.label,(size) => `${size}px monospace`)));
        moduleData.applicatorModelDropdown.options.forEach(({button: opt}) => {opt.font = getMin(fontSizes) + "px monospace";});

        formatApplicatorTypeDropdown(moduleData.applicatorModelDropdown,0);

        adjustApplicatorRenderer(moduleData.graph1,moduleData.applicatorModel,{refPoints: "graph1refPoints", drawFunction: "graph1DrawApplicator", boundingBox: moduleData.divBoundGraph1, view: "front"});
        if (!(moduleData.applicatorModel.name === "Vaginal Cylinder")){
            adjustApplicatorRenderer(moduleData.graph2,moduleData.applicatorModel,{refPoints: "graph2refPoints", drawFunction: "graph2DrawApplicator", boundingBox: moduleData.divBoundGraph2, view: ((moduleData.applicatorModel.name === "Tandem/Ring") ? "top" : "side")});
        }
        if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
            adjustApplicatorRenderer(moduleData.graph3,moduleData.applicatorModel,{refPoints: "graph3refPoints", drawFunction: "graph3DrawApplicator", boundingBox: moduleData.divBoundGraph3, view: "top"});
        }

        moduleData.graphModelDropdown.options.forEach((opt,ind) => {
            opt.x = graphModelDropdown.x;
            opt.y = graphModelDropdown.y + graphModelDropdown.height * (ind + 1);
            opt.width = graphModelDropdown.width;
            opt.height = graphModelDropdown.height;
        });

        fontSizes = [];
        moduleData.graphModelDropdown.options.forEach((button) => fontSizes.push(getFontSize(button.width,button.height,button.label,(size) => `${size}px monospace`)));
        moduleData.graphModelDropdown.options.forEach((opt) => {
            opt.font = getMin(fontSizes) * 0.8 + "px monospace";
        });
    }
    if (module != "brachytherapy applicators"){
        // format reference point labels
        let numGraphs;
        if (module === "single seed"){numGraphs = 2}
        if (module === "string of seeds"){numGraphs = 1}
        if (module === "planar array of seeds"){numGraphs = 2}
        for (let i = 0; i < numGraphs; i++){
            let refPointLabels = moduleData[`graph${i + 1}refPointLabel`];
            refPointLabels.forEach((refPointLabel,ind) => {
                let divBound = moduleData[`divBoundGraph${i + 1}`];
                let refPos = graphToScreenPos(moduleData[`graph${i + 1}refPoints`][ind],moduleData[`graph${i + 1}`],divBound);

                refPointLabel.x = refPos.x + Math.min(divBound.width,divBound.height) * 0.02;
                refPointLabel.y = refPos.y;
                refPointLabel.width = Math.min(divBound.width,divBound.height) * 0.15;
                refPointLabel.height = Math.min(divBound.width,divBound.height) * 0.075;
            });
        }
    }
    if (moduleData.graph1ModelDropdown){
        moduleData.graph1ModelDropdown.options.forEach((opt,ind) => {
            opt.x = moduleData.graph1ModelDropdown.button.x;
            opt.y = moduleData.graph1ModelDropdown.button.y + moduleData.graph1ModelDropdown.button.height * (ind + 1);
            opt.width = moduleData.graph1ModelDropdown.button.width;
            opt.height = moduleData.graph1ModelDropdown.button.height;
        });

        let fontSizes = [];
        moduleData.graph1ModelDropdown.options.forEach((button) => fontSizes.push(getFontSize(button.width,button.height,button.label,(size) => `${size}px monospace`)));
        moduleData.graph1ModelDropdown.options.forEach((opt) => {
            opt.font = getMin(fontSizes) * 0.8 + "px monospace";
        });
    }
    if (moduleData.graph2ModelDropdown){
        moduleData.graph2ModelDropdown.options.forEach((opt,ind) => {
            opt.x = moduleData.graph2ModelDropdown.button.x;
            opt.y = moduleData.graph2ModelDropdown.button.y + moduleData.graph2ModelDropdown.button.height * (ind + 1);
            opt.width = moduleData.graph2ModelDropdown.button.width;
            opt.height = moduleData.graph2ModelDropdown.button.height;
        });

        let fontSizes = [];
        moduleData.graph2ModelDropdown.options.forEach((button) => fontSizes.push(getFontSize(button.width,button.height,button.label,(size) => `${size}px monospace`)));
        moduleData.graph2ModelDropdown.options.forEach((opt) => {
            opt.font = getMin(fontSizes) * 0.8 + "px monospace";
        });
    }

    //logic to resize module selector
    moduleData.moduleSelectBar.forEach((button,ind) => {
        button.width = canvas.width / 4;
        button.height = canvas.height * 0.1;
        button.x = ind * canvas.width / 4;
        button.outlineThickness = 0.005 * Math.min(canvas.width,canvas.height);
    });

    let fontSizes = [];
    moduleData.moduleSelectBar.forEach((button) => fontSizes.push(getFontSize(button.width,button.height,button.label,(size) => `${size}px monospace`)));
    moduleData.moduleSelectBar.forEach((opt) => {
        opt.font = getMin(fontSizes) * 0.8 + "px monospace";
    });
}
function checkOnMouseDown(){ // run only on mouse down
    if (module === "single seed"){
        if (!moduleData.graph1ModelDropdown.showing){
            moduleData.graph1AirKermaLabel.checkClicked();
            moduleData.graph1DwellTimeLabel.checkClicked();
        }
        if (!moduleData.graph2ModelDropdown.showing){
            moduleData.graph2AirKermaLabel.checkClicked();
            moduleData.graph2DwellTimeLabel.checkClicked();
        }
    }
    if (module === "string of seeds"){
        moduleData.seedSpacingLabel.checkClicked();
        moduleData.airKermaLabel.checkClicked();
        moduleData.dwellTimeLabel.checkClicked();
        checkSeedClicked(moduleData.graph1,moduleData.divBoundGraph1,"graph1");
    }
    if (module === "planar array of seeds"){
        moduleData.graph1SeedSpacingLabel.checkClicked();
        moduleData.graph2SeedSpacingLabel.checkClicked();
        moduleData.airKermaLabel.checkClicked();
        moduleData.dwellTimeLabel.checkClicked();
        checkSeedClicked(moduleData.graph1,moduleData.divBoundGraph1,"graph1");
        checkSeedClicked(moduleData.graph2,moduleData.divBoundGraph2,"graph2");
    }
    if (module === "brachytherapy applicators"){
        moduleData.dwellTimeLabel.checkClicked();
        moduleData.airKermaLabel.checkClicked();
        checkSeedClicked(moduleData.graph1,moduleData.divBoundGraph1,"graph1");
        if (moduleData.applicatorModel.name != "Vaginal Cylinder"){
            checkSeedClicked(moduleData.graph2,moduleData.divBoundGraph2,"graph2");
        }
        if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
            checkSeedClicked(moduleData.graph3,moduleData.divBoundGraph3,"graph3");
        }
    }
    // for every module other than single seed, loop over all reference labels and check for click
    let numGraphs;
    if (module === "single seed"){numGraphs = 2}
    if (module === "string of seeds"){numGraphs = 1}
    if (module === "planar array of seeds"){numGraphs = 2}
    if (module === "brachytherapy applicators"){numGraphs = 1}
    for (let i = 0; i < numGraphs; i++){
        moduleData[`graph${i + 1}refPointLabel`].forEach((label) => label.checkClicked());
    }
}
function checkElementsClicked(){ //run on mousedown and mouseup (this is run on mousedown in order to reset "clicked" flags after mouse is released)
    moduleData.moduleSelectBar.forEach((button) => {
        button.checkClicked();
    });
    if (module === "single seed"){
        moduleData.graph1ModelDropdown.checkDropdownClicked();
        moduleData.graph2ModelDropdown.checkDropdownClicked();
    }
    if (module === "string of seeds"){
        moduleData.addSeed.checkClicked();
        moduleData.deleteSeed.checkClicked();
        moduleData.graph1ModelDropdown.checkDropdownClicked();
    }
    if (module === "planar array of seeds"){
        if (!moduleData.graph1ModelDropdown.showing){
            moduleData.graph1AddSeeds.checkClicked();
            moduleData.graph1RemoveSeeds.checkClicked();
        }
        if (!moduleData.graph2ModelDropdown.showing){
            moduleData.graph2AddSeeds.checkClicked();
            moduleData.graph2RemoveSeeds.checkClicked();
        }
        moduleData.graph1ModelDropdown.checkDropdownClicked();
        moduleData.graph2ModelDropdown.checkDropdownClicked();
    }
    if (typeof moduleData.sourceToggle != "undefined"){
        if (typeof moduleData.selectedSeed != "undefined"){
            if (moduleData.selectedSeed != -1){
                moduleData.sourceToggle.checkClicked();
            }
        }
    }
    if (module === "brachytherapy applicators"){
        moduleData.resetDwellTimes.checkClicked();
        moduleData.applicatorModelDropdown.checkDropdownClicked()
        moduleData.graphModelDropdown.checkDropdownClicked();
    }
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
    checkOnMouseDown();
    checkElementsClicked();
});
addEventListener("mouseup",function (e){
	updateMousePos(e);
	mouse.down = false;
    checkElementsClicked();
});
addEventListener("keydown",function (e) {
    let selectedGraph;
    if (typeof moduleData.graph2 != "undefined"){
        if ((mouse.x > moduleData.divBoundGraph1.x) && (mouse.x < moduleData.divBoundGraph1.x + moduleData.divBoundGraph1.width)
            && (mouse.y > moduleData.divBoundGraph1.y) && (mouse.y < moduleData.divBoundGraph1.y + moduleData.divBoundGraph1.height)){
            selectedGraph = moduleData.graph1;
        }
        if ((mouse.x > moduleData.divBoundGraph2.x) && (mouse.x < moduleData.divBoundGraph2.x + moduleData.divBoundGraph2.width)
            && (mouse.y > moduleData.divBoundGraph2.y) && (mouse.y < moduleData.divBoundGraph2.y + moduleData.divBoundGraph2.height)){
            selectedGraph = moduleData.graph2;
        }
        // this statement not only checks if graph3 is defined, but if the user is in the tandem and ring applicator model type, such as to not falsely select an invisible graph
        if (typeof moduleData.graph3 != "undefined" && ((module === "brachytherapy applicators") ? (moduleData.applicatorModel.name != "Tandem/Ring") : true)){
            if ((mouse.x > moduleData.divBoundGraph3.x) && (mouse.x < moduleData.divBoundGraph3.x + moduleData.divBoundGraph3.width)
                && (mouse.y > moduleData.divBoundGraph3.y) && (mouse.y < moduleData.divBoundGraph3.y + moduleData.divBoundGraph3.height)){
                selectedGraph = moduleData.graph3;
            }
        }
        if ((module === "brachytherapy applicators") && (moduleData.applicatorModel.name === "Vaginal Cylinder")){
            selectedGraph = moduleData.graph1;
        }
    }else{
        selectedGraph = moduleData.graph1;
    }
    if (typeof selectedGraph != "undefined"){
        if (e.key === "ArrowDown"){
            selectedGraph.zSlice = Math.max(selectedGraph.zSlice - 0.05,Math.max(getMin(selectedGraph.xTicks),getMin(selectedGraph.yTicks)));
            render = true;
        }
        if (e.key === "ArrowUp"){
            selectedGraph.zSlice = Math.min(selectedGraph.zSlice + 0.05,Math.min(getMax(selectedGraph.xTicks),getMax(selectedGraph.yTicks)));
            render = true;
        }
    }
    if (module === "single seed"){
        moduleData.graph1AirKermaLabel.checkEntry(e.key);
        moduleData.graph2AirKermaLabel.checkEntry(e.key);
        moduleData.graph1DwellTimeLabel.checkEntry(e.key);
        moduleData.graph2DwellTimeLabel.checkEntry(e.key);
    }
    if (module === "string of seeds"){
        moduleData.seedSpacingLabel.checkEntry(e.key);
        moduleData.airKermaLabel.checkEntry(e.key);
    }
    if (module === "planar array of seeds"){
        moduleData.graph1SeedSpacingLabel.checkEntry(e.key);
        moduleData.graph2SeedSpacingLabel.checkEntry(e.key);
        moduleData.airKermaLabel.checkEntry(e.key);
    }
    if (module != "single seed"){
        moduleData.dwellTimeLabel.checkEntry(e.key);
        moduleData.airKermaLabel.checkEntry(e.key);
    }
    // for every module other than single seed, loop over all reference labels and check for data entry
    let numGraphs;
    if (module === "single seed"){numGraphs = 2}
    if (module === "string of seeds"){numGraphs = 1}
    if (module === "planar array of seeds"){numGraphs = 2}
    if (module === "brachytherapy applicators"){numGraphs = 1}
    for (let i = 0; i < numGraphs; i++){
        moduleData[`graph${i + 1}refPointLabel`].forEach((label) => label.checkEntry(e.key));
    }
})
function updateMousePos(e){
	mouse.x = e.clientX + scrollPos.x;
	mouse.y = e.clientY + scrollPos.y;
}

function magnitude(vec){
    return Math.sqrt(vec.x ** 2 + vec.y ** 2 + vec.z ** 2);
}
function interpolateTable(dataArr,spacingArr,ind){
    let neighborHigh = Math.min(getInterpolationIndex(spacingArr,ind),spacingArr.length);
    let neighborLow = Math.max(neighborHigh - 1,0);
    if (neighborHigh == neighborLow) {
        return dataArr[neighborLow];
    }
    return (
        lerp(
            dataArr[neighborLow],
            dataArr[neighborHigh],
            (ind - spacingArr[neighborLow]) / (spacingArr[neighborHigh] - spacingArr[neighborLow]))
    );
}
function biliniarInterpolateTable(data,xSpacing,ySpacing,x,y){
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
function getInterpolationIndex(spacingArr,ind){
    for (let i = 0; i < spacingArr.length; i++){
        if (spacingArr[i] >= ind){
            return i;
        }
    }
    return spacingArr.length - 1;
}
function lerp(a,b,t){
    return (a == b) ? a : (a + (t * (b - a)));
}
function getFontSize(width,height,label,font){
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
function getMin(arr){
    return arr.reduce((minVal,curVal) => ((curVal < minVal) ? curVal : minVal),arr[0]);
}
function getMax(arr){
    return arr.reduce((minVal,curVal) => ((curVal > minVal) ? curVal : minVal),arr[0]);
}
function graphToScreenPos(pos,graph,boundingBox){
    return {
        x: boundingBox.x + ((pos.x - getMin(graph.xTicks)) / (getMax(graph.xTicks) - getMin(graph.xTicks))) * boundingBox.width,
        y: boundingBox.y + boundingBox.height - ((pos.y - getMin(graph.yTicks)) / (getMax(graph.yTicks) - getMin(graph.yTicks))) * boundingBox.height,
    };
}
function getAirKermaFromSlider(slider,source){
    if (source.model.HDRsource){
        return airKermaSliderLimits.HDR.min + slider.value * (airKermaSliderLimits.HDR.max - airKermaSliderLimits.HDR.min);
    }
    return airKermaSliderLimits.LDR.min + slider.value * (airKermaSliderLimits.LDR.max - airKermaSliderLimits.LDR.min);
}
function getDwellTimeFromSlider(slider){
    return slider.value * 0.0833333333333; // slider from 30 seconds to 10 minutes
}
function getValueFromAirKerma(seed){
    return seed.model.HDRsource ?
            ((seed.airKerma - airKermaSliderLimits.HDR.min) / (airKermaSliderLimits.HDR.max - airKermaSliderLimits.HDR.min))
            : 
            ((seed.airKerma - airKermaSliderLimits.LDR.min) / (airKermaSliderLimits.LDR.max - airKermaSliderLimits.LDR.min))
}
function getValueFromDwellTime(seed){
    return seed.dwellTime / 0.0833333333333;
}
function convertUnit(unit,newUnit){
    return parseFloat(unit.split(" ")[0]) * conversionFactors[newUnit][unit.split(" ")[1]];
}
function checkSeedClicked(graph,boundingBox,graphName){
    let seedRadius = Math.min(canvas.width,canvas.height * 0.9) * 0.01; // the radius is double the actual size of the drawn dots for ease of selection
    let ind = graph.seeds.findIndex((seed) => {
        let seedScreenPos = graphToScreenPos(seed.pos,graph,boundingBox);
        return (Math.sqrt((mouse.x - seedScreenPos.x)**2 + (mouse.y - seedScreenPos.y)**2) <= seedRadius);
    });
    ind = graph.seeds.reduce((closestSeed,seed,currInd) => {
        let seedScreenPos = graphToScreenPos(graph.perspective(seed.pos),graph,boundingBox);
        let dist = Math.sqrt((mouse.x - seedScreenPos.x)**2 + (mouse.y - seedScreenPos.y)**2);
        if ((dist <= seedRadius) && ((closestSeed.ind == -1) || (dist < closestSeed.dist))){
            return {dist: dist, ind: currInd};
        }else{
            return closestSeed;
        }
    },{dist: 0, ind: -1}).ind;
    let seed = graph.seeds[ind];
    if (typeof seed != "undefined") {
        if ((moduleData.selectedSeed == ind) && (moduleData.selectedGraph === graphName)){
            moduleData.selectedSeed = -1;
        }else{
            moduleData.selectedSeed = ind;
            moduleData.selectedGraph = graphName;
        }
        if (module === "string of seeds"){
            moduleData.airKermaSlider.value = getValueFromAirKerma(seed);
            moduleData.dwellTimeSlider.value = getValueFromDwellTime(seed);
        }
        if (module === "planar array of seeds"){
            moduleData[graphName + "AirKermaSlider"].value = getValueFromAirKerma(seed);
            moduleData[graphName + "DwellTimeSlider"].value = getValueFromDwellTime(seed);
        }
        if (module === "brachytherapy applicators"){
            moduleData.graphDwellTimeSlider.value = getValueFromDwellTime(seed);
        }
    }
}
function drawSeed(seed,graph,bounds){
    let centerPos = graphToScreenPos(seed.pos,graph,bounds);
    let cornerPos = graphToScreenPos({x: (seed.pos.x - (seed.model.sourceLength / 2)), y: (seed.pos.y + (seed.model.sourceDiameter / 2))},graph,bounds);
    ctx.fillStyle = "rgb(58, 58, 58)";
    ctx.beginPath();
    ctx.roundRect(cornerPos.x,cornerPos.y,2 * (centerPos.x - cornerPos.x),2 * (centerPos.y - cornerPos.y),Math.min(centerPos.x - cornerPos.x,centerPos.y - cornerPos.y));
    ctx.fill();
}
function drawGraphSeeds(graph,bound,name){
    let seedRadius = Math.min(canvas.width,canvas.height * 0.9) * 0.005;
    ctx.lineWidth = seedRadius * 0.5;
    graph.seeds.forEach((seed) => {
        let seedPos = graph.perspective(seed.pos);
        if ((seedPos.x <= getMax(graph.xTicks)) && (seedPos.x >= getMin(graph.xTicks))
            && (seedPos.y <= getMax(graph.yTicks)) && (seedPos.y >= getMin(graph.yTicks))){
            if ((!seed.enabled) || (seed.model.HDRsource && (seed.dwellTime == 0))){
                ctx.fillStyle = "rgb(255, 255, 255)";
                ctx.strokeStyle = "rgb(0, 0, 0)";
            }else{
                ctx.fillStyle = "rgb(0, 0, 0)";
                ctx.strokeStyle = "rgb(255, 255, 255)";
            }
            let screenPos = graphToScreenPos({x: seedPos.x,y: seedPos.y},graph,bound);
            ctx.beginPath();
            ctx.arc(screenPos.x,screenPos.y,seedRadius,0,2 * Math.PI);
            ctx.stroke();
            ctx.fill();
        }
    });
    if ((typeof moduleData.selectedSeed != "undefined") && (moduleData.selectedSeed != -1) && ((module === "brachytherapy applicators") || (moduleData.selectedGraph === name))){
        ctx.fillStyle = "rgb(169, 255, 103)";
        let screenPos = graphToScreenPos(graph.perspective(graph.seeds[moduleData.selectedSeed].pos),graph,bound);
        ctx.beginPath();
        ctx.arc(screenPos.x,screenPos.y,seedRadius,0,2 * Math.PI);
        ctx.fill();
    }
}
function setDoseAtPoint(graph,point,prescription,dwellTimeSlider,airKermaSlider){
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
            if (graph.getPointDose(point) > prescription){
                dwellTime.max = testingDwellTime();
            }else{
                dwellTime.min = testingDwellTime();
            }
        }
        if (typeof dwellTimeSlider != "undefined"){
            dwellTimeSlider.value = getValueFromDwellTime(graph.seeds[0]);
        }
    }else{
        let airKerma = {...airKermaSliderLimits.LDR};
        let testingAirKerma = () => (airKerma.min + airKerma.max) / 2;
        for (let i = 0; i < searchPrecision; i++){
            graph.seeds.forEach((seed) => {
                seed.airKerma = testingAirKerma();
            });
            if (graph.getPointDose(point) > prescription){
                airKerma.max = testingAirKerma();
            }else{
                airKerma.min = testingAirKerma();
            }
        }
        if (typeof airKermaSlider != "undefined"){
            airKermaSlider.value = getValueFromAirKerma(graph.seeds[0]);
        }
    }
    render = true;
}
function adjustApplicatorGraphFormat(graph,model,{refPoints: refPoints,drawFunction: drawFunction,boundingBox: boundingBox, view: view}){
    let seedModel = (moduleData.graph1.seeds.length > 0) ? moduleData.graph1.seeds[0].model : GammaMedHDRPlus;
    let airKerma = airKermaSliderLimits.HDR.min;
    if (model.name === "Vaginal Cylinder"){
        let adjustedSeeds = [];
        for (let i = model.length - 0.7; i >= 0; i -= 1){
            adjustedSeeds.push(new Seed({x: 0, y: i, z: 0},{phi: Math.PI / 2, theta: 0},seedModel,airKerma,0.00833));
        }
        graph.seeds = adjustedSeeds;
        let xTick = [];
        for (let i = -model.diameter / 2 - 1; i <= model.diameter / 2 + 1; i += 0.125){xTick.push(i);}
        let yTick = [];
        for (let i = -2; i <= model.length + 2; i += 0.125){yTick.push(i);}
        graph.xTicks = xTick;
        graph.yTicks = yTick;
        moduleData[refPoints] = [{x: model.diameter / 2 + 0.5, y: (model.length - 0.7) / 2, z: 0}];
    }
    if (model.name === "Tandem/Ovoids"){
        let adjustedSeeds = [];
        for (let i = model.length - 0.7; i >= 0; i -= 1){
            adjustedSeeds.push(new Seed({x: 0, y: i, z: 0},{phi: Math.PI / 2, theta: 0},seedModel,airKerma,0.00833));
        }
        for (let i = -1; i <= 1; i += 0.5){
            adjustedSeeds.push(new Seed({x: -model.ovoidDiameter / 2, y: -model.ovoidDiameter / 2, z: i},{phi: 0, theta: Math.PI / 2},seedModel,airKerma,0.00833));
            adjustedSeeds.push(new Seed({x: model.ovoidDiameter / 2, y: -model.ovoidDiameter / 2, z: i},{phi: 0, theta: Math.PI / 2},seedModel,airKerma,0.00833));
        }
        graph.seeds = adjustedSeeds;
        let xTick = [];
        for (let i = -model.ovoidDiameter - 2; i <= model.ovoidDiameter + 2; i += 0.125){xTick.push(i);}
        let yTick = [];
        for (let i = -model.ovoidDiameter - 2; i <= model.length + 2; i += 0.125){yTick.push(i);}
        graph.xTicks = xTick;
        graph.yTicks = yTick;
        moduleData[refPoints] = [{x: 2, y: 2, z: 0},{x: -2, y: 2, z: 0}];
    }
    if (model.name === "Tandem/Ring"){
        let adjustedSeeds = [];
        for (let i = model.length - 0.7; i >= 0; i -= 1){
            adjustedSeeds.push(new Seed({x: 0, y: i, z: 0},{phi: Math.PI / 2, theta: 0},seedModel,airKerma,0.00833));
        }
        // add seeds in the ring (z coordinate is negated so that it aligns with the "tail")
        for (let i = (3 * Math.PI / 4); i <= (7 * Math.PI / 3); i += 1 / (model.ringDiameter / 2)){
            adjustedSeeds.push(new Seed({x: (model.ringDiameter / 2) * Math.cos(i), y: 0, z: (model.ringDiameter / 2) * Math.sin(i)},{phi: 0, theta: i + Math.PI / 2},seedModel,airKerma,0.00833));
        }
        graph.seeds = adjustedSeeds;
        let xTick = [];
        for (let i = -model.ringDiameter - 2.6; i <= model.ringDiameter + 2.6; i += 0.125){xTick.push(i);} //2mm of room is used of all graphs, and an extra 0.6 is given to account for the thickness of the ring
        let yTick = [];
        if (view === "top"){
            for (let i = -(model.ringDiameter / 2) - 2.6; i <= (model.ringDiameter / 2) + 2.6; i += 0.125){yTick.push(i);}
        }else{
            for (let i = -2; i <= model.length + 2; i += 0.125){yTick.push(i);}
        }
        graph.xTicks = xTick;
        graph.yTicks = yTick;
        moduleData[refPoints] = [{x: 2, y: 2, z: 0},{x: -2, y: 2, z: 0}];
    }
    if (view === "front"){
        graph.perspective = (point) => point;
    }
    if (view === "side"){
        graph.perspective = (point) => {
            return {
                x: point.z,
                y: point.y,
                z: point.x
            }
        }
    }
    if (view === "top"){
        graph.perspective = (point) => {
            return {
                x: point.x,
                y: point.z,
                z: point.y
            }
        }
    }
    graph.zSlice = 0;
    adjustApplicatorRenderer(graph,model,{drawFunction: drawFunction,boundingBox: boundingBox, view: view});
}
function adjustApplicatorRenderer(graph,model,{drawFunction: drawFunction,boundingBox: boundingBox, view: view}){
    moduleData[drawFunction] = function () {
        let origin = graphToScreenPos({x: 0, y: 0},graph,boundingBox); // origin :)
        // draw the tandem bit without the curve
        ctx.strokeStyle = "black";
        ctx.lineWidth = Math.min(canvas.width,canvas.height * 0.9) * 0.005;
        if (model.name === "Vaginal Cylinder"){
            model.angle = 90;
            drawAngledTandem(model,graph,boundingBox,origin);
        }
        if (model.name === "Tandem/Ovoids"){
            if (view === "front"){
                //draw ovoids
                let ovoidRight = graphToScreenPos({x: model.ovoidDiameter / 2, y: -model.ovoidDiameter / 2},graph,boundingBox);
                let ovoidLeft = graphToScreenPos({x: -model.ovoidDiameter / 2, y: -model.ovoidDiameter / 2},graph,boundingBox);
                let startAngle = Math.atan2(Math.sqrt(((model.ovoidDiameter / 2) ** 2) - (((model.diameter - model.ovoidDiameter) / 2) ** 2)),(model.diameter - model.ovoidDiameter) / 2);
                ctx.beginPath();
                ctx.ellipse(ovoidRight.x,ovoidRight.y,Math.abs(origin.x - ovoidRight.x),Math.abs(origin.y - ovoidRight.y),0,startAngle,2 * Math.PI - startAngle,true);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(ovoidLeft.x,ovoidLeft.y,Math.abs(origin.x - ovoidLeft.x),Math.abs(origin.y - ovoidLeft.y),0,Math.PI - startAngle,startAngle + Math.PI,false);
                ctx.stroke();

                // draw tandem
                let frontModel = {...model};
                frontModel.angle = 90; //this makes the tandem straight from this perspective
                drawAngledTandem(frontModel,graph,boundingBox,origin);
            }
            if (view === "side"){
                // draw ovoid
                let pos5 = graphToScreenPos({x: -1.5, y: 0},graph,boundingBox);
                let pos6 = graphToScreenPos({x: 1.5, y: -model.ovoidDiameter},graph,boundingBox);
                ctx.beginPath();
                ctx.roundRect(pos5.x,pos5.y,pos6.x - pos5.x,pos6.y - pos5.y,Math.min((pos6.x - pos5.x) / 3, (pos6.y - pos5.y) / 3));
                ctx.stroke();
                // draw tandem
                drawAngledTandem(model,graph,boundingBox,origin);
            }
            if (view === "top"){
                let pos1 = graphToScreenPos({x: -model.diameter / 2, y: model.diameter / 2},graph,boundingBox); // top left of tandem, used to skew tandem when aspect ratio is incorrect
                ctx.fillStyle = "black";
                ctx.beginPath();
                ctx.ellipse(origin.x,origin.y,origin.x - pos1.x,origin.y - pos1.y,0,0,2 * Math.PI);
                ctx.fill();
                let pos2 = graphToScreenPos({x: -model.ovoidDiameter, y: 1.5},graph,boundingBox); // top left of left ovoid
                let fillet = graphToScreenPos({x: -1, y: 1},graph,boundingBox);
                ctx.beginPath();
                ctx.roundRect(pos2.x,pos2.y,origin.x - pos2.x, 2 * (origin.y - pos2.y), Math.min(origin.x - fillet.x, origin.y - fillet.y));
                ctx.stroke();
                ctx.beginPath();
                ctx.roundRect(origin.x,pos2.y,origin.x - pos2.x, 2 * (origin.y - pos2.y), Math.min(origin.x - fillet.x, origin.y - fillet.y));
                ctx.stroke();
            }else{
                // draw "lip" on the tandem
                ctx.lineWidth = Math.min(canvas.width,canvas.height * 0.9) * 0.005;
                let pos3 = graphToScreenPos({x: -0.8, y: 0.2},graph,boundingBox);
                let pos4 = graphToScreenPos({x: 0.8, y: 0},graph,boundingBox);
                ctx.beginPath();
                ctx.roundRect(pos3.x,pos3.y,pos4.x - pos3.x,pos4.y - pos3.y, (pos4.y - pos3.y) / 2);
                ctx.stroke();
            }
        }
        if (model.name === "Tandem/Ring"){
            if (view === "front"){
                let leftRingBoxLeftCorner = graphToScreenPos({x: - (model.ringDiameter / 2) - 0.6, y: 0},graph,boundingBox);
                let leftRingBoxRightCorner = graphToScreenPos({x: - (model.ringDiameter / 2) + 0.6, y: -0.75},graph,boundingBox);
                let rightRingBoxLeftCorner = graphToScreenPos({x: (model.ringDiameter / 2) - 0.6, y: 0},graph,boundingBox);
                let rightRingBoxRightCorner = graphToScreenPos({x: (model.ringDiameter / 2) + 0.6, y: -0.75},graph,boundingBox);
                let round = graphToScreenPos({x: 0.3, y: 0},graph,boundingBox).x - origin.x;
                ctx.beginPath();
                ctx.roundRect(leftRingBoxLeftCorner.x,leftRingBoxLeftCorner.y,leftRingBoxRightCorner.x - leftRingBoxLeftCorner.x,leftRingBoxRightCorner.y - leftRingBoxLeftCorner.y,[0,0,round,round]);
                ctx.roundRect(rightRingBoxLeftCorner.x,rightRingBoxLeftCorner.y,rightRingBoxRightCorner.x - rightRingBoxLeftCorner.x,rightRingBoxRightCorner.y - rightRingBoxLeftCorner.y,[0,0,round,round]);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc((leftRingBoxLeftCorner.x + leftRingBoxRightCorner.x) / 2,leftRingBoxLeftCorner.y,(leftRingBoxRightCorner.x - leftRingBoxLeftCorner.x) / 2,0,Math.PI,true);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc((rightRingBoxLeftCorner.x + rightRingBoxRightCorner.x) / 2,rightRingBoxLeftCorner.y,(rightRingBoxRightCorner.x - rightRingBoxLeftCorner.x) / 2,0,Math.PI,true);
                ctx.stroke();
                drawAngledTandem(model,graph,boundingBox,origin);
            }
            if (view === "top"){
                let xInnerRadius = graphToScreenPos({x: (model.ringDiameter / 2) - 0.6, y: 0},graph,boundingBox).x - origin.x;
                let yInnerRadius = origin.y - graphToScreenPos({x: 0, y: (model.ringDiameter / 2) - 0.6},graph,boundingBox).y;
                let xOuterRadius = graphToScreenPos({x: (model.ringDiameter / 2) + 0.6, y: 0},graph,boundingBox).x - origin.x;
                let yOuterRadius = origin.y - graphToScreenPos({x: 0, y: (model.ringDiameter / 2) + 0.6},graph,boundingBox).y;
                ctx.beginPath();
                ctx.ellipse(origin.x,origin.y,xInnerRadius,yInnerRadius,0,0,2 * Math.PI);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(origin.x,origin.y,xOuterRadius,yOuterRadius,0,0,2 * Math.PI);
                ctx.stroke();
            }
        }
    }
}
function drawAngledTandem(model,graph,boundingBox,origin){
    let pos1 = graphToScreenPos({x: -model.diameter / 2, y: model.length + ((model.name === "Tandem/Ovoids") ? 0.2: 0)},graph,boundingBox); // top left of tandem
    let pos2 = graphToScreenPos({x: model.diameter / 2, y: ((model.name === "Tandem/Ovoids") ? 0.2 : 0)},graph,boundingBox); // bottom right of tandem
    ctx.beginPath();
    ctx.roundRect(pos1.x,pos1.y,pos2.x - pos1.x, pos2.y - pos1.y, [(pos2.x - pos1.x) / 2,(pos2.x - pos1.x) / 2,0,0]);
    ctx.stroke();
    let radianAngle = ((270 + (90 - model.angle)) / 360) * 2 * Math.PI;
    let pos3;
    let pos4;
    if (model.name === "Tandem/Ovoids"){
        pos3 = graphToScreenPos({x: 0, y: -model.ovoidDiameter / 2},graph,boundingBox); // point centered between two ovoids
        pos4 = graphToScreenPos(
            {
                x: (model.ovoidDiameter / 2) * Math.cos(radianAngle),
                y: - (model.ovoidDiameter / 2) + (model.ovoidDiameter / 2) * Math.sin(radianAngle)
            },
            graph,boundingBox
        );
    }else{
        pos3 = graphToScreenPos({x: 0, y: -0.5},graph,boundingBox); // point centered between two ovoids
        pos4 = graphToScreenPos(
            {
                x:  Math.cos(radianAngle),
                y: -0.5 + Math.sin(radianAngle)
            },
            graph,boundingBox
        );
    }
    let endPos = graphToScreenPos({
        x: (getMin(graph.yTicks) / Math.sin(radianAngle)) * Math.cos(radianAngle),
        y: getMin(graph.yTicks)
    },graph,boundingBox);
    ctx.lineWidth = pos2.x - pos1.x;
    ctx.beginPath();
    ctx.moveTo(origin.x,origin.y);
    ctx.bezierCurveTo(pos3.x,pos3.y,pos4.x,pos4.y,endPos.x,endPos.y);
    ctx.stroke();
}
function formatApplicatorTypeDropdown(dropdown,depth){
    dropdown.options.forEach((opt,ind) => {
        if (opt.options){
            if (opt.showing){
                opt.button.bgColor = "black";
                opt.button.fontColor = "white";
            }else{
                opt.button.bgColor = "white";
                opt.button.fontColor = "black";
            }
            opt.button.x = moduleData.applicatorModelDropdown.button.x + depth * (moduleData.applicatorModelDropdown.button.width / 4);
            opt.button.y = moduleData.applicatorModelDropdown.button.y + moduleData.applicatorModelDropdown.button.height * (ind + 1);
            opt.button.width = moduleData.applicatorModelDropdown.button.width / 4;
            opt.button.height = moduleData.applicatorModelDropdown.button.height;
            formatApplicatorTypeDropdown(opt,depth + 1);
        }else{
            opt.x = moduleData.applicatorModelDropdown.button.x + depth * (moduleData.applicatorModelDropdown.button.width / 4);
            opt.y = moduleData.applicatorModelDropdown.button.y + moduleData.applicatorModelDropdown.button.height * (ind + 1);
            opt.width = moduleData.applicatorModelDropdown.button.width / 4;
            opt.height = moduleData.applicatorModelDropdown.button.height;
        }
    });

    let fontSizes = [];
    dropdown.options.forEach((child) => {
        if (child.button){
            fontSizes.push(getFontSize(child.button.width,child.button.height,child.button.label,(size) => `${size}px monospace`));
        }else{
            fontSizes.push(getFontSize(child.width,child.height,child.label,(size) => `${size}px monospace`));
        }
    });

    dropdown.options.forEach((child) => {
        if (child.button){
            child.button.font = getMin(fontSizes) * 0.8 + "px monospace";
        }else{
            child.font = getMin(fontSizes) * 0.8 + "px monospace";
        }
    });
}