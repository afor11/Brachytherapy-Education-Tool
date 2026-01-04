import { drawAnatomy } from './interpolateAnatomy.js';
import { anatomyData } from './constants.js';
import { magnitude , cloneObj, getMax, getMin, getFontSize, distance, nothing, eventHandled, getRange } from './utils.js';

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

export class Graph {
    constructor({x, y, width, height, seeds, xTicks, yTicks, perspective, name, refpoints, autoAspect = true}){
        this.x = x;
        this.y = y;
        this.zSlice = 0; // depth of the slice being rendered by this graph from the perspective of the graph itself
        this.width = width;
        this.height = height;
        this.autoAspect = autoAspect;
        this.seeds = seeds;
        this.xTicks = xTicks;
        this.yTicks = yTicks;
        this.perspective = perspective; //maps coordinates on the graph to coordinates in space (allows to adjust perspective)
        this.graphDimensions = {x: 0, y: 0, width: 0, height: 0};
        this.name = name;
        this.refpoints = refpoints;
        this.selectedSeed = -1;
        this.unit = () => {
            return { // yes these are slightly different, plotly is weird
                width: this.graphDimensions.width / this.unitWidth(),
                height: this.graphDimensions.height / this.unitHeight()
            }
        };
        this.seedRadius = () => Math.min(canvas.width, canvas.height) * 0.005;
        this.cachedDose = new Map();
        this.unitWidth = () => getMax(this.xTicks) - getMin(this.xTicks); // width of the graph in graph units
        this.unitHeight = () => getMax(this.yTicks) - getMin(this.yTicks); // height of the graph in graph units
    }
    getPointDoseFromSeed(seed, pos){
        let relativePos = {
            x: (pos.x - seed.pos.x),
            y: (pos.y - seed.pos.y),
            z: (pos.z - seed.pos.z)
        };
        let dot = (relativePos.x * seed.directionVec.x + relativePos.y * seed.directionVec.y + relativePos.z * seed.directionVec.z) / magnitude(relativePos);
        dot = Math.min(Math.max(dot,-1),1); // this clamps the dot product between -1 and 1 to reduce floating point error
        return seed.calculateDose({
            x: pos.x,
            y: pos.y,
            z: pos.z,
            r: magnitude(relativePos),
            theta: Math.acos(dot)
        });
    }
    getPointDose(pos){
        return this.seeds.reduce((dose,seed) => {
            return dose + this.getPointDoseFromSeed(seed, pos);
        },0);
    }
    getGraphState(){
        return JSON.stringify([
            this.zSlice,
            this.xTicks,
            this.yTicks,
            this.perspective,
            this.refpoints,
        ]);
    }
    getSeedState(seed){
        return JSON.stringify([
            seed.model.name,
            seed.pos,
            seed.rot,
            seed.directionVec,
            seed.geometryRef
        ]);
    }
    getIsodose(refPoint){
        let usedCaches = new Map();
        this.cachedDose.forEach((_, seedString) => {
            usedCaches.set(seedString, false);
        });

        let defaultDose = Array(this.yTicks.length).fill(Array(this.xTicks.length).fill(0));

        let dose = this.seeds.reduce((totalDose, seed) => {
            if (!seed.enabled){return totalDose;}
            let dose = [];
            let seedString = this.getSeedState(seed);
            if (this.cachedDose.has(seedString)){
                // this seed has bee cached
                let cachedDose = this.cachedDose.get(seedString);
                
                // finds the factor to multiply all doses in the cached dose array by (this factor is needed since seeds
                // with differing air kermas and dwell times are not differentiated, as it would be much more efficent
                // to just multiply by this factor instead of recalculating the cache values every time air kerma or dwell
                // time are updated)
                let airKermaScaleFactor = (seed.airKerma / cachedDose.airKerma);
                let dwellTimeScaleFactor = (
                    seed.model.HDRsource ?
                        (1 - Math.exp(-seed.dwellTime / (1.44 * seed.model.halfLife))) /
                        (1 - Math.exp(-cachedDose.dwellTime / (1.44 * cachedDose.halfLife)))
                    :
                        1
                );
                let doseScaleFactor = airKermaScaleFactor * dwellTimeScaleFactor;

                if (cachedDose.graphState === this.getGraphState()){
                    // the graph state has not changed since the seed has been cached
                    dose = [];
                    for (let i = 0; i < this.yTicks.length; i++){
                        let doseSlice = [];
                        for (let j = 0; j < this.xTicks.length; j++){
                            doseSlice.push(totalDose[i][j] + cachedDose.dose[i][j] * doseScaleFactor);
                        }
                        dose.push(doseSlice);
                    }
                    usedCaches.set(seedString, true);
                    return dose;
                }
            }

            // if the cache was not use, perpare to add the calculated dose as a cache entry
            let doseCache = {
                graphState: this.getGraphState(),
                airKerma: seed.airKerma,
                dwellTime: seed.dwellTime,
                halfLife: seed.model.halfLife,
                dose: []
            };

            // calculate dose from the specific seed
            for (let i = 0; i < this.yTicks.length; i++){
                let doseSlice = [];
                let totalDoseSlice = [];
                for (let j = 0; j < this.xTicks.length; j++){
                    let pointDose = this.getPointDoseFromSeed(seed, this.perspective({x: this.xTicks[j], y: this.yTicks[i], z: this.zSlice}));
                    doseSlice.push(pointDose);
                    totalDoseSlice.push(totalDose[i][j] + pointDose);
                }
                doseCache.dose.push(doseSlice);
                dose.push(totalDoseSlice);
            }

            // update cache
            this.cachedDose.set(seedString, doseCache);
            usedCaches.set(seedString, true);
            return dose;
        },defaultDose);

        this.cachedDose.forEach((_, seedString) => {
            if (!usedCaches.get(seedString)){
                this.cachedDose.delete(seedString);
            }
        });

        let refDose = this.getPointDose(this.perspective({x: refPoint.x, y: refPoint.y, z: this.zSlice}));
        refDose = ((refDose == 0) ? 1 : refDose); // prevent divide by 0 errors

        let isodose = [];
        for (let i = 0; i < this.yTicks.length; i++){
            let slice = [];
            for (let j = 0; j < this.xTicks.length; j++){
                slice.push(100 * dose[i][j] / refDose);
            }
            isodose.push(slice);
        }

        return isodose;
    }
    drawGraph(div){
        let data = [];
        for (let i = 1; i < 128; i *= 2){
            data.push(
                {
                    z: this.getIsodose(this.refpoints[0]),
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
        let layout = {
            xaxis: {
                title: {
                    text: 'cm',
                    font: {
                        family: 'Arial',
                        size: 18,
                    },
                }
            },
            yaxis: {
                title: {
                    text: 'cm',
                    font: {
                        family: 'Arial',
                        size: 18,
                        color: "black"
                    },
                }
            },
        }
        Plotly.newPlot(div.id, data, layout); //does not update after window rescaling
        let gridElm = div.children[0].children[0].children[0].children[4].children[0].children[3];
        this.graphDimensions = gridElm.getBoundingClientRect();
    }
    drawRefPoints(){
        let size = Math.min(this.graphDimensions.width,this.graphDimensions.height) * 0.01;
        this.refpoints.forEach((refpoint) => {
            let screenPos = this.graphToScreenPos(this.perspective(refpoint));
            ctx.strokeStyle = "red";
            ctx.lineWidth = Math.min(canvas.width, canvas.height) * 0.003;
            ctx.beginPath();
            ctx.moveTo(screenPos.x + size,screenPos.y + size);
            ctx.lineTo(screenPos.x - size,screenPos.y - size);
            ctx.lineTo(screenPos.x,screenPos.y);
            ctx.lineTo(screenPos.x - size,screenPos.y + size);
            ctx.lineTo(screenPos.x + size,screenPos.y - size);
            ctx.stroke();
        });
    }
    graphToScreenPos(point){
        return {
            x: this.graphDimensions.x + ((point.x - getMin(this.xTicks)) / this.unitWidth()) * this.graphDimensions.width,
            y: this.graphDimensions.y + this.graphDimensions.height - ((point.y - getMin(this.yTicks)) / this.unitHeight()) * this.graphDimensions.height,
        };
    }
    screenToGraphPos(point){
        return {
            x: getMin(this.xTicks) + ((point.x - this.graphDimensions.x) / this.graphDimensions.width) * this.unitWidth(),
            y: getMax(this.yTicks) + ((point.y - this.graphDimensions.y) / this.graphDimensions.height) * (getMin(this.yTicks) - getMax(this.yTicks))
        }
    }
    overlayAnatomy(view, params){
        let formattedAnatomy = scaleAnatomyData(this.graphToScreenPos({x: 0, y: 0}), this.graphDimensions.width, this.unitWidth());

        if (formattedAnatomy.hasOwnProperty(view)){
            drawAnatomy(
                view,
                {
                    tandemLength: params.applicatorModel.length * 10,
                    tandemAngle: params.applicatorModel.angle,
                    ovoidSize: params.applicatorModel.ovoidDiameter * 10
                },
                formattedAnatomy
            );
        }
    }
    drawGraphSeeds(){
        let seedRadius = this.seedRadius();
        ctx.lineWidth = seedRadius * 0.5;
        this.seeds.forEach((seed) => {
            let seedPos = this.perspective(seed.pos);
            if ((seedPos.x <= getMax(this.xTicks)) && (seedPos.x >= getMin(this.xTicks))
                && (seedPos.y <= getMax(this.yTicks)) && (seedPos.y >= getMin(this.yTicks))){
                if ((!seed.enabled) || (seed.model.HDRsource && (seed.dwellTime == 0))){
                    ctx.fillStyle = "rgb(255, 255, 255)";
                    ctx.strokeStyle = "rgb(0, 0, 0)";
                }else{
                    ctx.fillStyle = "rgb(0, 0, 0)";
                    ctx.strokeStyle = "rgb(255, 255, 255)";
                }
                let screenPos = this.graphToScreenPos({x: seedPos.x,y: seedPos.y});
                ctx.beginPath();
                ctx.arc(screenPos.x,screenPos.y,seedRadius,0,2 * Math.PI);
                ctx.stroke();
                ctx.fill();
            }
        });
        if (this.selectedSeed != -1){
            ctx.fillStyle = "rgb(169, 255, 103)";
            let screenPos = this.graphToScreenPos(this.perspective(this.seeds[this.selectedSeed].pos));
            ctx.beginPath();
            ctx.arc(screenPos.x,screenPos.y,seedRadius,0,2 * Math.PI);
            ctx.fill();
        }
    }
    *checkClicked(){
        if (!window.mouse.down){
            return false;
        }

        let closestSeed = this.seeds.reduce((closestSeed, seed, ind) => {
            let seedPos = this.graphToScreenPos(this.perspective(seed.pos));
            let seedDist = distance([mouse.x, mouse.y],[seedPos.x, seedPos.y]);
            if ((seedDist < closestSeed.dist) && this.pointOnGraph(seedPos)){
                return {
                    dist: seedDist,
                    ind: ind
                };
            }
            return closestSeed;
        },{dist: Infinity});

        if ((closestSeed.dist < this.seedRadius() * 5) && this.pointOnGraph(window.mouse)){
            this.selectedSeed = closestSeed.ind;
            return true;
        } else if (this.selectedSeed != -1){
            this.selectedSeed = -1;
        }

        return false;
    }
    pointOnGraph(point){
        return (
            (point.x > this.graphDimensions.x)
            && (point.x < this.graphDimensions.x + this.graphDimensions.width)
            && (point.y > this.graphDimensions.y)
            && (point.y < this.graphDimensions.y + this.graphDimensions.height)
        )
    }
    drawMouseLabel(){
        if (this.pointOnGraph(window.mouse)){
            let doseAtMouse = this.getPointDose(this.perspective({...this.screenToGraphPos(window.mouse), z: 0})).toFixed(2) + "Gy";
            let boundingBox = {
                x: window.mouse.x,
                y: window.mouse.y,
                width: this.graphDimensions.width * 0.15,
                height: this.graphDimensions.height * 0.05,
            };

            ctx.fillStyle = "white";
            ctx.font = getFontSize(boundingBox.width, boundingBox.height, doseAtMouse, (size) => `${size}px Arial`) + "px Arial";
            let metrics = ctx.measureText(doseAtMouse);
            let labelTextWidth = metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft;
            let labelTextHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
            ctx.fillRect(boundingBox.x,boundingBox.y - labelTextHeight,labelTextWidth,labelTextHeight);
            
            ctx.fillStyle = "black";
            ctx.textBaseline = "bottom";
            ctx.fillText(doseAtMouse,boundingBox.x,boundingBox.y);
            ctx.textBaseline = "alphabetic";
        }
    }
}

function scaleAnatomyData(origin, screenDist, cmDistance){
    let scaleFactor = screenDist / (cmDistance * 10); //factor for converting mm to screen coords
    let scaledAnatomy = cloneObj(anatomyData);
    console.log(scaleFactor);

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
    return scaledAnatomy;
}