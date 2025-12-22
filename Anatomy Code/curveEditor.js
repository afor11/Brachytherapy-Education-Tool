let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
const img = document.getElementById("image");


// ## to change the image being replicated, change the src of the image element
// ## in the html, and these params

const viewName = "axialView (Tandem + Ovoids)";
const maxUndos = 100;
let paramSet = {
    tandemLength: [20, 60],
    tandemAngle: [30, 90],
    ovoidSize: [20, 35]
};

/*
x = go to next block
z = go to last block
p = log json save data
n = new block
c = toggle editing block colors
q =
| * increment hue while editing colors
| * toggle control points
a =
| * decrement hue while editing colors
| * move origin left when setting origin or loading curves
| * finish drawing view and move to next
w =
| * grow block line width
| * move origin up when setting origin or loading curves
| * increment saturation while editing colors
s =
| * shrink block line width
| * move origin down when setting origin or loading curves
| * decrement saturation while editing colors
e =
| * change lightness while editing colors
| * expand loaded curves
d =
| * decrement lightness while editing colors
| * add curve to unfinished block
| * move origin right when setting origin or loading curves
r =
| * change alpha while editing colors
| * shrink loaded curves
f =
| * decrement alpha while editing colors
| * add last curve to block
| * move param editing one to the left when loading
h = move param editing one to the right when loading
t = increment param editing when loading
T = increment param editing by 1/64 when loading
g = decrement param editing when loading
G = decrement param editing by 1/64 when loading
v = toggle curves
b = toggle picture
< = undo
> = redo
k = delete block
y = split curve
m = add new tape measure
i/I = rotate block counter clockwise
u/U = rotate block clockwise
=/+: move block up
]/}: move block down
[/{: move block left
\\/|: move block right
load(loadString, resetLoadString) = when entered in console, loadString
| will be loaded. If resetLoadString is true then the next time load is
| called, it will just load what was initally loaded into loadString for
| that first call.
=======================================================================
| Note: Ensure params are set properly, meaning there are the same    |
| number of parameters for every set of curves in a given view, and   |
| that all params have matching names. Also ensure that the scale has |
| been measured and the origin has been set before loading.           |
=======================================================================
*/

//don't modify anything below here unless you know what you're doing

// look through the param set and take the n-fold cartesian product of all
// valid parameter values to generate a set of parameters the user can go
// between using "n" (use the first element as the inital value of "params")
let defaultParams = [];
let paramSetLoop = [];
let paramSetInd = 0;
for (let i = 0; i < Object.keys(paramSet).length; i++){
    paramSetLoop.push(0);
}
while (
    paramSetLoop[paramSetLoop.length - 1]
    < Object.values(paramSet)[paramSetLoop.length - 1].length
){
    defaultParams.push(
        paramSetLoop.reduce((obj,num,keyInd) => {
            obj[Object.keys(paramSet)[keyInd]] = Object.values(paramSet)[keyInd][num];
            return obj;
        },
        {})
    );
    paramSetLoop[0]++;
    paramSetLoop.forEach((value,ind) => {
        if ((ind < (paramSetLoop.length - 1)) && (value >= Object.values(paramSet)[ind].length)){
            paramSetLoop[ind] = 0;
            paramSetLoop[ind + 1]++;
        }
    });
}

let params = {...defaultParams[0]};

//setup canvas and variables
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;
ctx.lineCap = "round";
ctx.lineJoin = "bevel";

let mouse = {x: 0, y: 0};
let imageLoaded = false;
let showControlPoints = true;
let showCurves = true;
let showPicture = true;
let viewInd = 0;
let blockEditing = 0;
let paramEditing = 0;
let jsonString = "";

let data = {
    editingMode: "measuringScale",
    measuringPoints: [],
    measuredDistance: "",
    origin: {x: 0, y: 0},
    loadingData: {},
    selectedControlPoint: {curveInd:-1, subcurveID: -1},
    blockFinished: false,
    curveTemp: [],
    jsonData: {},
    tapeMeasures: [],
    addingTapeMeasure: false,
};
// default json data
data.jsonData[viewName] = [
    {
        params: params,
        blocks: [
            {
                name: "",
                blockColor: [0,100,50,0.5],
                outlineThickness: 1,
                outlineColor: [0,0,0,0.5],
                curves: []
            }
        ]
    }
];

let lastDatas = [];
let nextDatas = [];
saveData();

img.addEventListener("load",() => {imageLoaded = true;});
if (img.complete){
    imageLoaded = true;
}

setInterval(tick,50);

class MeasuringTape {
    constructor (firstPoint, ID){
        this.points = [firstPoint];
        this.ID = ID;
    }
    checkClick() {
        let numPointsBefore = this.points.length;
        // clicking on a point removes it from a tape measure
        this.points = this.points.filter((point) =>
            !(getDistance([point.x, point.y],[mouse.x, mouse.y]) < 10 / window.devicePixelRatio)
        );
        if (this.points.length == 0){
            //if the tape measure has no points, delete it
            data.tapeMeasures.splice(this.ID,1);
            return true;
        }
        if (this.points.length == numPointsBefore){
            if (this.points.length < 2){
                //add a point if no points were cliked and the tape measure does not have all its points
                this.points.push({x: mouse.x, y: mouse.y});
                return true;
            }
        }else{
            //removeing a point counts as a fultilled click
            return true;
        }
        return false;
    }
    getMeasurement(){
        if (this.points.length < 2){return 0;}
        return (
            getDistance(
                [this.points[0].x,this.points[0].y],
                [this.points[1].x,this.points[1].y]
            ) * data.measuredDistance / getDistance(
                [data.measuringPoints[0].x,data.measuringPoints[0].y],
                [data.measuringPoints[1].x,data.measuringPoints[1].y]
            )
        );
    }
    getAngle(){
        if (this.points.length < 2){return 0;}
        if (this.points[0].x == this.points[1].x){
            return ((this.points[0].y > this.points[1].y) ? 1 : -1) * Math.PI / 2;
        }
        return Math.atan2(
            this.points[0].y - this.points[1].y, //the y-coordinate subtraction order is flipped since y increases going up, not down
            this.points[1].x - this.points[0].x
        );
    }
    draw(){
        if (this.points.length == 2){
            //draw line
            ctx.strokeStyle = "black";
            ctx.lineWidth = 10 / window.devicePixelRatio;
            ctx.font = (50 / window.devicePixelRatio) + "px Arial";
            ctx.beginPath();
            ctx.moveTo(this.points[0].x,this.points[0].y);
            ctx.lineTo(this.points[1].x,this.points[1].y);
            ctx.stroke();
            
            //draw measurement
            ctx.strokeStyle = "white";
            ctx.strokeText(
                this.getMeasurement().toFixed(3) + "mm",
                lerp(this.points[0].x,this.points[1].x,0.5),
                lerp(this.points[0].y,this.points[1].y,0.5)
            );
            ctx.fillText(
                this.getMeasurement().toFixed(3) + "mm",
                lerp(this.points[0].x,this.points[1].x,0.5),
                lerp(this.points[0].y,this.points[1].y,0.5)
            );

            //draw angle measurement
            ctx.strokeText(
                (this.getAngle() * 180 / Math.PI).toFixed(3) + "deg",
                lerp(this.points[0].x,this.points[1].x,0.5),
                lerp(this.points[0].y,this.points[1].y,0.5) + (50 / window.devicePixelRatio)
            );
            ctx.fillText(
                (this.getAngle() * 180 / Math.PI).toFixed(3) + "deg",
                lerp(this.points[0].x,this.points[1].x,0.5),
                lerp(this.points[0].y,this.points[1].y,0.5) + (50 / window.devicePixelRatio)
            );
        }

        //draw points
        ctx.fillStyle = "black";
        ctx.lineWidth = 3 / window.devicePixelRatio;
        this.points.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x,point.y,10 / window.devicePixelRatio, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        });
    }
}

function drawImage(){
    // if the image is loaded, scale it, then draw it to the canvas
    if (imageLoaded){
        let scale = Math.min(canvas.width / img.width,canvas.height / img.height);
        ctx.drawImage(
            img,
            (canvas.width - (scale * img.width)) / 2,
            (canvas.height - (scale * img.height)) / 2,
            scale * img.width,
            scale * img.height
        );
    }
    
}

function tick(){
    //reset canvas
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if (showPicture){
        drawImage();
    }
    if (showCurves){
        drawCurves();
    }
    if (showControlPoints){
        drawControlPoints(data.jsonData[viewName][viewInd].blocks[blockEditing]);
    }

    if ((data.editingMode === "enteringScale") || (data.editingMode === "measuringScale")){
        ctx.lineWidth = 2 / window.devicePixelRatio;
        ctx.strokeStyle = "black";
        if (data.measuringPoints.length == 2){
            ctx.beginPath();
            ctx.moveTo(data.measuringPoints[0].x,data.measuringPoints[0].y);
            ctx.lineTo(data.measuringPoints[1].x,data.measuringPoints[1].y);
            ctx.stroke();
        }

        ctx.fillStyle = "black";
        ctx.strokeStyle = "white";
        data.measuringPoints.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x,point.y,10 / window.devicePixelRatio,0,7);
            ctx.fill();
            ctx.stroke();
        });
    }

    if ((data.editingMode === "enteringOrigin") || (data.editingMode === "loadingData")){
        ctx.lineWidth = 2 / window.devicePixelRatio;
        ctx.fillStyle = "black";
        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.arc(data.origin.x,data.origin.y,10 / window.devicePixelRatio,0,7);
        ctx.fill();
        ctx.stroke();
    }

    //draw the tape measures
    data.tapeMeasures.forEach((tapeMeasure) => {
        tapeMeasure.draw();
    });

    let drawDefault = true;
    let menuPos = {
        x: window.scrollX,
        y: window.scrollY + (50 / window.devicePixelRatio),
    }
    ctx.fillStyle = "black";
    ctx.font = (50 / window.devicePixelRatio) + "px Arial";
    if (data.editingMode === "enteringScale"){
        ctx.fillText("Distance: " + data.measuredDistance + " mm",menuPos.x,menuPos.y);
        drawDefault = false;
    }
    if (data.editingMode === "enteringName"){
        ctx.fillText("Name: " + data.jsonData[viewName][viewInd].blocks[blockEditing].name,menuPos.x,menuPos.y);
        drawDefault = false;
    }
    if (data.editingMode === "adjustingFillColor"){
        let block = data.jsonData[viewName][viewInd].blocks[blockEditing];
        ctx.fillText("Editing Fill Color: hsla(" + block.blockColor[0] + ", " + block.blockColor[1] + "%, " + block.blockColor[2] + "%, " + block.blockColor[3] + ")",menuPos.x,menuPos.y);
        drawDefault = false;
    }
    if (data.editingMode === "adjustingOutlineColor"){
        let block = data.jsonData[viewName][viewInd].blocks[blockEditing];
        ctx.fillText("Editing Outline Color: hsla(" + block.outlineColor[0] + ", " + block.outlineColor[1] + "%, " + block.outlineColor[2] + "%, " + block.outlineColor[3] + ")",menuPos.x,menuPos.y);
        drawDefault = false;
    }
    if (data.editingMode === "editingCurve"){
        ctx.fillText("Editing Curve " + (data.blockFinished ? "(Block Finished)" : "(Block not Finished)"),menuPos.x,menuPos.y);
        drawDefault = false;
    }
    if (data.editingMode === "loadingData"){
        ctx.fillText("Loading Data (Editing: " + Object.keys(params)[paramEditing] + ")",menuPos.x,menuPos.y);
        drawDefault = false;
    }
    if (drawDefault){
        ctx.fillText(data.editingMode,menuPos.x,menuPos.y);
    }

    //draw parameters
    ctx.fillStyle = "black";
    ctx.strokeStyle = "white";
    ctx.lineWidth =  10 / window.devicePixelRatio;
    ctx.font = (30 / window.devicePixelRatio) + "px Arial";
    let paramYOffset = 1;

    if (data.addingTapeMeasure || ((data.tapeMeasures.length > 0) && (data.tapeMeasures[data.tapeMeasures.length - 1].points.length < 2))){
        ctx.strokeText("(adding tape measure)", menuPos.x, menuPos.y + (40 / window.devicePixelRatio));
        ctx.fillText("(adding tape measure)", menuPos.x, menuPos.y + (40 / window.devicePixelRatio));
        paramYOffset = 2;
    }

    Object.keys(params).forEach((key,ind) => {
        ctx.strokeText(
            key + ": " + params[key],
            menuPos.x + (40 / window.devicePixelRatio),
            menuPos.y + (40 / window.devicePixelRatio) * (ind + paramYOffset)
        );
        ctx.fillText(
            key + ": " + params[key],
            menuPos.x + (40 / window.devicePixelRatio),
            menuPos.y + (40 / window.devicePixelRatio) * (ind + paramYOffset)
        );
    });

    //draw valid actions
    ctx.textAlign = 'right';
    getValidActions().forEach((action,ind) => {
        ctx.strokeText(
            action,
            menuPos.x + (canvas.width * 0.99) / window.devicePixelRatio,
            menuPos.y  + (ind + 1) * (40 / window.devicePixelRatio)
        );
        ctx.fillText(
            action,
            menuPos.x + (canvas.width * 0.99) / window.devicePixelRatio,
            menuPos.y  + (ind + 1) * (40 / window.devicePixelRatio)
        );
    });
    ctx.textAlign = 'left';
}

function getValidActions(){
    let validActions = ["<: undo", ">: redo", "m: new measuring tape"];
    if (data.editingMode === "enteringName"){
        validActions.push("enter name");
        return validActions;
    }
    validActions.push(
        "q: toggle visable points",
        "v: toggle showing curves",
        "b: toggle showing picture"
    );
    if ((data.editingMode === "adjustingFillColor") || (data.editingMode === "adjustingOutlineColor")){
        if (data.editingMode === "adjustingFillColor"){
            validActions.push("c: edit outline color");
        }else{
            validActions.push("c: edit curve");
        }
        validActions.push(
            "q/a: inc/dec hue",
            "w/s: inc/dec saturation",
            "e/d: inc/dec lightness",
            "r/f: inc/dec alpha",
        );
        return validActions;
    }
    if ((data.editingMode === "enteringOrigin") || (data.editingMode === "loadingData")){
        if (data.editingMode === "enteringOrigin"){
            validActions.push("Enter: finish editing origin and edit name");
        }else{
            validActions.push("Enter: finish editing origin and edit curve");
        }
        validActions.push(
            "w/ArrowUp: move origin up",
            "s/ArrowDown: move origin down",
            "a/ArrowLeft: move origin left",
            "d/ArrowRight: move origin right",
            "e: expand curves",
            "r: contract curves"
        );
        if (data.editingMode === "loadingData"){
            validActions.push(
                "f: edit next param",
                "h: edit last param",
                "t/T: increment param",
                "g/G: decrement param",
                "n/N: move through given parameter set"
            );
        }
        return validActions;
    }
    if ((data.editingMode === "editingCurve") && data.blockFinished){
        validActions.push(
            "a: finish drawing",
            "y: split curve",
            "z: to to last block",
            "x: go to next block",
            "t: vertically stretch block",
            "g: vertically compress block",
            "h: horizontally stretch block",
            "f: horizontally compress block",
            "u/U: rotate block left",
            "i/I: rotate block right",
            "=/+: move block up",
            "]/}: move block down",
            "[/{: move block left",
            "\\/|: move block right",
        );
    }
    if (data.editingMode === "enteringScale"){
        validActions.push("enter scale (must be a number)");
        return validActions;
    }
    if (data.blockFinished){
        validActions.push(
            "c: adjust fill color"
        );
    }else{
        validActions.push(
            "d: add curve",
            "f: add end of block curve"
        );
    }
    validActions.push(
        "n: new block",
        "w/s: inc/dec line thickness",
        "p: save and print save string",
        "k: delete block"
    );
    return validActions;
}

function saveData(){
    lastDatas.push(cloneObj(data));
    if (lastDatas.length > maxUndos){
        lastDatas = lastDatas.splice(1);
    }
    nextDatas = [];
}

function drawCurves(){
    data.jsonData[viewName][viewInd].blocks.forEach((block) => {
        ctx.fillStyle = "hsla(" + block.blockColor[0] + ", " + block.blockColor[1] + "%, " + block.blockColor[2] + "%, " + block.blockColor[3] + ")";
        ctx.strokeStyle = "hsla(" + block.outlineColor[0] + ", " + block.outlineColor[1] + "%, " + block.outlineColor[2] + "%, " + block.outlineColor[3] + ")";
        ctx.lineWidth = block.outlineThickness;
        ctx.beginPath();
        block.curves.forEach((curve,ind) => {
            if (ind == 0){
                ctx.moveTo(curve.x1,curve.y1);
            }
            ctx.bezierCurveTo(curve.x2,curve.y2,curve.x3,curve.y3,curve.x4,curve.y4);
        });
        ctx.fill();
        ctx.stroke();
    });
}

function drawControlPoints(block){
    ctx.fillStyle = "black";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2 / window.devicePixelRatio;
    block.curves.forEach((curve) => {
        [
            {x: curve.x1,y: curve.y1},
            {x: curve.x2,y: curve.y2},
            {x: curve.x3,y: curve.y3},
            {x: curve.x4,y: curve.y4}
        ].forEach((controlPoint) => {
            if (data.editingMode === "selectingSplit"){
                ctx.beginPath();
                ctx.arc(evalSpline(curve,0.5).x,evalSpline(curve,0.5).y,10 / window.devicePixelRatio,0,7);
                ctx.fill();
                ctx.stroke();
            }else{
                ctx.beginPath();
                ctx.arc(controlPoint.x,controlPoint.y,10 / window.devicePixelRatio,0,7);
                ctx.fill();
                ctx.stroke();
            }
        });
    });
    if (data.curveTemp.length > 0){
        for (let i = 0; i < data.curveTemp.length; i += 2){
            ctx.beginPath();
            ctx.arc(data.curveTemp[i],data.curveTemp[i + 1],10 / window.devicePixelRatio,0,7);
            ctx.fill();
            ctx.stroke();
        }
    }
}

function load(json,resetJson){
    if (!["enteringOrigin","enteringScale","measuringScale"].includes(data.editingMode)){
        saveData();
        if (resetJson){
            jsonString = json;
            data.loadingData = JSON.parse(json);
        }else{
            data.loadingData = JSON.parse(jsonString);
        }
        viewInd = data.loadingData[viewName].findIndex((point) => // find a point with the same param values
            Object.keys(point.params).reduce((paramsEqual,param) => 
                paramsEqual && (params[param] == point.params[param])
            ,true)
        );
        if (viewInd == -1){ // add a new view if the view with desired params does not exist
            let targetPoint = {
                params: params,
                blocks: [
                    {
                        name: "",
                        blockColor: [0,100,50,0.5],
                        outlineThickness: 1,
                        outlineColor: [0,0,0,0.5],
                        curves: []
                    }
                ]
            };
            data.loadingData[viewName].push(
                {
                    params: targetPoint.params,
                    blocks: lerpParametrizedCurves(targetPoint, cloneObj(data.loadingData[viewName]))
                }
            );
            viewInd = data.loadingData[viewName].length - 1;
        }
        blockEditing = 0;
        data.editingMode = "loadingData";
        scaleData();
    }
}
function getSaveString(){
    let scaledJson = cloneObj(data.jsonData);
    let scaleFactor = getDistance(
        [data.measuringPoints[0].x,data.measuringPoints[0].y],
        [data.measuringPoints[1].x,data.measuringPoints[1].y]
    ) / data.measuredDistance;
    scaledJson[viewName].forEach((point) => {
        point.blocks.forEach((block) => {
            block.outlineThickness = block.outlineThickness / scaleFactor;
            block.curves.forEach((curve) => {
                for (let i = 1; i < 5; i++){
                    curve["x" + i] = (curve["x" + i] - data.origin.x) / scaleFactor;
                    curve["y" + i] = (curve["y" + i] - data.origin.y) / scaleFactor;
                }
            });
        });
    });
    return JSON.stringify(scaledJson);
}
function scaleData(){
    if (typeof data.loadingData[viewName] != "undefined"){
        let scaledCurves = cloneObj(data.loadingData);
        let scaleFactor = getDistance(
            [data.measuringPoints[0].x,data.measuringPoints[0].y],
            [data.measuringPoints[1].x,data.measuringPoints[1].y]
        ) / data.measuredDistance;
        scaledCurves[viewName].forEach((point) => {
            point.blocks.forEach((block) => {
                block.outlineThickness = block.outlineThickness * scaleFactor;
                block.curves.forEach((curve) => {
                    for (let i = 1; i < 5; i++){
                        curve["x" + i] = (curve["x" + i] * scaleFactor) + data.origin.x;
                        curve["y" + i] = (curve["y" + i] * scaleFactor) + data.origin.y;
                    }
                });
            });
        });
        data.jsonData = scaledCurves;
    }
}
function cloneObj(obj){
    return JSON.parse(JSON.stringify(obj));
}

document.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX + window.scrollX;
    mouse.y = e.clientY + window.scrollY;
    if ((data.editingMode === "editingCurve") && (data.selectedControlPoint.curveInd != -1)){
        let curves = data.jsonData[viewName][viewInd].blocks[blockEditing].curves;
        let curve = curves[data.selectedControlPoint.curveInd]; // look at the selected curve
        if ((data.selectedControlPoint.subcurveID == 0) && (data.blockFinished || (data.selectedControlPoint.curveInd > 0))){
            let previousCurve = curves[(data.selectedControlPoint.curveInd - 1) % curves.length]; // look at the curve before the selected one
            previousCurve.x4 = mouse.x;
            previousCurve.y4 = mouse.y;
        }
        if ((data.selectedControlPoint.subcurveID == 3) && (data.blockFinished || (data.selectedControlPoint.curveInd < (curves.length - 1)))){
            let nextCurve = curves[(data.selectedControlPoint.curveInd + 1) % curves.length]; // look at the curve before the selected one
            nextCurve.x1 = mouse.x;
            nextCurve.y1 = mouse.y;
        }
        curve["x" + (data.selectedControlPoint.subcurveID + 1)] = mouse.x;
        curve["y" + (data.selectedControlPoint.subcurveID + 1)] = mouse.y;
    }
});
document.addEventListener("keydown", (e) => {
    if (e.key === "m"){
        saveData();
        data.addingTapeMeasure = true;
        return;
    }
    if (data.editingMode === "enteringName"){
        if ((e.key === "Backspace") && (data.jsonData[viewName][viewInd].blocks[blockEditing].name.length > 0)){
            data.jsonData[viewName][viewInd].blocks[blockEditing].name = data.jsonData[viewName][viewInd].blocks[blockEditing].name.slice(0,-1);
            return;
        }
        if (e.key === "Enter"){
            saveData();
            data.editingMode = "addingCurve";
            return;
        }
        if (e.key === "Shift"){
            return;
        }
        if (!["<",">"].includes(e.key)){
            data.jsonData[viewName][viewInd].blocks[blockEditing].name += e.key;
            return;
        }
    }
    if (data.editingMode === "adjustingFillColor"){
        if (e.key === "c"){
            saveData();
            data.editingMode = "adjustingOutlineColor";
            return;
        }
        if ("qawsed".includes(e.key)){
            data.jsonData[viewName][viewInd].blocks[blockEditing].blockColor[Math.floor("aqswde".indexOf(e.key) / 2)] += 4 * (Math.floor("aqswde".indexOf(e.key)) % 2) - 2;
            clampEditingColors();
            return;
        }
        if (e.key === "r"){
            data.jsonData[viewName][viewInd].blocks[blockEditing].blockColor[3] += 0.05;
            clampEditingColors();
            return;
        }
        if (e.key === "f"){
            data.jsonData[viewName][viewInd].blocks[blockEditing].blockColor[3] -= 0.05;
            clampEditingColors();
            return;
        }
    }
    if (data.editingMode === "adjustingOutlineColor"){
        if (e.key === "c"){
            saveData();
            data.editingMode = "editingCurve";
            return;
        }
        if ("qawsed".includes(e.key)){
            data.jsonData[viewName][viewInd].blocks[blockEditing].outlineColor[Math.floor("aqswde".indexOf(e.key) / 2)] += 4 * (Math.floor("aqswde".indexOf(e.key)) % 2) - 2;
            clampEditingColors();
            return;
        }
        if (e.key === "r"){
            data.jsonData[viewName][viewInd].blocks[blockEditing].outlineColor[3] += 0.05;
            clampEditingColors();
            return;
        }
        if (e.key === "f"){
            data.jsonData[viewName][viewInd].blocks[blockEditing].outlineColor[3] -= 0.05;
            clampEditingColors();
            return;
        }
    }
    if (e.key === "q"){
        showControlPoints = !showControlPoints;
        return;
    }
    if (e.key === "v"){
        showCurves = !showCurves;
        return;
    }
    if (e.key === "b"){
        showPicture = !showPicture;
        return;
    }
    if ((data.editingMode === "enteringOrigin") || (data.editingMode === "loadingData")){
        if (e.key === "Enter"){
            if (data.editingMode === "enteringOrigin"){
                saveData();
                data.editingMode = "enteringName";
            }else{
                saveData();
                data.editingMode = "editingCurve";
                data.blockFinished = true;
            }
        }
        if ((e.key === "w") || (e.key === "ArrowUp")){
            data.origin.y--;
            scaleData();
        }
        if ((e.key === "s") || (e.key === "ArrowDown")){
            data.origin.y++;
            scaleData();
        }
        if ((e.key === "a") || (e.key === "ArrowLeft")){
            data.origin.x--;
            scaleData();
        }
        if ((e.key === "d") || (e.key === "ArrowRight")){
            data.origin.x++;
            scaleData();
        }
        if (e.key === "e"){
            data.measuredDistance -= 0.1;
            scaleData();
        }
        if (e.key === "r"){
            data.measuredDistance += 0.1;
            scaleData();
        }
        if (data.editingMode === "loadingData"){
            if (e.key === "f"){
                paramEditing = clamp(paramEditing - 1, 0, Object.keys(params).length - 1);
            }
            if (e.key === "h"){
                paramEditing = clamp(paramEditing + 1, 0, Object.keys(params).length - 1);
            }
            if ("tTgG".includes(e.key)){
                params[Object.keys(params)[paramEditing]] += [1,0.015625,-1,-0.015625]["tTgG".indexOf(e.key)];
                load(jsonString,false);
            }
            if (e.key === "n"){
                paramSetInd = Math.max(paramSetInd + 1, 0)
                params = {...defaultParams[paramSetInd]};
                load(jsonString,false);
            }
            if (e.key === "N"){
                paramSetInd = Math.min(paramSetInd - 1, defaultParams.length - 1)
                params = {...defaultParams[paramSetInd]};
                load(jsonString,false);
            }
        }
        if ((e.key != "<") && (e.key != ">")){
            return;
        }
    }
    if ((data.editingMode === "editingCurve") && data.blockFinished){
        if (e.key === "a"){
            saveData();
            load(getSaveString(),true);
            return;
        }
        if (e.key === "y"){
            data.editingMode = "selectingSplit";
            return;
        }
        if (e.key === "z"){
            saveData();
            blockEditing = Math.max(blockEditing - 1, 0);
        }
        if (e.key === "x"){
            saveData();
            blockEditing = Math.min(blockEditing + 1, data.jsonData[viewName][viewInd].blocks.length - 1);
        }
        if ("tfgh".includes(e.key)){
            saveData();
            let yScale = 0;
            let xScale = 0;
            if (e.key === "t"){yScale = 0.1;}
            if (e.key === "g"){yScale = -0.1;}
            if (e.key === "f"){xScale = -0.1;}
            if (e.key === "h"){xScale = 0.1;}
            data.jsonData[viewName][viewInd].blocks[blockEditing].curves.forEach((curve) => {
                for (let i = 1; i < 5; i++){
                    curve["x" + i] += (curve["x" + i] - mouse.x) * xScale;
                    curve["y" + i] += (curve["y" + i] - mouse.y) * yScale;
                }
            });
        }
        if ("uUiI".includes(e.key)){
            saveData();
            let dAngle = [0.2,0.1,-0.2,-0.1]["uUiI".indexOf(e.key)];
            data.jsonData[viewName][viewInd].blocks[blockEditing].curves.forEach((curve) => {
                for (let i = 1; i < 5; i++){
                    let x = (curve["x" + i] - mouse.x);
                    let y = (curve["y" + i] - mouse.y);
                    curve["x" + i] = x * Math.cos(dAngle) - y * Math.sin(dAngle) + mouse.x;
                    curve["y" + i] = x * Math.sin(dAngle) + y * Math.cos(dAngle) + mouse.y;
                }
            });
        }
        if ("=+[{]}\\|".includes(e.key)){
            saveData();
            let xOffset = 0;
            let yOffset = 0;
            if (e.key === "]"){yOffset = 10;}
            if (e.key === "}"){yOffset = 1;}
            if (e.key === "="){yOffset = -10;}
            if (e.key === "+"){yOffset = -1;}
            if (e.key === "\\"){xOffset = 10;}
            if (e.key === "|"){xOffset = 1;}
            if (e.key === "["){xOffset = -10;}
            if (e.key === "{"){xOffset = -1;}
            data.jsonData[viewName][viewInd].blocks[blockEditing].curves.forEach((curve) => {
                for (let i = 1; i < 5; i++){
                    curve["x" + i] += xOffset;
                    curve["y" + i] += yOffset;
                }
            });
        }
    }
    if (data.editingMode === "enteringScale"){
        if ((e.key === "Backspace") && (data.measuredDistance.length > 0)){
            data.measuredDistance = data.measuredDistance.slice(0,-1);
            return;
        }
        if (e.key === "Enter"){
            saveData();
            data.measuredDistance = parseInt(data.measuredDistance);
            data.editingMode = "enteringOrigin";
            return;
        }
        if ("0123456789.".includes(e.key)){
            data.measuredDistance += e.key;
            return;
        }
    }
    if ((e.key === "c") && data.blockFinished){
        saveData();
        data.editingMode = "adjustingFillColor";
        return;
    }
    if (e.key === "n"){ // new block
        saveData();
        data.blockFinished = false;
        data.editingMode = "enteringName";
        data.jsonData[viewName][viewInd].blocks.push({
            name: "",
            blockColor: [0,100,50,0.5],
            outlineThickness: 1,
            outlineColor: [0,0,0,0.5],
            curves: []
        });
        blockEditing = data.jsonData[viewName][viewInd].blocks.length - 1;
        return;
    }
    if ((e.key === "<") && (lastDatas.length > 0)){ //undo
        nextDatas.unshift(cloneObj(data));
        data = cloneObj(lastDatas[lastDatas.length - 1]);
        lastDatas.splice(lastDatas.length - 1);
        blockEditing = data.jsonData[viewName][viewInd].blocks.length - 1;
        return;
    }
    if ((e.key === ">") && (nextDatas.length > 0)){ //redo
        let lastData = cloneObj(data);
        data = cloneObj(nextDatas[0]);
        nextDatas = nextDatas.splice(1);
        lastDatas.push(lastData);
        if (lastDatas.length > maxUndos){
            lastDatas = lastDatas.splice(1);
        }
        blockEditing = data.jsonData[viewName][viewInd].blocks.length - 1;
        return;
    }
    if (e.key === "w"){ //increment line thickness
        saveData();
        data.jsonData[viewName][viewInd].blocks[blockEditing].outlineThickness++;
        return;
    }
    if (e.key === "s"){ //decrement line thickness
        saveData();
        data.jsonData[viewName][viewInd].blocks[blockEditing].outlineThickness =
            Math.max(
                data.jsonData[viewName][viewInd].blocks[blockEditing].outlineThickness - 1,
                0
            );
        return;
    }
    if ((e.key === "d") && !data.blockFinished){ // add curve
        data.editingMode = "addingCurve";
        return;
    }
    if ((e.key === "f") && !data.blockFinished){ // connect to end of block
        data.editingMode = "finishingBlock";
        return;
    }
    if (e.key === "k"){ //delete block
        saveData();
        data.jsonData[viewName][viewInd].blocks.splice(blockEditing,1);
        blockEditing = Math.max(blockEditing - 1, 0);
        return;
    }
    if (e.key === "p"){ //save
        console.log(getSaveString());
        return;
    }
});
document.addEventListener("click", (e) => {
    if (data.addingTapeMeasure){
        data.tapeMeasures.push(
            new MeasuringTape({x: mouse.x, y: mouse.y},data.tapeMeasures.length)
        );
        data.addingTapeMeasure = false;
        return;
    }
    for (let i = 0; i < data.tapeMeasures.length; i++){
        if (data.tapeMeasures[i].checkClick()){
            return;
        }
    }
    if ((data.editingMode === "addingCurve") || (data.editingMode === "finishingBlock")){
        saveData();
        data.curveTemp.push(mouse.x);
        data.curveTemp.push(mouse.y);
        let connectToLast = data.jsonData[viewName][viewInd].blocks[blockEditing].curves.length > 0;
        if (data.curveTemp.length == (
            connectToLast ?
                ((data.editingMode === "finishingBlock") ? 4 : 6)
            :
                ((data.editingMode === "finishingBlock") ? 6 : 8)
        )){
            let newCurve;
            let curves = data.jsonData[viewName][viewInd].blocks[blockEditing].curves;
            if (connectToLast){
                newCurve = {
                    x1: curves[curves.length - 1].x4,
                    y1: curves[curves.length - 1].y4,
                    x2: data.curveTemp[0],
                    y2: data.curveTemp[1],
                    x3: data.curveTemp[2],
                    y3: data.curveTemp[3],
                    x4: ((data.editingMode === "finishingBlock") ? curves[0].x1 : data.curveTemp[4]),
                    y4: ((data.editingMode === "finishingBlock") ? curves[0].y1 : data.curveTemp[5]),
                };
            }else{
                newCurve = {
                    x1: data.curveTemp[0],
                    y1: data.curveTemp[1],
                    x2: data.curveTemp[2],
                    y2: data.curveTemp[3],
                    x3: data.curveTemp[4],
                    y3: data.curveTemp[5],
                    x4: ((data.editingMode === "finishingBlock") ? curves[0].x1 : data.curveTemp[6]),
                    y4: ((data.editingMode === "finishingBlock") ? curves[0].y1 : data.curveTemp[7]),
                };
            }
            
            curves.push(newCurve);
            data.curveTemp = [];

            if (data.editingMode === "finishingBlock"){
                data.blockFinished = true;
            }

            data.editingMode = "editingCurve";
        }
        return;
    }
    if (data.editingMode === "editingCurve"){
        saveData();
        if (data.selectedControlPoint.curveInd != -1){
            data.selectedControlPoint = {
                curveInd: -1,
                subcurveID: -1,
            };
            return; //deselect control point when a control point is selected, the mouse is clicked
        }
        data.jsonData[viewName][viewInd].blocks[blockEditing].curves.forEach((curve,curveInd) => {
            [
                {x: curve.x1,y: curve.y1},
                {x: curve.x2,y: curve.y2},
                {x: curve.x3,y: curve.y3},
                {x: curve.x4,y: curve.y4}
            ].forEach((controlPoint,subcurveID) => {
                if (getDistance([mouse.x,mouse.y],[controlPoint.x, controlPoint.y]) < 10 / window.devicePixelRatio){
                    data.selectedControlPoint = {
                        curveInd: curveInd,
                        subcurveID: subcurveID,
                    }
                }
            });
        });
        return;
    }
    if (data.editingMode === "selectingSplit"){
        let splitInd = -1;
        let curveToSplit;
        data.jsonData[viewName][viewInd].blocks[blockEditing].curves.forEach((curve, curveInd) => {
            if (getDistance(
                [evalSpline(curve,0.5).x, evalSpline(curve,0.5).y],
                [mouse.x,mouse.y]
            ) < 10 / window.devicePixelRatio){
                splitInd = curveInd;
                curveToSplit = curve;
            }
        });
        if (splitInd != -1){
            saveData();
            data.jsonData[viewName][viewInd].blocks[blockEditing].curves.splice(
                splitInd, 1,
                splitCurve(curveToSplit,0,0.5),
                splitCurve(curveToSplit,0.5,1)
            );
            data.editingMode = "editingCurve";
            return;
        }
    }
    if (data.editingMode === "measuringScale"){
        saveData();
        data.measuringPoints.push({x: mouse.x, y: mouse.y});
        if (data.measuringPoints.length == 2){
            data.editingMode = "enteringScale";
        }
        return;
    }
    if ((data.editingMode === "enteringOrigin") || (data.editingMode === "loadingData")){
        saveData();
        data.origin = {...{x: mouse.x, y: mouse.y}};
        scaleData();
        return;
    }
});

function clampEditingColors(){
    data.jsonData[viewName][viewInd].blocks[blockEditing].blockColor.forEach((color,ind) => {
        data.jsonData[viewName][viewInd].blocks[blockEditing].blockColor[ind] = clamp(color, [0,0,0,0][ind] , [360,100,100,1][ind]);
        data.jsonData[viewName][viewInd].blocks[blockEditing].blockColor[ind] = Math.round(data.jsonData[viewName][viewInd].blocks[blockEditing].blockColor[ind] * 100) / 100;
    });
    data.jsonData[viewName][viewInd].blocks[blockEditing].outlineColor.forEach((color,ind) => {
        data.jsonData[viewName][viewInd].blocks[blockEditing].outlineColor[ind] = clamp(color, [0,0,0,0][ind] , [360,100,100,1][ind]);
        data.jsonData[viewName][viewInd].blocks[blockEditing].outlineColor[ind] = Math.round(data.jsonData[viewName][viewInd].blocks[blockEditing].outlineColor[ind] * 100) / 100;
    });
}

function clamp(val, min, max){
    return Math.max(Math.min(val,max),min);
}

function lerp(a, b, t){
    return ((1 - t) * a + t * b);
}

function interpolateCurvePoints(pointA, pointB, lerpCoeff){
    let lerpedBlocks = [];
    pointA.forEach((blockA) => {
        // find the block of the same name in pointB
        let blockB = pointB.find((block) => (block.name === blockA.name));
        if (typeof blockB.name != "undefined"){
            //lerp all perameters from blockA to blockB
            let lerpedBlock = {
                name: blockA.name,
                blockColor: [],
                outlineThickness: 1,
                outlineColor: [],
                curves: []
            };
            for (let i = 0; i < 4; i++){
                lerpedBlock.blockColor.push(
                    lerp(blockA.blockColor[i], blockB.blockColor[i], lerpCoeff)
                );
                lerpedBlock.outlineColor.push(
                    lerp(blockA.outlineColor[i], blockB.outlineColor[i], lerpCoeff)
                );
            }
            lerpedBlock.outlineThickness = lerp(
                blockA.outlineThickness,
                blockB.outlineThickness,
                lerpCoeff
            );

            //make an arrays containing the indicies of the curves that
            //should be lerped between from both arrays https://www.desmos.com/calculator/voquhbkiq0
            let lerpIndsA = [];
            let lerpIndsB = [];
            for (let i = 0; i < Math.max(blockA.curves.length,blockB.curves.length); i++){
                lerpIndsA.push(i % blockA.curves.length);
                lerpIndsB.push(i % blockB.curves.length);
            }
            lerpIndsA.sort((a,b) => a - b);
            lerpIndsB.sort((a,b) => a - b);

            //interpolate curves
            lerpedBlock.curves = [];
            let tStart = 0;
            for (let i = 0; i < lerpIndsA.length; i++){
                //fetch which curve should be split and by how much
                let numSplits;
                let curveA = blockA.curves[lerpIndsA[i]];
                let curveB = blockB.curves[lerpIndsB[i]];
                if (blockA.curves.length > blockB.curves.length){
                    //B block curves have to be split
                    numSplits = lerpIndsB.filter((val) => (val == lerpIndsB[i])).length;
                    curveB = splitCurve(curveB, (tStart / numSplits), ((tStart + 1) / numSplits));
                }else{
                    //A block curves have to be split
                    numSplits = lerpIndsA.filter((val) => (val == lerpIndsA[i])).length;
                    curveA = splitCurve(curveA, (tStart / numSplits), ((tStart + 1) / numSplits));
                }

                //interpolate every component of the two curves and push result
                let curveC = {};
                Object.keys(curveA).forEach((key) => {
                    curveC[key] = lerp(curveA[key], curveB[key], lerpCoeff);
                });
                lerpedBlock.curves.push(curveC);

                //increment the tStart if the last interpolation was also interpolating to a segment of this curve
                if (i < (lerpIndsA.length - 1)){
                    if ((lerpIndsA[i] == lerpIndsA[i + 1]) || (lerpIndsB[i] == lerpIndsB[i + 1])){
                        tStart++;
                    }else{
                        tStart = 0;
                    }
                }
            }
            lerpedBlocks.push(lerpedBlock);
        }
    });
    return lerpedBlocks;
}

function splitCurve(curve, start, end){
    // See functionality here: https://www.desmos.com/calculator/vsivj3zxvh
    if ((start == 0) && (end == 1)){
        return curve;
    }
    let startSplitCurve = {
        x1: evalSpline(curve, start).x,
        y1: evalSpline(curve, start).y,
        x2: lerp(
            lerp(curve.x2, curve.x3, start),
            lerp(curve.x3, curve.x4, start),
            start
        ),
        y2: lerp(
            lerp(curve.y2, curve.y3, start),
            lerp(curve.y3, curve.y4, start),
            start
        ),
        x3: lerp(curve.x3, curve.x4, start),
        y3: lerp(curve.y3, curve.y4, start),
        x4: curve.x4,
        y4: curve.y4
    };
    let adjustedLerp = (end - start) / (1 - start);
    return {
        x1: startSplitCurve.x1,
        y1: startSplitCurve.y1,
        x2: lerp(startSplitCurve.x1, startSplitCurve.x2, adjustedLerp),
        y2: lerp(startSplitCurve.y1, startSplitCurve.y2, adjustedLerp),
        x3: lerp(
            lerp(startSplitCurve.x1, startSplitCurve.x2, adjustedLerp),
            lerp(startSplitCurve.x2, startSplitCurve.x3, adjustedLerp),
            adjustedLerp
        ),
        y3: lerp(
            lerp(startSplitCurve.y1, startSplitCurve.y2, adjustedLerp),
            lerp(startSplitCurve.y2, startSplitCurve.y3, adjustedLerp),
            adjustedLerp
        ),
        x4: evalSpline(startSplitCurve, adjustedLerp).x,
        y4: evalSpline(startSplitCurve, adjustedLerp).y
    };
}

function evalSpline(curve, t){
    return {
        x: lerp(
            lerp(
                lerp(curve.x1, curve.x2, t),
                lerp(curve.x2, curve.x3, t),
            t),
            lerp(
                lerp(curve.x2, curve.x3, t),
                lerp(curve.x3, curve.x4, t),
            t),
        t),
        y: lerp(
            lerp(
                lerp(curve.y1, curve.y2, t),
                lerp(curve.y2, curve.y3, t),
            t),
            lerp(
                lerp(curve.y2, curve.y3, t),
                lerp(curve.y3, curve.y4, t),
            t),
        t)
    };
}

function lerpParametrizedCurves(target, points){
    //get closest points in each quadrant
    let closestPoints = getSurroundingPoints(target, points);

    if (Object.keys(target.params).length == 0){
        return points[0].value;
    }

    // interpolate between points across the 0th component
    let lerpedPoints = [];
    for (let i = 0; i < closestPoints.length; i+=2){
        // points are organized so that consecutive points are all reflected across the same axis
        let pointA = closestPoints[i];
        let pointB = closestPoints[i + 1];

        // check if both points are defined (they may not be if no points exist in either of the quadrants)
        if (!((typeof pointA.pos == "undefined") && (typeof pointB.pos == "undefined"))){
            let interpolation;

            // if one of the points does not exist (due to no points being in that quadrant), set it to the other point
            if (typeof pointA.pos == "undefined"){
                pointA = cloneObj(pointB);
            }
            if (typeof pointB.pos == "undefined"){
                pointB = cloneObj(pointA);
            }

            let targetPos = Object.values(target.params);
            //get coefficent of interpolation
            if (pointA.pos[0] == pointB.pos[0]){
                interpolation = 0;
            }else{
                interpolation = (targetPos[0] - pointA.pos[0]) / (pointB.pos[0] - pointA.pos[0]);
            }
            
            //interpolate all components
            let interpolatedPos = [];
            for (let j = 1; j < pointA.pos.length; j++){
                interpolatedPos.push((1 - interpolation) * pointA.pos[j] + interpolation * pointB.pos[j]);
            }
            
            // interpolate values and push to lerped points array
            lerpedPoints.push({
                pos: interpolatedPos,
                value: interpolateCurvePoints(pointA.value, pointB.value, interpolation)
            });
        }else{
            // if both pointA and pointB have undefined posititons
            // set the result of the interpolation to an empty object
            lerpedPoints.push({});
        }
    }
    let slicedTarget = {
        params:{},
        blocks: target.blocks
    };
    Object.keys(target.params).forEach((param,ind) => {
        if (ind > 0){
            slicedTarget.params[param] = target.params[param];
        }
    });
    return lerpParametrizedCurves(slicedTarget, lerpedPoints);
}
function getSurroundingPoints(target, points){
    // get position of each point from its params, and its value from its blocks
    let encodedTarget = {pos: Object.values(target.params), value: target.blocks};
    let encodedPoints = [];
    if ((typeof points[0].params) != "undefined"){
        // if points are in parameter space format, convert to pos-value pair
        points.forEach((point) => {
            encodedPoints.push({
                pos: Object.values(point.params),
                value: point.blocks
            });
        });
    }else{
        // if points are in the correct format, continue
        encodedPoints = points;
    }

    closestPoints = [];
    // find the closest point in each quadrant
    for (let quadrant = 0; quadrant < Math.pow(2,encodedTarget.pos.length); quadrant++){
        // filter points by which ones have coords whose signs matches the binary representation of the quadrant,
        // a 0 in the binary represenation meaning a negative or zero sign, and a 1 meaning a positive or zero sign
        let pointsInQuadrant = encodedPoints.filter((point) =>
            (typeof point.pos != "undefined") ? //only reduce position components if they are defined
                point.pos.reduce((inQuadrant,curr,coord) => 
                    (
                        inQuadrant &&
                        (
                            ((((1 << coord) & quadrant) > 0) == (Math.sign(curr - encodedTarget.pos[coord]) == 1))
                            || ((curr - encodedTarget.pos[coord]) == 0)
                        )
                    )
                ,true)
            : false
        );

        // get the closest point in the this quadrant
        let closest = pointsInQuadrant.reduce((closest,curr) => {
            if ((closest.distance == -1) || (getDistance(curr.pos,encodedTarget.pos) < closest.distance)){
                return {
                    distance: getDistance(curr.pos,encodedTarget.pos),
                    closestPoint: curr
                };
            }
            return closest;
        },{distance: -1, closestPoint: {}}).closestPoint;

        //push the closest point
        //note that the signs of each component of consecutive terms differ by exactly one sign
        closestPoints.push(closest);
    }
    return closestPoints;
}

function getDistance(a,b){
    return Math.sqrt(
        a.reduce((dist,currentCoord,coordInd) => 
            dist + Math.pow(currentCoord - b[coordInd], 2)
        ,0) // distance of a point is the square root of the sum of the squares of the difference in componenents
    );
}