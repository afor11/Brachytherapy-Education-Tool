import { drawAnatomy } from './interpolateAnatomy.js';
import { anatomyData } from './constants.js';
import { magnitude , cloneObj, getMax, getMin, getFontSize, distance } from './utils.js';

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

export class Graph {
    constructor({x, y, width, height, seeds, xTicks, yTicks, perspective, name, refpoints}){
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
        Plotly.newPlot(div.id, data); //does not update after window rescaling
        let gridElm = div.children[0].children[0].children[0].children[4].children[0].children[3];
        this.graphDimensions = gridElm.getBoundingClientRect();
    }
    drawRefPoints(){
        let size = Math.min(this.graphDimensions.width,this.graphDimensions.height) * 0.01;
        this.refpoints.forEach((refpoint,ind) => {
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
            x: this.graphDimensions.x + ((point.x - getMin(this.xTicks)) / (getMax(this.xTicks) - getMin(this.xTicks))) * this.graphDimensions.width,
            y: this.graphDimensions.y + this.graphDimensions.height - ((point.y - getMin(this.yTicks)) / (getMax(this.yTicks) - getMin(this.yTicks))) * this.graphDimensions.height,
        };
    }
    screenToGraphPos(point){
        return {
            x: getMin(this.xTicks) + ((point.x - this.graphDimensions.x) / this.graphDimensions.width) * (getMax(this.xTicks) - getMin(this.xTicks)),
            y: getMax(this.yTicks) + ((point.y - this.graphDimensions.y) / this.graphDimensions.height) * (getMin(this.yTicks) - getMax(this.yTicks))
        }
    }
    overlayAnatomy(view, params){
        let formattedAnatomy = scaleAnatomyData(this.graphToScreenPos({x: 0, y: 0}), this.graphDimensions.width, (getMax(this.xTicks) - getMin(this.xTicks)));

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
        let seedRadius = Math.min(canvas.width,canvas.height * 0.9) * 0.005;
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
    checkClicked(){
        if (!window.mouse.down){
            this.selectedSeed = -1;
            return false;
        }
        if (this.selectedSeed != -1){
            this.selectedSeed = -1;
            return true
        }

        let closestSeed = this.seeds.reduce((closestSeed, seed, ind) => {
            let seedPos = this.graphToScreenPos(this.perspective(seed.pos));
            let seedDist = distance([mouse.x, mouse.y],[seedPos.x, seedPos.y]);
            if (seedDist < closestSeed.dist){
                return {
                    dist: seedDist,
                    ind: ind
                };
            }
            return closestSeed;
        },{dist: Infinity});

        if (closestSeed.dist < Math.min(canvas.width,canvas.height * 0.9) * 0.005){
            this.selectedSeed = closestSeed.ind;
            return true;
        }

        this.selectedSeed = -1;
        return false;
    }
    drawMouseLabel(){
        if (
            (window.mouse.x > this.graphDimensions.x)
            && (window.mouse.x < this.graphDimensions.x + this.graphDimensions.width)
            && (window.mouse.y > this.graphDimensions.y)
            && (window.mouse.y < this.graphDimensions.y + this.graphDimensions.height)
        ){
            let doseAtMouse = this.getPointDose(this.perspective({...this.screenToGraphPos(window.mouse), z: 0})).toFixed(2) + "Gy";
            let boundingBox = {
                x: window.mouse.x,
                y: window.mouse.y,
                width: this.graphDimensions.width * 0.15,
                height: this.graphDimensions.height * 0.05,
            };

            ctx.fillStyle = "white";
            ctx.font = getFontSize(boundingBox.width, boundingBox.height, doseAtMouse, (size) => `${size}px monospace`) + "px monospace";
            let metrics = ctx.measureText(doseAtMouse);
            let labelTextWidth = metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft;
            ctx.fillRect(boundingBox.x,boundingBox.y - boundingBox.height,labelTextWidth,boundingBox.height);
            
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