var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

export function magnitude(vec){
    return Math.sqrt(vec.x ** 2 + vec.y ** 2 + vec.z ** 2);
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
            (ind - spacingArr[neighborLow]) / (spacingArr[neighborHigh] - spacingArr[neighborLow]))
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
    return parseFloat(unit.split(" ")[0]) * conversionFactors[newUnit][unit.split(" ")[1]];
}

export function cloneObj(obj){
    return JSON.parse(JSON.stringify(obj));
}

export function clamp(value, min, max){
    return Math.min(Math.max(value, min), max);
}