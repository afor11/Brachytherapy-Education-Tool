let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
const images = [document.getElementById("image"), document.getElementById("image2")];


// ## to change the image being replicated, change the src of the image element
// ## in the html, and these params

const viewName = ["sagittaltandem+ring", "axialtandem+ring"]; // viewname cannot have whitespace
const maxUndos = 100;
// ORDER MATTERS :(
let paramSet = [
    {
        "ringDiameter": 20,
        "length": 20,
        "angle": 30
    },
    {
        "ringDiameter": 20,
        "angle": 30
    }
];
let usingParamSet = false;

// bottom bit (cervix) consistent (top bit changes with respect to tandem length)
// thickness of walls is also consistent
// larger clerance around the tandem/ovoids
// tip of tandem is 1 cm away from the (inside) top of the uterus wall

// Tandem / Ring: do axial view (make consistent with sagittal)

/*
x = go to next block
z = go to last block
o = log json save data
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
p/P: move block up
;/:: move block down
l/L: move block left
'/": move block right
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

//setup canvas and variables
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;
ctx.lineCap = "round";
ctx.lineJoin = "bevel";

let mouse = {x: 0, y: 0};

// make an array of data objects, one for each image (view)
let data = paramSet.map((paramSet, ind) => {
    let params;
    let defaultParams = [];
    let paramSetInd = 0;
    if (usingParamSet){
        // look through the param set and take the n-fold cartesian product of all
        // valid parameter values to generate a set of parameters the user can go
        // between using "n" (use the first element as the inital value of "params")
        let paramSetLoop = [];
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
        params = {...defaultParams[0]};
    }else{
        params = {...paramSet}
    }

    return {
        editingMode: "measuringScale",
        measuringPoints: [],
        measuredDistance: "",
        origin: {x: 0, y: 0},
        loadingData: {},
        selectedControlPoint: {curveInd: -1, subcurveID: -1},
        blockFinished: false,
        curveTemp: [],
        jsonData: {
            // default json data
            [viewName[ind]]: [
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
            ]
        },
        tapeMeasures: [],
        addingTapeMeasure: false,
        imageLoaded: false,
        showControlPoints: true,
        showCurves: true,
        showPicture: true,
        showOverlay: true,
        viewInd: 0,
        blockEditing: 0,
        paramEditing: 0,
        jsonString: "",
        params: params,
        defaultParams: defaultParams,
        paramSetInd: paramSetInd,
    };
});

let lastDatas = new Array(images.length).fill(0).map(() => []);
let nextDatas = new Array(images.length).fill(0).map(() => []);
for (let i = 0; i < images.length; i++) {
    saveData(i);
}

images.forEach((img, ind) => {
    // update imageLoaded when the image is loaded
    img.addEventListener("load",() => {data[ind].imageLoaded = true;});

    // check if the image has already loaded
    if (img.complete){
        data[ind].imageLoaded = true;
    }
});

setInterval(tick,50);

class MeasuringTape {
    constructor (firstPoint, ID, dataInd) {
        this.points = [firstPoint];
        this.ID = ID;
        this.dataInd = dataInd;
    }
    checkClick() {
        let numPointsBefore = this.points.length;
        // clicking on a point removes it from a tape measure
        this.points = this.points.filter((point) =>
            !(getDistance([point.x, point.y],[mouse.x, mouse.y]) < 10 / window.devicePixelRatio)
        );
        if (this.points.length == 0){
            //if the tape measure has no points, delete it
            for (let i = this.ID + 1; i < data[this.dataInd].tapeMeasures.length; i++){ //decrement all ID's after the deleted one
                data[this.dataInd].tapeMeasures[i].ID--;
            }
            data[this.dataInd].tapeMeasures.splice(this.ID,1);
            return true;
        }
        if (this.points.length == numPointsBefore){
            if (this.points.length < 2){
                //add a point if no points were cliked and the tape measure does not have all its points
                this.points.push({x: mouse.x, y: mouse.y});
                return true;
            }
        }else{
            //removing a point counts as a fultilled click
            return true;
        }
        return false;
    }
    getMeasurement() {
        if (this.points.length < 2){return 0;}
        return (
            getDistance(
                [this.points[0].x, this.points[0].y],
                [this.points[1].x, this.points[1].y]
            ) * data[this.dataInd].measuredDistance / getDistance(
                [data[this.dataInd].measuringPoints[0].x, data[this.dataInd].measuringPoints[0].y],
                [data[this.dataInd].measuringPoints[1].x, data[this.dataInd].measuringPoints[1].y]
            )
        );
    }
    getAngle() {
        if (this.points.length < 2){return 0;}
        if (this.points[0].x == this.points[1].x) {
            return ((this.points[0].y > this.points[1].y) ? 1 : -1) * Math.PI / 2;
        }
        return Math.atan2(
            this.points[0].y - this.points[1].y, //the y-coordinate subtraction order is flipped since y increases going up, not down
            this.points[1].x - this.points[0].x
        );
    }
    draw() {
        if (this.points.length == 2) {
            //draw line
            ctx.strokeStyle = "black";
            ctx.lineWidth = 3 / window.devicePixelRatio;
            ctx.font = (15 / window.devicePixelRatio) + "px Arial";
            ctx.beginPath();
            ctx.moveTo(this.points[0].x,this.points[0].y);
            ctx.lineTo(this.points[1].x,this.points[1].y);
            ctx.stroke();
            
            if (data[this.dataInd].showControlPoints) {
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
                    lerp(this.points[0].y,this.points[1].y,0.5) + (15 / window.devicePixelRatio)
                );
                ctx.fillText(
                    (this.getAngle() * 180 / Math.PI).toFixed(3) + "deg",
                    lerp(this.points[0].x,this.points[1].x,0.5),
                    lerp(this.points[0].y,this.points[1].y,0.5) + (15 / window.devicePixelRatio)
                );
            }
        }

        //draw points
        ctx.fillStyle = "black";
        ctx.lineWidth = 1 / window.devicePixelRatio;
        this.points.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x,point.y, 5 / window.devicePixelRatio, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        });
    }
}

function drawImages(){
    // if the image is loaded, scale it, then draw it to the canvas
    let viewWidth = canvas.width / data.length;
    for (let i = 0; i < data.length; i++) {
        if (data[i].imageLoaded && data[i].showPicture){
            let scale = Math.min(viewWidth / images[i].width, canvas.height / images[i].height);
            ctx.drawImage(
                images[i],
                (i * viewWidth) + (viewWidth - (scale * images[i].width)) / 2,
                (canvas.height - (scale * images[i].height)) / 2,
                scale * images[i].width,
                scale * images[i].height
            );
        }
    }
}

function drawApplicators() {
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    for (let i = 0; i < data.length; i++) {
        if (data[i].showPicture) {
            let orientation = "";
            if (viewName[i].includes("coronal")) {
                drawTandem("coronal", data[i]);
                orientation = "coronal";
            } else if (viewName[i].includes("sagittal")) {
                drawTandem("sagittal", data[i]);
                orientation = "sagittal";
            } else if (viewName[i].includes("axial")) {
                drawTandem("axial", data[i]);
                orientation = "axial";
            }

            if (viewName[i].includes("tandem+ovoids")) {
                drawApplicatorTandemOvoids(orientation, data[i]);
            } else if (viewName[i].includes("tandem+ring")) {
                drawApplicatorTandemRing(orientation, data[i]);
            }
        }
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "bevel";
}

function drawApplicatorTandemRing(view, data){
    if (
        (data.measuringPoints.length < 2)
        || (typeof data.measuredDistance === "undefined")
        || (typeof data.origin.x == 0)
    ){
        return;
    }
    let applicator = data.params;
    let graph = {
        graphDimensions: {
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height
        }
    }
    let distRatio = getDistance(
        [data.measuringPoints[0].x,data.measuringPoints[0].y],
        [data.measuringPoints[1].x,data.measuringPoints[1].y]
    ) / data.measuredDistance;
    let mm = {
        width: distRatio,
        height: distRatio
    }
    let cm = {
        width: mm.width * 10,
        height: mm.height * 10
    };
    let origin = data.origin;

    ctx.save();
    let clippingRegion = new Path2D();
    clippingRegion.rect(
        graph.graphDimensions.x,
        graph.graphDimensions.y,
        graph.graphDimensions.width,
        graph.graphDimensions.height
    );
    ctx.clip(clippingRegion);

    ctx.lineWidth = 0.5 * mm.width;
    ctx.strokeStyle = "black";

    const innerRadius = (applicator.ringDiameter / 2) - 6; // in mm
    const outerRadius = (applicator.ringDiameter / 2) + 6; // in mm
    if (view === "axial"){
        // draw inner ring
        ctx.beginPath();
        ctx.ellipse(
            origin.x,
            origin.y,
            innerRadius * mm.width,
            innerRadius * mm.height,
            0, 0, 2 * Math.PI
        );
        ctx.stroke();

        // draw outer ring
        ctx.beginPath();
        ctx.ellipse(
            origin.x,
            origin.y,
            outerRadius * mm.width,
            outerRadius * mm.height,
            0, 0, 2 * Math.PI
        );
        ctx.stroke();
    } else if ((view === "sagittal") || (view === "coronal")){
        let cornerRadii = [
            (outerRadius - innerRadius) / 2 * mm.width, (outerRadius - innerRadius) / 2 * mm.width,
            (outerRadius - innerRadius) * mm.width / 4, (outerRadius - innerRadius) * mm.width / 4
        ];
        // draw left part of ring
        ctx.beginPath();
        ctx.roundRect(
            origin.x - outerRadius * mm.width,
            origin.y - 0.75 * cm.height,
            (outerRadius - innerRadius) * mm.width,
            1.25 * cm.height,
            cornerRadii
        );
        ctx.stroke();

        // draw right part of ring
        ctx.beginPath();
        ctx.roundRect(
            origin.x + innerRadius * mm.width,
            origin.y - 0.75 * cm.height,
            (outerRadius - innerRadius) * mm.width,
            1.25 * cm.height,
            cornerRadii
        );
        ctx.stroke();
    }

    ctx.restore();
}

function drawApplicatorTandemOvoids(view, data){
    if (
        (data.measuringPoints.length < 2)
        || (typeof data.measuredDistance === "undefined")
        || (typeof data.origin.x == 0)
    ){
        return;
    }
    let applicator = data.params;
    let graph = {
        graphDimensions: {
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height
        }
    }
    let distRatio = getDistance(
        [data.measuringPoints[0].x,data.measuringPoints[0].y],
        [data.measuringPoints[1].x,data.measuringPoints[1].y]
    ) / data.measuredDistance;
    let mm = {
        width: distRatio,
        height: distRatio
    }
    let cm = {
        width: mm.width * 10,
        height: mm.height * 10
    };
    let origin = data.origin;
    const curvePercent = 0.5;
    let roundingRadius = Math.min(
        curvePercent * 1.5 * cm.width,
        curvePercent * applicator.ovoidDiameter * mm.height
    );

    ctx.save();
    ctx.beginPath();
    let clippingRegion = new Path2D();
    clippingRegion.rect(
        graph.graphDimensions.x,
        graph.graphDimensions.y,
        graph.graphDimensions.width,
        graph.graphDimensions.height
    );
    ctx.clip(clippingRegion);

    ctx.lineWidth = 0.5 * mm.width;
    ctx.strokeStyle = "black";

    if (view === "coronal"){
        let ovoidRight = {
            x: origin.x + (applicator.ovoidDiameter / 2) * mm.width,
            y: origin.y + (applicator.ovoidDiameter / 2) * mm.height
        };
        let ovoidLeft = {
            x: origin.x - (applicator.ovoidDiameter / 2) * mm.width,
            y: origin.y + (applicator.ovoidDiameter / 2) * mm.height
        };
        let startAngle = Math.atan2(
            Math.sqrt(((applicator.ovoidDiameter / 2) ** 2) - (((6 - applicator.ovoidDiameter) / 2) ** 2)),
            (6 - applicator.ovoidDiameter) / 2
        );
        ctx.beginPath();
        ctx.ellipse(
            ovoidRight.x,
            ovoidRight.y,
            (applicator.ovoidDiameter / 2) * mm.width,
            (applicator.ovoidDiameter / 2) * mm.height,
            0, startAngle, 2 * Math.PI - startAngle , true
        );
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(
            ovoidLeft.x,
            ovoidLeft.y,
            (applicator.ovoidDiameter / 2) * mm.width,
            (applicator.ovoidDiameter / 2) * mm.height,
            0, Math.PI - startAngle, startAngle + Math.PI, false
        );
        ctx.stroke();
    } else if (view === "sagittal"){
        ctx.beginPath();
        ctx.roundRect(
            origin.x - 1.5 * cm.width,
            origin.y,
            3 * cm.width,
            applicator.ovoidDiameter * mm.height,
            roundingRadius
        );
        ctx.stroke();
    }else if (view === "axial"){
        ctx.beginPath();
        ctx.roundRect(
            origin.x - applicator.ovoidDiameter * mm.width,
            origin.y - 1.5 * cm.height,
            applicator.ovoidDiameter * mm.width,
            3 * cm.height,
            roundingRadius
        );
        ctx.stroke();
        ctx.roundRect(
            origin.x,
            origin.y - 1.5 * cm.height,
            applicator.ovoidDiameter * mm.width,
            3 * cm.height,
            roundingRadius
        );
        ctx.stroke();
    }

    ctx.restore();
}

function drawTandem(view, data){
    if (
        (data.measuringPoints.length < 2)
        || (typeof data.measuredDistance === "undefined")
        || (typeof data.origin.x == 0)
    ){
        return;
    }
    let applicator = data.params;
    let graph = {
        graphDimensions: {
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height
        }
    }
    let distRatio = getDistance(
        [data.measuringPoints[0].x,data.measuringPoints[0].y],
        [data.measuringPoints[1].x,data.measuringPoints[1].y]
    ) / data.measuredDistance;
    let mm = {
        width: distRatio,
        height: distRatio
    }
    let cm = {
        width: mm.width * 10,
        height: mm.height * 10
    };
    let origin = data.origin;
    let appDiameter = applicator.diameter ?? 6;

    ctx.save();
    ctx.beginPath();
    let clippingRegion = new Path2D();
    clippingRegion.rect(
        graph.graphDimensions.x,
        graph.graphDimensions.y,
        graph.graphDimensions.width,
        graph.graphDimensions.height
    );
    ctx.clip(clippingRegion);

    ctx.lineWidth = appDiameter * mm.width;
    ctx.strokeStyle = "black";

    // draws the catheter
    ctx.moveTo(origin.x, origin.y);
    if (view === "sagittal"){
        let tandemAngle = (360 - (applicator.angle ?? 90)) * (Math.PI / 180);
        ctx.quadraticCurveTo(
            origin.x,
            origin.y + cm.height,
            origin.x + 2 * cm.width * Math.cos(tandemAngle),
            origin.y + cm.height - 2 * cm.height * Math.sin(tandemAngle) // negated because positive y is down
        );
        ctx.lineTo(
            origin.x + 10 * cm.width * Math.cos(tandemAngle),
            origin.y + cm.height - 10 * cm.height * Math.sin(tandemAngle)
        );
        ctx.stroke();

    } else if (view === "axial"){
        ctx.lineTo(origin.x, origin.y - 10 * cm.height);
        ctx.stroke();

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, appDiameter / 2 * mm.width, 0, 2 * Math.PI);
        ctx.fill();

    } else if (view === "coronal"){
        ctx.lineTo(origin.x, origin.y + 10 * cm.height);
        ctx.stroke();
    }

    // draws the tandem for sagittal and coronal views (since they look identical)
    if ((view === "sagittal") || (view === "coronal")){
        let tandemPath = new Path2D();
        tandemPath.roundRect(
            origin.x - (appDiameter / 2) * mm.width,
            origin.y - applicator.length * mm.height,
            appDiameter * mm.width,
            applicator.length * mm.height,
            [
                (appDiameter / 2) * mm.width, (appDiameter / 2) * mm.width,
                0, 0
            ]
        );

        ctx.lineWidth = 0.5 * mm.width;
        ctx.stroke(tandemPath);
    }

    ctx.restore();
}

function tick() {
    //reset canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawImages();
    drawCurves();
    drawApplicators();

    let menuPos = {
        x: window.scrollX,
        y: window.scrollY + (50 / window.devicePixelRatio),
    }
    for (let i = 0; i < data.length; i++) {
        if (getDataInd() == i) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
            ctx.beginPath();
            ctx.fillRect(i * (canvas.width / data.length), 0, (canvas.width / data.length), canvas.height);
        }
        // draw control points
        if (data[i].showControlPoints){
            drawControlPoints(i);
        }

        // draw inital measuring tool
        if ((data[i].editingMode === "enteringScale") || (data[i].editingMode === "measuringScale")){
            ctx.lineWidth = 2 / window.devicePixelRatio;
            ctx.strokeStyle = "black";
            if (data[i].measuringPoints.length == 2){
                ctx.beginPath();
                ctx.moveTo(data[i].measuringPoints[0].x, data[i].measuringPoints[0].y);
                ctx.lineTo(data[i].measuringPoints[1].x, data[i].measuringPoints[1].y);
                ctx.stroke();
            }

            ctx.fillStyle = "black";
            ctx.strokeStyle = "white";
            data[i].measuringPoints.forEach((point) => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5 / window.devicePixelRatio, 0, 7);
                ctx.fill();
                ctx.stroke();
            });
        }

        // draw origin
        if ((data[i].editingMode === "enteringOrigin") || (data[i].editingMode === "loadingData")){
            ctx.lineWidth = 2 / window.devicePixelRatio;
            ctx.fillStyle = "black";
            ctx.strokeStyle = "white";
            ctx.beginPath();
            ctx.arc(data[i].origin.x, data[i].origin.y, 5 / window.devicePixelRatio, 0, 7);
            ctx.fill();
            ctx.stroke();
        }

        // draw the tape measures
        data[i].tapeMeasures.forEach((tapeMeasure) => {
            tapeMeasure.draw();
        });

        // draw the mode overlay
        let drawDefault = true;
        ctx.fillStyle = "black";
        ctx.font = (30 / window.devicePixelRatio) + "px Arial";
        if (data[i].editingMode === "enteringScale"){
            ctx.fillText("Distance: " + data[i].measuredDistance + " mm", menuPos.x, menuPos.y);
            drawDefault = false;
        }
        if (data[i].editingMode === "enteringName"){
            ctx.fillText("Name: " + data[i].jsonData[viewName[i]][data[i].viewInd].blocks[data[i].blockEditing].name, menuPos.x, menuPos.y);
            drawDefault = false;
        }
        if (data[i].editingMode === "adjustingFillColor"){
            let block = data[i].jsonData[viewName[i]][data[i].viewInd].blocks[data[i].blockEditing];
            ctx.fillText("Editing Fill Color: hsla(" + block.blockColor[0] + ", " + block.blockColor[1] + "%, " + block.blockColor[2] + "%, " + block.blockColor[3] + ")", menuPos.x, menuPos.y);
            drawDefault = false;
        }
        if (data[i].editingMode === "adjustingOutlineColor"){
            let block = data[i].jsonData[viewName[i]][data[i].viewInd].blocks[data[i].blockEditing];
            ctx.fillText("Editing Outline Color: hsla(" + block.outlineColor[0] + ", " + block.outlineColor[1] + "%, " + block.outlineColor[2] + "%, " + block.outlineColor[3] + ")", menuPos.x, menuPos.y);
            drawDefault = false;
        }
        if (data[i].editingMode === "editingCurve"){
            ctx.fillText("Editing Curve " + (data[i].blockFinished ? "(Block Finished)" : "(Block not Finished)"), menuPos.x, menuPos.y);
            drawDefault = false;
        }
        if (data[i].editingMode === "loadingData"){
            ctx.fillText(
                "Loading Data (Editing: "
                    + Object.keys(data[i].params)[data[i].paramEditing]
                    + (
                        usingParamSet ?
                            (", " + ((data[i].paramSetInd / (data[i].defaultParams.length - 1)) * 100).toFixed(1) + "%")
                        :
                        (
                            (typeof data[i].jsonString !== "undefined") ?
                                (", " + ((data[i].paramSetInd / (JSON.parse(data[i].jsonString)[viewName[i]].length - 1)) * 100).toFixed(1) + "%")
                            :
                                ""
                        )

                    ) + ")",
                menuPos.x, menuPos.y
            );
            drawDefault = false;
        }
        if (drawDefault){
            ctx.fillText(data[i].editingMode, menuPos.x, menuPos.y);
        }

        // draw parameters or adding tape measure
        ctx.fillStyle = "black";
        ctx.strokeStyle = "white";
        ctx.lineWidth =  8 / window.devicePixelRatio;
        ctx.font = (15 / window.devicePixelRatio) + "px Arial";
        let paramYOffset = 1;

        if (data[i].addingTapeMeasure || ((data[i].tapeMeasures.length > 0) && (data[i].tapeMeasures[data[i].tapeMeasures.length - 1].points.length < 2))){
            ctx.strokeText("(adding tape measure)", menuPos.x, menuPos.y + (25 / window.devicePixelRatio));
            ctx.fillText("(adding tape measure)", menuPos.x, menuPos.y + (25 / window.devicePixelRatio));
            paramYOffset = 2;
        }

        Object.keys(data[i].params).forEach((key, ind) => {
            ctx.strokeText(
                key + ": " + data[i].params[key],
                menuPos.x + (25 / window.devicePixelRatio),
                menuPos.y + (25 / window.devicePixelRatio) * (ind + paramYOffset)
            );
            ctx.fillText(
                key + ": " + data[i].params[key],
                menuPos.x + (25 / window.devicePixelRatio),
                menuPos.y + (25 / window.devicePixelRatio) * (ind + paramYOffset)
            );
        });

        if (data[i].showOverlay) {
            //draw valid actions
            ctx.textAlign = 'right';
            getValidActions(data[i]).forEach((action,ind) => {
                ctx.strokeText(
                    action,
                    menuPos.x + ((canvas.width / data.length) * 0.99) / window.devicePixelRatio,
                    menuPos.y  + (ind + 1) * (25 / window.devicePixelRatio)
                );
                ctx.fillText(
                    action,
                    menuPos.x + ((canvas.width / data.length) * 0.99) / window.devicePixelRatio,
                    menuPos.y  + (ind + 1) * (25 / window.devicePixelRatio)
                );
            });
            ctx.textAlign = 'left';
        }

        menuPos.x += (canvas.width / window.devicePixelRatio) / data.length;
    }
}

function getValidActions(data){
    let validActions = ["<: undo", ">: redo"];
    if (data.editingMode === "enteringName"){
        validActions.push("enter name");
        return validActions;
    }
    validActions.push(
        "q: toggle visable points",
        "v: toggle showing curves",
        "b: toggle showing picture",
        "m: new measuring tape",
        "`: toggle overlay"
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
            "t/T: vertically stretch block",
            "g/G: vertically compress block",
            "h/H: horizontally stretch block",
            "f/F: horizontally compress block",
            "u/U: rotate block left",
            "i/I: rotate block right",
            "p/P: move block up",
            ";/:: move block down",
            "l/L: move block left",
            "'/\": move block right",
            "[: vertically mirror block",
            "]: horizontally mirror block",
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
        "o: save and print save string",
        "k: delete block"
    );
    return validActions;
}

let getDataInd = () => Math.min(Math.floor(mouse.x / (canvas.width / data.length)), data.length);

function saveData(dataInd) {
    lastDatas[dataInd].push(cloneObj(data[dataInd]));
    if (lastDatas[dataInd].length > maxUndos){
        lastDatas[dataInd] = lastDatas[dataInd].splice(1);
    }
    nextDatas[dataInd] = [];
}

function drawCurves(){
    for (let i = 0; i < data.length; i++) {
        if (data[i].showCurves) {
            data[i].jsonData[viewName[i]][data[i].viewInd].blocks.forEach((block) => {
                ctx.fillStyle = "hsla(" + block.blockColor[0] + ", " + block.blockColor[1] + "%, " + block.blockColor[2] + "%, " + block.blockColor[3] + ")";
                ctx.strokeStyle = "hsla(" + block.outlineColor[0] + ", " + block.outlineColor[1] + "%, " + block.outlineColor[2] + "%, " + block.outlineColor[3] + ")";
                ctx.lineWidth = block.outlineThickness;
                ctx.beginPath();
                block.curves.forEach((curve,ind) => {
                    if (ind == 0){
                        ctx.moveTo(curve.x1, curve.y1);
                    }
                    ctx.bezierCurveTo(curve.x2, curve.y2, curve.x3, curve.y3, curve.x4, curve.y4);
                });
                ctx.fill();
                ctx.stroke();
            });
        }
    }
}

function drawControlPoints(dataInd){
    let block = data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing];
    ctx.fillStyle = "black";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1 / window.devicePixelRatio;
    block.curves.forEach((curve) => {
        [
            {x: curve.x1,y: curve.y1},
            {x: curve.x2,y: curve.y2},
            {x: curve.x3,y: curve.y3},
            {x: curve.x4,y: curve.y4}
        ].forEach((controlPoint) => {
            if (data[dataInd].editingMode === "selectingSplit"){
                ctx.beginPath();
                ctx.arc(evalSpline(curve,0.5).x, evalSpline(curve,0.5).y, 5 / window.devicePixelRatio, 0, 7);
                ctx.fill();
                ctx.stroke();
            }else{
                ctx.beginPath();
                ctx.arc(controlPoint.x, controlPoint.y, 5 / window.devicePixelRatio, 0, 7);
                ctx.fill();
                ctx.stroke();
            }
        });
    });
    if (data[dataInd].curveTemp.length > 0){
        for (let i = 0; i < data[dataInd].curveTemp.length; i += 2){
            ctx.beginPath();
            ctx.arc(data[dataInd].curveTemp[i], data[dataInd].curveTemp[i + 1], 5 / window.devicePixelRatio, 0, 7);
            ctx.fill();
            ctx.stroke();
        }
    }
}

function load(json, resetJson) {
    for (let i = 0; i < data.length; i++) {
        if (!["enteringOrigin", "enteringScale", "measuringScale"].includes(data[i].editingMode)){
            saveData(i);
            if (resetJson){
                data[i].jsonString = json;
                data[i].loadingData = JSON.parse(json);
            }else{
                data[i].loadingData = JSON.parse(data[i].jsonString);
            }
            data[i].viewInd = data[i].loadingData[viewName[i]].findIndex((point) => // find a point with the same param values
                Object.keys(point.params).reduce((paramsEqual, param) => 
                    paramsEqual && (data[i].params[param] == point.params[param])
                ,true)
            );
            if (data[i].viewInd == -1){ // add a new view if the view with desired params does not exist
                let targetPoint = {
                    params: data[i].params,
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
                data[i].loadingData[viewName[i]].push(
                    {
                        params: targetPoint.params,
                        blocks: lerpParametrizedCurves(targetPoint, cloneObj(data[i].loadingData[viewName[i]]))
                    }
                );
                data[i].viewInd = data[i].loadingData[viewName[i]].length - 1;
            }
            data[i].blockEditing = 0;
            data[i].editingMode = "loadingData";
            scaleData();
        }
    }
}

function getSaveString() {
    let scaledJson = {};
    for (let i = 0; i < data.length; i++) {
        let scaleFactor = getDistance(
            [data[i].measuringPoints[0].x, data[i].measuringPoints[0].y],
            [data[i].measuringPoints[1].x, data[i].measuringPoints[1].y]
        ) / data[i].measuredDistance;

        for (let view of Object.keys(data[i].jsonData)) {
            if (!Object.hasOwn(scaledJson, view) || (view === viewName[i])) {
                scaledJson[view] = cloneObj(data[i].jsonData[view]);
            }
        }

        // scale the control points / outline thickness to be in terms of mm instead of px
        scaledJson[viewName[i]].forEach((point) => {
            point.blocks.forEach((block) => {
                block.outlineThickness = block.outlineThickness / scaleFactor;
                block.curves.forEach((curve) => {
                    for (let j = 1; j < 5; j++){
                        curve["x" + j] = (curve["x" + j] - data[i].origin.x) / scaleFactor;
                        curve["y" + j] = (curve["y" + j] - data[i].origin.y) / scaleFactor;
                    }
                });
            });
        });
    }
    return JSON.stringify(scaledJson);
}

function scaleData(){
    for (let i = 0; i < data.length; i++) {
        let viewData = data[i];
        if (typeof viewData.loadingData[viewName[i]] != "undefined"){
            let scaledCurves = cloneObj(viewData.loadingData);
            let scaleFactor = getDistance(
                [viewData.measuringPoints[0].x, viewData.measuringPoints[0].y],
                [viewData.measuringPoints[1].x, viewData.measuringPoints[1].y]
            ) / viewData.measuredDistance;
            scaledCurves[viewName[i]].forEach((point) => {
                point.blocks.forEach((block) => {
                    block.outlineThickness = block.outlineThickness * scaleFactor;
                    block.curves.forEach((curve) => {
                        for (let i = 1; i < 5; i++){
                            curve["x" + i] = (curve["x" + i] * scaleFactor) + viewData.origin.x;
                            curve["y" + i] = (curve["y" + i] * scaleFactor) + viewData.origin.y;
                        }
                    });
                });
            });
            viewData.jsonData = scaledCurves;
        }
    }
}
function cloneObj(obj){
    return JSON.parse(JSON.stringify(obj));
}

document.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX + window.scrollX;
    mouse.y = e.clientY + window.scrollY;
    let dataInd = getDataInd();
    if ((data[dataInd].editingMode === "editingCurve") && (data[dataInd].selectedControlPoint.curveInd != -1)){
        let curves = data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].curves;
        let curve = curves[data[dataInd].selectedControlPoint.curveInd]; // look at the selected curve
        if ((data[dataInd].selectedControlPoint.subcurveID == 0) && (data[dataInd].blockFinished || (data[dataInd].selectedControlPoint.curveInd > 0))){
            let previousCurve = curves[(data[dataInd].selectedControlPoint.curveInd - 1) % curves.length]; // look at the curve before the selected one
            previousCurve.x4 = mouse.x;
            previousCurve.y4 = mouse.y;
        }
        if ((data[dataInd].selectedControlPoint.subcurveID == 3) && (data[dataInd].blockFinished || (data[dataInd].selectedControlPoint.curveInd < (curves.length - 1)))){
            let nextCurve = curves[(data[dataInd].selectedControlPoint.curveInd + 1) % curves.length]; // look at the curve before the selected one
            nextCurve.x1 = mouse.x;
            nextCurve.y1 = mouse.y;
        }
        curve["x" + (data[dataInd].selectedControlPoint.subcurveID + 1)] = mouse.x;
        curve["y" + (data[dataInd].selectedControlPoint.subcurveID + 1)] = mouse.y;
    }
});

document.addEventListener("keydown", (e) => {
    let dataInd = getDataInd();
    if (data[dataInd].editingMode === "enteringName"){
        if ((e.key === "Backspace") && (data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].name.length > 0)){
            data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].name = data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].name.slice(0,-1);
            return;
        }
        if (e.key === "Enter"){
            saveData(dataInd);
            data[dataInd].editingMode = "addingCurve";
            return;
        }
        if (e.key === "Shift"){
            return;
        }
        if (!["<",">"].includes(e.key)){
            data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].name += e.key;
            return;
        }
    }
    if (e.key === "`"){
        data[dataInd].showOverlay = !data[dataInd].showOverlay;
        return;
    }
    if (e.key === "m"){
        saveData(dataInd);
        data[dataInd].addingTapeMeasure = true;
        return;
    }
    if (data[dataInd].editingMode === "adjustingFillColor"){
        if (e.key === "c"){
            saveData(dataInd);
            data[dataInd].editingMode = "adjustingOutlineColor";
            return;
        }
        if ("qawsed".includes(e.key)){
            data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].blockColor[Math.floor("aqswde".indexOf(e.key) / 2)] += 4 * (Math.floor("aqswde".indexOf(e.key)) % 2) - 2;
            clampEditingColors(dataInd);
            return;
        }
        if (e.key === "r"){
            data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].blockColor[3] += 0.05;
            clampEditingColors(dataInd);
            return;
        }
        if (e.key === "f"){
            data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].blockColor[3] -= 0.05;
            clampEditingColors(dataInd);
            return;
        }
    }
    if (data[dataInd].editingMode === "adjustingOutlineColor"){
        if (e.key === "c"){
            saveData(dataInd);
            data[dataInd].editingMode = "editingCurve";
            return;
        }
        if ("qawsed".includes(e.key)){
            data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].outlineColor[Math.floor("aqswde".indexOf(e.key) / 2)] += 4 * (Math.floor("aqswde".indexOf(e.key)) % 2) - 2;
            clampEditingColors(dataInd);
            return;
        }
        if (e.key === "r"){
            data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].outlineColor[3] += 0.05;
            clampEditingColors(dataInd);
            return;
        }
        if (e.key === "f"){
            data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].outlineColor[3] -= 0.05;
            clampEditingColors(dataInd);
            return;
        }
    }
    if (e.key === "q"){
        data[dataInd].showControlPoints = !data[dataInd].showControlPoints;
        return;
    }
    if (e.key === "v"){
        data[dataInd].showCurves = !data[dataInd].showCurves;
        return;
    }
    if (e.key === "b"){
        data[dataInd].showPicture = !data[dataInd].showPicture;
        return;
    }
    if ((data[dataInd].editingMode === "enteringOrigin") || (data[dataInd].editingMode === "loadingData")){
        if (e.key === "Enter"){
            if (data[dataInd].editingMode === "enteringOrigin"){
                saveData(dataInd);
                data[dataInd].editingMode = "enteringName";
            }else{
                saveData(dataInd);
                data[dataInd].editingMode = "editingCurve";
                data[dataInd].blockFinished = true;
            }
        }
        if ((e.key === "w") || (e.key === "ArrowUp")){
            data[dataInd].origin.y--;
            scaleData();
        }
        if ((e.key === "s") || (e.key === "ArrowDown")){
            data[dataInd].origin.y++;
            scaleData();
        }
        if ((e.key === "a") || (e.key === "ArrowLeft")){
            data[dataInd].origin.x--;
            scaleData();
        }
        if ((e.key === "d") || (e.key === "ArrowRight")){
            data[dataInd].origin.x++;
            scaleData();
        }
        if (e.key === "e"){
            data[dataInd].measuredDistance -= 0.1;
            scaleData();
        }
        if (e.key === "r"){
            data[dataInd].measuredDistance += 0.1;
            scaleData();
        }
        if (data[dataInd].editingMode === "loadingData"){
            if (e.key === "f"){
                data[dataInd].paramEditing = clamp(data[dataInd].paramEditing - 1, 0, Object.keys(data[dataInd].params).length - 1);
            }
            if (e.key === "h"){
                data[dataInd].paramEditing = clamp(data[dataInd].paramEditing + 1, 0, Object.keys(data[dataInd].params).length - 1);
            }
            if ("tTgG".includes(e.key)){
                data[dataInd].params[Object.keys(data[dataInd].params)[data[dataInd].paramEditing]] += [1,0.015625,-1,-0.015625]["tTgG".indexOf(e.key)];
                load(data[dataInd].jsonString, false);
            }
            if (e.key === "n"){
                if (usingParamSet){
                    data[dataInd].paramSetInd = Math.min(data[dataInd].paramSetInd + 1, data[dataInd].defaultParams.length - 1);
                    data[dataInd].params = {...data[dataInd].defaultParams[data[dataInd].paramSetInd]};
                }else{
                    let paramList = JSON.parse(data[dataInd].jsonString)[viewName[dataInd]].map((point) => point.params);
                    data[dataInd].paramSetInd = Math.min(data[dataInd].paramSetInd + 1, paramList.length - 1);
                    data[dataInd].params = {...paramList[data[dataInd].paramSetInd]};
                }
                load(data[dataInd].jsonString, false);
            }
            if (e.key === "N"){
                if (usingParamSet){
                    data[dataInd].paramSetInd = Math.max(data[dataInd].paramSetInd - 1, 0);
                    data[dataInd].params = {...data[dataInd].defaultParams[data[dataInd].paramSetInd]};
                }else{
                    let paramList = JSON.parse(data[dataInd].jsonString)[viewName[dataInd]].map((point) => point.params);
                    data[dataInd].paramSetInd = Math.max(data[dataInd].paramSetInd - 1, 0);
                    data[dataInd].params = {...paramList[data[dataInd].paramSetInd]};
                }
                load(data[dataInd].jsonString, false);
            }
        }
        if ((e.key != "<") && (e.key != ">")){
            return;
        }
    }
    if ((data[dataInd].editingMode === "editingCurve") && data[dataInd].blockFinished){
        if (e.key === "C"){
            saveData(dataInd);
            data[dataInd].copy = cloneObj(data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing]);
            return;
        }
        if (e.key === "V"){
            saveData(dataInd);
            data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing] = cloneObj(data[dataInd].copy);
            return;
        }
        if (e.key === "a"){
            saveData(dataInd);
            load(getSaveString(), true);
            return;
        }
        if (e.key === "y"){
            data[dataInd].editingMode = "selectingSplit";
            return;
        }
        if (e.key === "z"){
            saveData(dataInd);
            data[dataInd].blockEditing = Math.max(data[dataInd].blockEditing - 1, 0);
        }
        if (e.key === "x"){
            saveData(dataInd);
            data[dataInd].blockEditing = Math.min(data[dataInd].blockEditing + 1, data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks.length - 1);
        }
        if ("tTfFgGhH".includes(e.key)){
            saveData(dataInd);
            let yScale = 0;
            let xScale = 0;
            if (e.key === "t"){yScale = 0.1;}
            if (e.key === "T"){yScale = 0.01;}
            if (e.key === "g"){yScale = -0.1;}
            if (e.key === "G"){yScale = -0.01;}
            if (e.key === "f"){xScale = -0.1;}
            if (e.key === "F"){xScale = -0.01;}
            if (e.key === "h"){xScale = 0.1;}
            if (e.key === "H"){xScale = 0.01;}
            data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].curves.forEach((curve) => {
                for (let i = 1; i < 5; i++){
                    curve["x" + i] += (curve["x" + i] - mouse.x) * xScale;
                    curve["y" + i] += (curve["y" + i] - mouse.y) * yScale;
                }
            });
        }
        if ("uUiI".includes(e.key)){
            saveData(dataInd);
            let dAngle = [0.1,0.005,-0.1,-0.005]["uUiI".indexOf(e.key)];
            data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].curves.forEach((curve) => {
                for (let i = 1; i < 5; i++){
                    let x = (curve["x" + i] - mouse.x);
                    let y = (curve["y" + i] - mouse.y);
                    curve["x" + i] = x * Math.cos(dAngle) - y * Math.sin(dAngle) + mouse.x;
                    curve["y" + i] = x * Math.sin(dAngle) + y * Math.cos(dAngle) + mouse.y;
                }
            });
        }
        if ("[]".includes(e.key)){
            saveData(dataInd);
            data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].curves.forEach((curve) => {
                for (let i = 1; i < 5; i++){
                    if (e.key === "]"){
                        curve["x" + i] += 2 * (mouse.x - curve["x" + i]);
                    }
                    if (e.key === "["){
                        curve["y" + i] += 2 * (mouse.y - curve["y" + i]);
                    }
                }
            });
        }
        if (";:pP'\"lL".includes(e.key)){
            saveData(dataInd);
            let xOffset = 0;
            let yOffset = 0;
            if (e.key === ";"){yOffset = 10;}
            if (e.key === ":"){yOffset = 1;}
            if (e.key === "p"){yOffset = -10;}
            if (e.key === "P"){yOffset = -1;}
            if (e.key === "'"){xOffset = 10;}
            if (e.key === "\""){xOffset = 1;}
            if (e.key === "l"){xOffset = -10;}
            if (e.key === "L"){xOffset = -1;}
            data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].curves.forEach((curve) => {
                for (let i = 1; i < 5; i++){
                    curve["x" + i] += xOffset;
                    curve["y" + i] += yOffset;
                }
            });
        }
    }
    if (data[dataInd].editingMode === "enteringScale"){
        if ((e.key === "Backspace") && (data[dataInd].measuredDistance.length > 0)){
            data[dataInd].measuredDistance = data[dataInd].measuredDistance.slice(0,-1);
            return;
        }
        if (e.key === "Enter"){
            saveData(dataInd);
            data[dataInd].measuredDistance = parseInt(data[dataInd].measuredDistance);
            data[dataInd].editingMode = "enteringOrigin";
            return;
        }
        if ("0123456789.".includes(e.key)){
            data[dataInd].measuredDistance += e.key;
            return;
        }
    }
    if ((e.key === "c") && data[dataInd].blockFinished){
        saveData(dataInd);
        data[dataInd].editingMode = "adjustingFillColor";
        return;
    }
    if (e.key === "n"){ // new block
        saveData(dataInd);
        data[dataInd].blockFinished = false;
        data[dataInd].editingMode = "enteringName";
        data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks.push({
            name: "",
            blockColor: [0,100,50,0.5],
            outlineThickness: 1,
            outlineColor: [0,0,0,0.5],
            curves: []
        });
        data[dataInd].blockEditing = data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks.length - 1;
        return;
    }
    if ((e.key === "<") && (lastDatas[dataInd].length > 0)){ //undo
        nextDatas[dataInd].unshift(cloneObj(data[dataInd]));
        data[dataInd] = cloneObj(lastDatas[dataInd][lastDatas[dataInd].length - 1]);
        data[dataInd].tapeMeasures.forEach((tapeMeasure, ind) => {
            let tempTape = new MeasuringTape(tapeMeasure.points[0], tapeMeasure.ID, dataInd);
            if (typeof tapeMeasure.points[1] !== "undefined"){
                tempTape.points.push(tapeMeasure.points[1]);
            }
            data[dataInd].tapeMeasures[ind] = tempTape;
        });
        lastDatas[dataInd].splice(lastDatas[dataInd].length - 1);
        data[dataInd].blockEditing = data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks.length - 1;
        return;
    }
    if ((e.key === ">") && (nextDatas[dataInd].length > 0)){ //redo
        let lastData = cloneObj(data[dataInd]);
        data[dataInd] = cloneObj(nextDatas[dataInd][0]);
        data[dataInd].tapeMeasures.forEach((tapeMeasure, ind) => {
            let tempTape = new MeasuringTape(tapeMeasure.points[0], tapeMeasure.ID, dataInd);
            if (typeof tapeMeasure.points[1] !== "undefined"){
                tempTape.points.push(tapeMeasure.points[1]);
            }
            data[dataInd].tapeMeasures[ind] = tempTape;
        });
        nextDatas[dataInd] = nextDatas[dataInd].splice(1);
        lastDatas[dataInd].push(lastData);
        if (lastDatas[dataInd].length > maxUndos){
            lastDatas[dataInd] = lastDatas[dataInd].splice(1);
        }
        data[dataInd].blockEditing = data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks.length - 1;
        return;
    }
    if (e.key === "w"){ //increment line thickness
        saveData(dataInd);
        data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].outlineThickness++;
        return;
    }
    if (e.key === "s"){ //decrement line thickness
        saveData(dataInd);
        data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].outlineThickness =
            Math.max(
                data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].outlineThickness - 1,
                0
            );
        return;
    }
    if ((e.key === "d") && !data[dataInd].blockFinished){ // add curve
        data[dataInd].editingMode = "addingCurve";
        return;
    }
    if ((e.key === "f") && !data[dataInd].blockFinished){ // connect to end of block
        data[dataInd].editingMode = "finishingBlock";
        return;
    }
    if ((e.key === "k") && (data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks.length > 1)){ //delete block
        saveData(dataInd);
        data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks.splice(data[dataInd].blockEditing,1);
        data[dataInd].blockEditing = Math.max(data[dataInd].blockEditing - 1, 0);
        return;
    }
    if (e.key === "o"){ //save
        console.log(getSaveString());
        return;
    }
});

document.addEventListener("click", (e) => {
    let dataInd = getDataInd();
    if (data[dataInd].addingTapeMeasure){
        saveData(dataInd);
        data[dataInd].tapeMeasures.push(
            new MeasuringTape({x: mouse.x, y: mouse.y}, data[dataInd].tapeMeasures.length, dataInd)
        );
        data[dataInd].addingTapeMeasure = false;
        return;
    }
    for (let i = 0; i < data[dataInd].tapeMeasures.length; i++){
        if (data[dataInd].tapeMeasures[i].checkClick()){
            saveData(dataInd);
            return;
        }
    }
    if ((data[dataInd].editingMode === "addingCurve") || (data[dataInd].editingMode === "finishingBlock")){
        saveData(dataInd);
        data[dataInd].curveTemp.push(mouse.x);
        data[dataInd].curveTemp.push(mouse.y);
        let connectToLast = data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].curves.length > 0;
        if (data[dataInd].curveTemp.length == (
            connectToLast ?
                ((data[dataInd].editingMode === "finishingBlock") ? 4 : 6)
            :
                ((data[dataInd].editingMode === "finishingBlock") ? 6 : 8)
        )){
            let newCurve;
            let curves = data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].curves;
            if (connectToLast){
                newCurve = {
                    x1: curves[curves.length - 1].x4,
                    y1: curves[curves.length - 1].y4,
                    x2: data[dataInd].curveTemp[0],
                    y2: data[dataInd].curveTemp[1],
                    x3: data[dataInd].curveTemp[2],
                    y3: data[dataInd].curveTemp[3],
                    x4: ((data[dataInd].editingMode === "finishingBlock") ? curves[0].x1 : data[dataInd].curveTemp[4]),
                    y4: ((data[dataInd].editingMode === "finishingBlock") ? curves[0].y1 : data[dataInd].curveTemp[5]),
                };
            }else{
                newCurve = {
                    x1: data[dataInd].curveTemp[0],
                    y1: data[dataInd].curveTemp[1],
                    x2: data[dataInd].curveTemp[2],
                    y2: data[dataInd].curveTemp[3],
                    x3: data[dataInd].curveTemp[4],
                    y3: data[dataInd].curveTemp[5],
                    x4: ((data[dataInd].editingMode === "finishingBlock") ? curves[0].x1 : data[dataInd].curveTemp[6]),
                    y4: ((data[dataInd].editingMode === "finishingBlock") ? curves[0].y1 : data[dataInd].curveTemp[7]),
                };
            }
            
            curves.push(newCurve);
            data[dataInd].curveTemp = [];

            if (data[dataInd].editingMode === "finishingBlock"){
                data[dataInd].blockFinished = true;
            }

            data[dataInd].editingMode = "editingCurve";
        }
        return;
    }
    if (data[dataInd].editingMode === "editingCurve"){
        saveData(dataInd);
        if (data[dataInd].selectedControlPoint.curveInd != -1){
            data[dataInd].selectedControlPoint = {
                curveInd: -1,
                subcurveID: -1,
            };
            return; //deselect control point when a control point is selected, the mouse is clicked
        }
        data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].curves.forEach((curve,curveInd) => {
            [
                {x: curve.x1,y: curve.y1},
                {x: curve.x2,y: curve.y2},
                {x: curve.x3,y: curve.y3},
                {x: curve.x4,y: curve.y4}
            ].forEach((controlPoint,subcurveID) => {
                if (getDistance([mouse.x,mouse.y],[controlPoint.x, controlPoint.y]) < 10 / window.devicePixelRatio){
                    data[dataInd].selectedControlPoint = {
                        curveInd: curveInd,
                        subcurveID: subcurveID,
                    }
                }
            });
        });
        return;
    }
    if (data[dataInd].editingMode === "selectingSplit"){
        let splitInd = -1;
        let curveToSplit;
        data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].curves.forEach((curve, curveInd) => {
            if (getDistance(
                [evalSpline(curve,0.5).x, evalSpline(curve,0.5).y],
                [mouse.x,mouse.y]
            ) < 10 / window.devicePixelRatio){
                splitInd = curveInd;
                curveToSplit = curve;
            }
        });
        if (splitInd != -1){
            saveData(dataInd);
            data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].curves.splice(
                splitInd, 1,
                splitCurve(curveToSplit,0,0.5),
                splitCurve(curveToSplit,0.5,1)
            );
            data[dataInd].editingMode = "editingCurve";
            return;
        }
    }
    if (data[dataInd].editingMode === "measuringScale"){
        saveData(dataInd);
        data[dataInd].measuringPoints.push({x: mouse.x, y: mouse.y});
        if (data[dataInd].measuringPoints.length == 2){
            data[dataInd].editingMode = "enteringScale";
        }
        return;
    }
    if ((data[dataInd].editingMode === "enteringOrigin") || (data[dataInd].editingMode === "loadingData")){
        saveData(dataInd);
        data[dataInd].origin = {...{x: mouse.x, y: mouse.y}};
        scaleData();
        return;
    }
});

function clampEditingColors(dataInd) {
    let blockColor = data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].blockColor;
    let outlineColor = data[dataInd].jsonData[viewName[dataInd]][data[dataInd].viewInd].blocks[data[dataInd].blockEditing].outlineColor;
    blockColor.forEach((color,ind) => {
        blockColor[ind] = clamp(color, [0,0,0,0][ind] , [360,100,100,1][ind]);
        blockColor[ind] = Math.round(blockColor[ind] * 100) / 100;
    });
    outlineColor.forEach((color,ind) => {
        outlineColor[ind] = clamp(color, [0,0,0,0][ind] , [360,100,100,1][ind]);
        outlineColor[ind] = Math.round(outlineColor[ind] * 100) / 100;
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
        if (!((typeof pointA.pos === "undefined") && (typeof pointB.pos === "undefined"))){
            let interpolation;

            // if one of the points does not exist (due to no points being in that quadrant), set it to the other point
            if (typeof pointA.pos === "undefined"){
                pointA = cloneObj(pointB);
            }
            if (typeof pointB.pos === "undefined"){
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