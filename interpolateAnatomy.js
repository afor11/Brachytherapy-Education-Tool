var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

function cloneObj(obj){
    return JSON.parse(JSON.stringify(obj));
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

    if (Object.keys(target).length == 0){
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

            let targetPos = Object.values(target);
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
    let slicedTarget = {};
    Object.keys(target).forEach((param,ind) => {
        if (ind > 0){
            slicedTarget[param] = target[param];
        }
    });
    return lerpParametrizedCurves(slicedTarget, lerpedPoints);
}

export function drawAnatomy(view, target, scaledAnatomyData){
    // get view data based on parameters
    let viewData = lerpParametrizedCurves(target, scaledAnatomyData[view]);

    // draw viewData
    viewData.forEach((block) => {
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

function getSurroundingPoints(target, points){
    // get position of each point from its params
    let encodedTarget = Object.values(target);
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

    let closestPoints = [];
    // find the closest point in each quadrant
    for (let quadrant = 0; quadrant < Math.pow(2,encodedTarget.length); quadrant++){
        // filter points by which ones have coords whose signs matches the binary representation of the quadrant,
        // a 0 in the binary represenation meaning a negative or zero sign, and a 1 meaning a positive or zero sign
        let pointsInQuadrant = encodedPoints.filter((point) =>
            (typeof point.pos != "undefined") ? //only reduce position components if they are defined
                point.pos.reduce((inQuadrant,curr,coord) => 
                    (
                        inQuadrant &&
                        (
                            ((((1 << coord) & quadrant) > 0) == (Math.sign(curr - encodedTarget[coord]) == 1))
                            || ((curr - encodedTarget[coord]) == 0)
                        )
                    )
                ,true)
            : false
        );

        // get the closest point in the this quadrant
        let closest = pointsInQuadrant.reduce((closest,curr) => {
            if ((closest.distance == -1) || (getDistance(curr.pos,encodedTarget) < closest.distance)){
                return {
                    distance: getDistance(curr.pos,encodedTarget),
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