let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
const img = document.getElementById("image");


// ## to change the image being replicated, change the src of the image element
// ## in the html, and these params

const viewName = "axialView";
const params = {zSlice: 1};

//don't modify anything below here unless you know what you're doing

ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

let mouse = {x: 0, y: 0};
let imageLoaded = false;
let showControlPoints = true;
let viewInd = 0;
let blockEditing = 0;

let data = {
    editingMode: "measuringScale",
    measuringPoints: [],
    measuredDistance: "",
    origin: {x: 0, y: 0},
    loadingData: {},
    selectedControlPoint: {curveInd:-1, subcurveID: -1},
    blockFinished: false,
    curveTemp: [],
    jsonData: {}
};
// default json data
data.jsonData[viewName] = [
    {
        params: params,
        blocks: [
            {
                curveLerp: [],
                name: "",
                blockColor: "rgba(255, 0, 0, 0.5)",
                outlineThickness: 1,
                outlineColor: "rgba(0, 0, 0, 1)",
                curves: []
            }
        ]
    }
];

let lastDatas = [];
saveData();

img.addEventListener("load",() => {imageLoaded = true;});
if (img.complete){
    imageLoaded = true;
}

setInterval(tick,50);

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

    // draw the image
    drawImage();

    drawCurves();
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

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    if (data.editingMode === "enteringScale"){
        ctx.fillText("Distance: " + data.measuredDistance + " mm",0,20);
    }else{
        if (data.editingMode === "enteringName"){
            ctx.fillText("Name: " + data.jsonData[viewName][viewInd].blocks[blockEditing].name,0,20);
        }else{
            ctx.fillText(data.editingMode,0,20);
        }
    }
}

function saveData(){
    lastDatas.push(cloneObj(data));
    if (lastDatas.length > 50){
        lastDatas.splice(1);
    }
}

function drawCurves(){
    data.jsonData[viewName][viewInd].blocks.forEach((block) => {
        ctx.fillStyle = block.blockColor;
        ctx.strokeStyle = block.outlineColor;
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
            ctx.beginPath();
            ctx.arc(controlPoint.x,controlPoint.y,10 / window.devicePixelRatio,0,7);
            ctx.fill();
            ctx.stroke();
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

function load(json){
    if (!["enteringOrigin","enteringScale","measuringScale"].includes(data.editingMode)){
        data.loadingData = JSON.parse(json);
        viewInd = data.loadingData[viewName].findIndex((point) => // find a point with the same param values
            Object.keys(point).reduce((paramsEqual,param) => 
                paramsEqual && (params[param] == point[param])
            ,true)
        );
        if (viewInd == -1){ // add a new view if the view with desired params does not exist
            let targetPoint = {
                params: params,
                blocks: [
                    {
                        curveLerp: [],
                        name: "",
                        blockColor: "rgba(255, 0, 0, 0.5)",
                        outlineThickness: 1,
                        outlineColor: "rgba(0, 0, 0, 1)",
                        curves: []
                    }
                ]
            };
            let neighbors = getSurroundingPoints(targetPoint, data.loadingData[viewName]);
            console.log(neighbors);
            data.loadingData[viewName].push(targetPoint);
            viewInd = 0;
        }
        blockEditing = 0;
        data.editingMode = "loadingData";
        scaleData();
    }
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
    if (data.editingMode === "enteringName"){
        if ((e.key === "Backspace") && (data.jsonData[viewName][viewInd].blocks[blockEditing].name.length > 0)){
            saveData();
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
        saveData();
        data.jsonData[viewName][viewInd].blocks[blockEditing].name += e.key;
        return;
    }
    if (e.key === "q"){
        showControlPoints = !showControlPoints;
        return;
    }
    if ((data.editingMode === "enteringOrigin") || (data.editingMode === "loadingData")){
        if (e.key === "Enter"){
            if (data.editingMode === "enteringOrigin"){
                data.editingMode = "enteringName";
            }else{
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
        return;
    }
    if ((data.editingMode === "editingCurve") && data.blockFinished){
        if (e.key === "z"){
            saveData();
            blockEditing = Math.min(blockEditing + 1, data.jsonData[viewName][viewInd].blocks.length - 1);
        }
        if (e.key === "x"){
            saveData();
            blockEditing = Math.max(blockEditing - 1, 0);
        }
    }
    if (data.editingMode === "enteringScale"){
        if ((e.key === "Backspace") && (data.measuredDistance.length > 0)){
            saveData();
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
            saveData();
            data.measuredDistance += e.key;
            return;
        }
    }
    if (e.key === "n"){ // new block
        console.log("new block");
        saveData();
        data.blockFinished = false;
        data.editingMode = "enteringName";
        data.jsonData[viewName][viewInd].blocks.push({
            curveLerp: [],
            name: "",
            blockColor: "rgba(255, 0, 0, 0.5)",
            outlineThickness: 1,
            outlineColor: "rgba(0, 0, 0, 1)",
            curves: []
        });
        blockEditing = data.jsonData[viewName][viewInd].blocks.length - 1;
        return;
    }
    if ((e.key === "a") && (lastDatas.length > 0)){ //undo
        data = cloneObj(lastDatas[lastDatas.length - 1]);
        lastDatas.splice(lastDatas.length - 1);
        return;
    }
    if (e.key === "w"){ //increment line thickness
        saveData();
        data.jsonData[viewName][viewInd].blocks[blockEditing].outlineThickness++;
        return;
    }
    if (e.key === "s"){ //decrement line thickness
        saveData();
        data.jsonData[viewName][viewInd].blocks[blockEditing].outlineThickness--;
        return;
    }
    if ((e.key === "d") && !data.blockFinished){ // add curve
        saveData();
        data.editingMode = "addingCurve";
        return;
    }
    if (e.key === "f"){ // connect to end of block
        saveData();
        data.editingMode = "finishingBlock";
        return;
    }
    if (e.key === "p"){ //save
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
        })
        console.log(JSON.stringify(scaledJson));
        return;
    }
});
document.addEventListener("click", (e) => {
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

function interpolateCurvePoints(pointA, pointB, lerpCoeff){
    //lerpCoeff = 0 => pointA
    //lerpCoeff = 1 => pointB
}

function lerpCurve(target, points){
    let closestPoints = getSurroundingPoints(target, points);
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

            //get coefficent of interpolation
            if (pointA.pos[0] == pointB.pos[0]){
                interpolation = 0;
            }else{
                interpolation = (target.pos[0] - pointA.pos[0]) / (pointB.pos[0] - pointA.pos[0]);
            }
            
            //interpolate all components
            let interpolatedPos = [];
            for (let j = 1; j < pointA.pos.length; j++){
                interpolatedPos.push((1 - interpolation) * pointA.pos[j] + interpolation * pointB.pos[j]);
            }
            
            // interpolate values and push to lerped points array
            lerpedPoints.push({
                pos: interpolatedPos,
                value: interpolateCurvePoints(pointA, pointB, interpolation)
            });
        }else{
            // if both pointA and pointB have undefined posititons
            // set the result of the interpolation to an empty object
            lerpedPoints.push({});
        }
    }
    return lerpCurve(lerpedPoints,dimensions - 1,target.slice(1));
}
function getSurroundingPoints(target, points){
    // get position of each point from its params, and its value from its blocks
    let encodedTarget = {pos: Object.values(target.params), value: target.blocks};
    let encodedPoints = [];
    points.forEach((point) => {
        encodedPoints.push({
            pos: Object.values(point.params),
            value: point.blocks
        });
    });

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

/*
example format for calling multiDimensionalLerp:

multiDimensionalLerp([
    {pos: [-1,-1,-1], value: 100},
    {pos: [-1,-1,1], value: -1},
    {pos: [-1,1,-1], value: -1},
    {pos: [-1,1,1], value: -1},
    {pos: [1,-1,-1], value: -1},
    {pos: [1,-1,1], value: -1},
    {pos: [1,1,-1], value: -1},
    {pos: [1,1,1], value: 5},
],3,[1,1,1])
*/
function multiDimensionalLerp(points,dimensions,lerpPoint){
    if (dimensions == 0){
        return points[0].value;
    }
    closestPoints = [];
    // find the closest point in each quadrant
    for (let quadrant = 0; quadrant < Math.pow(2,dimensions); quadrant++){
        // filter points by which ones have coords whose signs matches the binary representation of the quadrant,
        // a 0 in the binary represenation meaning a negative or zero sign, and a 1 meaning a positive or zero sign
        let pointsInQuadrant = points.filter((point) =>
            (typeof point.pos != "undefined") ? //only reduce position components if they are defined
                point.pos.reduce((inQuadrant,curr,coord) => 
                    (
                        inQuadrant &&
                        (
                            ((((1 << coord) & quadrant) > 0) == (Math.sign(curr - lerpPoint[coord]) == 1))
                            || ((curr - lerpPoint[coord]) == 0)
                        )
                    )
                ,true)
            : false
        );

        // get the closest point in the this quadrant
        let closest = pointsInQuadrant.reduce((closest,curr) => {
            if ((closest.distance == -1) || (getDistance(curr.pos,lerpPoint) < closest.distance)){
                return {
                    distance: getDistance(curr.pos,lerpPoint),
                    closestPoint: curr
                };
            }
            return closest;
        },{distance: -1, closestPoint: {}}).closestPoint;

        //push the closest point
        //note that the signs of each component of consecutive terms differ by exactly one sign
        closestPoints.push(closest);
    }
    // interpolate between points across the 0th component
    let lerpedPoints = [];
    for (let i = 0; i < closestPoints.length; i+=2){
        let pointA = closestPoints[i];
        let pointB = closestPoints[i + 1];

        // check if both points are defined (they may not be if no points exist in either of the quadrants)
        if (!((typeof pointA.pos == "undefined") && (typeof pointB.pos == "undefined"))){
            let interpolation;

            // if one of the points does not exist (due to no points being in that quadrant), set it to the other point
            if (typeof pointA.pos == "undefined"){
                pointA = {...pointB};
            }
            if (typeof pointB.pos == "undefined"){
                pointB = {...pointA};
            }

            //get coefficent of interpolation
            if (pointA.pos[0] == pointB.pos[0]){
                interpolation = 0;
            }else{
                interpolation = (lerpPoint[0] - pointA.pos[0]) / (pointB.pos[0] - pointA.pos[0]);
            }
            
            //interpolate all components
            let interpolatedPos = [];
            for (let j = 1; j < dimensions; j++){
                interpolatedPos.push((1 - interpolation) * pointA.pos[j] + interpolation * pointB.pos[j]);
            }
            
            // interpolate values and push to lerped points array
            lerpedPoints.push({
                pos: interpolatedPos,
                value: (1 - interpolation) * pointA.value + interpolation * pointB.value
            });
        }else{
            lerpedPoints.push({});
        }
    }
    console.log(lerpedPoints);
    return multiDimensionalLerp(lerpedPoints,dimensions - 1,lerpPoint.slice(1));
}
function getDistance(a,b){
    return Math.sqrt(
        a.reduce((dist,currentCoord,coordInd) => 
            dist + Math.pow(currentCoord - b[coordInd], 2)
        ,0) // distance of a point is the square root of the sum of the squares of the difference in componenents
    );
}