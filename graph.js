import { drawAnatomy, getAnatomy, scaleAnatomy } from './interpolateAnatomy.js';
import { anatomyData, colorPalette } from './constants.js';
import { magnitude , cloneObj, getMax, getMin, getFontSize, distance, clamp } from './utils.js';
import { AlgebraicEffect } from './algebraicEffect.js';
import { MarchingSquares } from './MarchingSquares.js';

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

export class Graph {
    constructor({x, y, width, height, seeds, xTicks, yTicks, perspective, name, refpoints, anatomyView, anatomyApplicator, anatomyParams, scale = "cm", cornerRounding = 0.1}){
        this.x = x;
        this.y = y;
        this.zSlice = 0; // depth of the slice being rendered by this graph from the perspective of the graph itself
        this.width = width;
        this.height = height;
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
        this.seedType = () => this.seeds[0]?.model;
        if (typeof anatomyView !== "undefined"){
            this.anatomyView = anatomyView;
            this.anatomyApplicator = anatomyApplicator;
            this.anatomyParams = anatomyParams;
            this.applicatorAnatomy = getAnatomy(
                this.anatomyView + this.anatomyApplicator,
                this.anatomyParams,
                cloneObj(anatomyData)
            );
            this.scaledAnatomy = {};
        }

        this.scale = scale;
        this.isolineGraph = new MarchingSquares(this.xTicks, this.yTicks, [0.5, 1, 2], {x: this.x, y: this.y, width: this.width, height: this.height});
        this.isolines = [12.5, 50, 100, 200, 400, 800];
        this.isolineColors = ["#D92684", "#D97B26","#D9262A", "#84D926", "#26D9D5", "#7B26D9"];
        this.cornerRounding = cornerRounding;
    }
    *refreshAnatomy(){
        if (typeof this.anatomyParams !== "undefined"){
            let appData = (yield new AlgebraicEffect("GET APPLICATOR DATA")) ?? {};
            Object.keys(appData).forEach((param) => {
                if (Object.hasOwn(this.anatomyParams, param)){
                    this.anatomyParams[param] = appData[param];
                }
            });
            this.applicatorAnatomy = getAnatomy(
                this.anatomyView + this.anatomyApplicator,
                this.anatomyParams,
                cloneObj(anatomyData)
            );
            this.rescaleAnatomy();
        }
    }
    rescaleAnatomy(){
        if (typeof this.anatomyParams !== "undefined"){
            this.scaledAnatomy = scaleAnatomy(
                this.graphToScreenPos({x: 0, y: 0}),
                this.unit().width / 10,
                this.unit().height / 10,
                this.applicatorAnatomy
            );
        }
    }
    overlayAnatomy(){
        if (typeof this.anatomyParams !== "undefined"){
            ctx.save();

            let clippingRegion = new Path2D();
            const cornerRounding = Math.min(this.graphDimensions.width / 2, this.graphDimensions.height / 2);
            clippingRegion.roundRect(
                this.graphDimensions.x,
                this.graphDimensions.y,
                this.graphDimensions.width,
                this.graphDimensions.height,
                Array.isArray(this.cornerRounding) ?
                    this.cornerRounding.map((corner) => corner * cornerRounding)
                :
                    this.cornerRounding * cornerRounding
            );
            ctx.clip(clippingRegion);

            drawAnatomy(this.scaledAnatomy);

            ctx.restore();
        }
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
            this.refpoints
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

        let defaultDose = [];
        for (let i = 0; i < this.yTicks.length; i++){
            defaultDose.push(
                new Array(this.xTicks.length).fill(0)
            );
        }

        const currGraphState = this.getGraphState();

        let dose = this.seeds.reduce((totalDose, seed) => {
            if (!seed.enabled || (seed.dwellTime == 0)){return totalDose;}
            let dose = [];
            let seedString = this.getSeedState(seed);
            if ((this.cachedDose.has(seedString)) && (this.cachedDose.get(seedString).graphState === currGraphState)){
                // this seed has been cached
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

                // the graph state has not changed since the seed has been cached
                let cachedDoseData = cachedDose.dose;
                for (let i = 0; i < this.yTicks.length; i++){
                    for (let j = 0; j < this.xTicks.length; j++){
                        totalDose[i][j] += cachedDoseData[i][j] * doseScaleFactor;
                    }
                }
                usedCaches.set(seedString, true);
                return totalDose;
            }

            // if the cache was not use, perpare to add the calculated dose as a cache entry
            let doseCache = {
                graphState: currGraphState,
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
        }, defaultDose);

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
    refreshGraph(){
        Object.assign(this.isolineGraph, {
            xTicks: this.xTicks,
            yTicks: this.yTicks,
            isolines: this.isolines,
            colors: this.isolineColors,
            dimensions: {
                x: this.x + this.width * 0.1,
                y: this.y + this.height * 0.1,
                width: this.width * 0.8,
                height: this.height * 0.8
            }
        });

        this.isolineGraph.data = this.getIsodose(this.refpoints[0]);
        this.isolineGraph.refreshPath();

        this.graphDimensions = this.isolineGraph.dimensions;
    }
    drawGraph(){
        // setup constants and ctx
        ctx.textAlign = "center";
        ctx.fillStyle = colorPalette.accent;
        ctx.textBaseline = "middle";
        ctx.lineWidth = Math.min(canvas.width, canvas.height) * 0.001;
        const maxXTick = Math.floor(getMax(this.xTicks));
        const minXTick = Math.ceil(getMin(this.xTicks));
        const maxYTick = Math.floor(getMax(this.yTicks));
        const minYTick = Math.ceil(getMin(this.yTicks));

        ctx.save();

        // make the boarder a clipping path
        let boarder = new Path2D();
        const cornerRounding = Math.min(this.graphDimensions.width / 2, this.graphDimensions.height / 2);
        boarder.roundRect(
            this.graphDimensions.x,
            this.graphDimensions.y,
            this.graphDimensions.width,
            this.graphDimensions.height,
            Array.isArray(this.cornerRounding) ?
                this.cornerRounding.map((corner) => corner * cornerRounding)
            :
                this.cornerRounding * cornerRounding
        );
        ctx.clip(boarder);

        // draw vertical gridlines
        for (let i = minXTick; i <= maxXTick; i++){
            let gridlineX = this.graphToScreenPos({x: i, y: 0}).x;
            ctx.strokeStyle = (i == 0) ? colorPalette.accent : colorPalette.grey;
            ctx.beginPath();
            ctx.moveTo(gridlineX, this.graphDimensions.y);
            ctx.lineTo(gridlineX, this.graphDimensions.y + this.graphDimensions.height);
            ctx.stroke();
        }

        // draw horizontal gridlines
        for (let i = minYTick; i <= maxYTick; i++){
            let gridlineY = this.graphToScreenPos({x: 0, y: i}).y;
            ctx.strokeStyle = (i == 0) ? colorPalette.accent : colorPalette.grey;
            ctx.beginPath();
            ctx.moveTo(this.graphDimensions.x, gridlineY);
            ctx.lineTo(this.graphDimensions.x + this.graphDimensions.width, gridlineY);
            ctx.stroke();
        }

        // draw the isoline graph
        this.isolineGraph.draw();

        ctx.restore();

        // draw boarder
        ctx.lineWidth = Math.min(canvas.width, canvas.height) * 0.002;
        ctx.strokeStyle = colorPalette.accent;
        ctx.stroke(boarder);

        // get font size
        ctx.font = Math.min(
            // font size for x-axis
            getFontSize(
                this.graphDimensions.width / (maxXTick - minXTick),
                this.graphDimensions.height * 0.05,
                ((maxXTick.toString().length > minXTick.toString().length) ?
                    maxXTick.toString()
                :
                    minXTick.toString()),
                (size) => `${size}px Arial`
            ),
            //font size for y-axis
            getFontSize(
                this.graphDimensions.width * 0.05,
                this.graphDimensions.height / (maxYTick - minYTick),
                ((maxYTick.toString().length > minYTick.toString().length) ?
                    maxYTick.toString()
                :
                    minYTick.toString()),
                (size) => `${size}px Arial`
            )
        ) * 0.5 + "px Arial";

        // draw vertical labels
        for (let i = minXTick; i <= maxXTick; i++){
            let gridlineX = this.graphToScreenPos({x: i, y: 0}).x;
            ctx.fillText(i, gridlineX, this.y + this.height * 0.925);
        }

        ctx.fillText(
            this.scale,
            this.graphDimensions.x + this.graphDimensions.width / 2,
            this.graphDimensions.y + this.graphDimensions.height * 1.075
        );

        // draw horizontal labels
        ctx.textAlign = "end";
        for (let i = minYTick; i <= maxYTick; i++){
            let gridlineY = this.graphToScreenPos({x: 0, y: i}).y;
            ctx.fillText(i, this.x + this.width * 0.075, gridlineY);
        }

        // draw isoline legend
        ctx.textAlign = "center";
        ctx.lineWidth = Math.min(canvas.width, canvas.height) * 0.003;
        let boundingBoxMetrics = ctx.measureText("█"); //█ takes uo the entire bounding box
        let elmSpacing = clamp(
            this.graphDimensions.height / (this.isolines.length - 1),
            0,
            1.5 * (boundingBoxMetrics.actualBoundingBoxAscent + boundingBoxMetrics.actualBoundingBoxDescent)
        );

        this.isolines.forEach((isoline, ind) => {
            let metrics = ctx.measureText(isoline);
            const textY = this.graphDimensions.y + ind * elmSpacing;
            const upperLineY = textY - metrics.actualBoundingBoxAscent - ctx.lineWidth;
            const lowerLineY = textY + metrics.actualBoundingBoxDescent + ctx.lineWidth;

            ctx.strokeStyle = this.isolineColors[ind];
            // draw lower line
            ctx.beginPath();
            ctx.moveTo(this.x + this.width * 0.92, lowerLineY);
            ctx.lineTo(this.x + this.width * 0.98, lowerLineY);
            ctx.stroke();

            // draw upper line
            ctx.beginPath();
            ctx.moveTo(this.x + this.width * 0.92, upperLineY);
            ctx.lineTo(this.x + this.width * 0.98, upperLineY);
            ctx.stroke();

            // draw text
            ctx.beginPath();
            ctx.fillText(isoline + "%", this.x + this.width * 0.95, textY);
        });

        ctx.save();
        ctx.textAlign = "center";
        ctx.rotate(-Math.PI / 2);
        
        ctx.beginPath();
        ctx.fillText(
            this.scale,
            -this.y - this.height / 2,
            this.x + this.width * 0.04
        );
        ctx.restore();

        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
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
            let screenPos = this.graphToScreenPos(this.perspective(this.seeds[this.selectedSeed].pos));
            if (this.pointOnGraph(screenPos)){
                ctx.fillStyle = "rgb(169, 255, 103)";
                ctx.beginPath();
                ctx.arc(screenPos.x,screenPos.y,seedRadius,0,2 * Math.PI);
                ctx.fill();
            }
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

            ctx.fillStyle = colorPalette.primary;
            ctx.font = getFontSize(boundingBox.width, boundingBox.height, doseAtMouse, (size) => `${size}px Arial`) + "px Arial";
            let metrics = ctx.measureText(doseAtMouse);
            let labelTextWidth = metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft;
            let labelTextHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
            ctx.fillRect(boundingBox.x,boundingBox.y - labelTextHeight,labelTextWidth,labelTextHeight);
            
            ctx.fillStyle = colorPalette.accent;
            ctx.textBaseline = "bottom";
            ctx.fillText(doseAtMouse,boundingBox.x,boundingBox.y);
            ctx.textBaseline = "alphabetic";
        }
    }
}