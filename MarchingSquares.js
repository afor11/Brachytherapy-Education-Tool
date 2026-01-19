let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

export class MarchingSquares {
    constructor(xTicks, yTicks, isolines, colors, dimensions){
        this.xTicks = xTicks.sort((a, b) => a - b);
        this.yTicks = yTicks.sort((a, b) => a - b);
        this.paths = [];
        this.isolines = isolines;
        this.data = [];
        this.dimensions = dimensions;
        this.colors = colors;
    }
    refreshPath(){
        const edgeLerp = (edgeA, edgeB) => 
            (edgeA.x == edgeB.x) ?
                this.lerp(
                    {value: edgeA.y, weight: edgeA.value},
                    {value: edgeB.y, weight: edgeB.value}
                )
            :
                this.lerp(
                    {value: edgeA.x, weight: edgeA.value},
                    {value: edgeB.x, weight: edgeB.value}
                );

        const pathFns = [
            () => [],
            (bottomLeft, bottomRight, topLeft) => {
                return [{
                    x1: edgeLerp(bottomLeft, bottomRight),
                    y1: bottomLeft.y,
                    x2: bottomLeft.x,
                    y2: edgeLerp(bottomLeft, topLeft)
                }];
            },
            (bottomLeft, bottomRight, _, topRight) => {
                return [{
                    x1: edgeLerp(bottomLeft, bottomRight),
                    y1: bottomLeft.y,
                    x2: bottomRight.x,
                    y2: edgeLerp(bottomRight, topRight)
                }];
            },
            (bottomLeft, bottomRight, topLeft, topRight) => {
                return [{
                    x1: bottomLeft.x,
                    y1: edgeLerp(bottomLeft, topLeft),
                    x2: bottomRight.x,
                    y2: edgeLerp(bottomRight, topRight)
                }];
            },
            (_, bottomRight, topLeft, topRight) => {
                return [{
                    x1: edgeLerp(topLeft, topRight),
                    y1: topLeft.y,
                    x2: topRight.x,
                    y2: edgeLerp(topRight, bottomRight)
                }];
            },
            (bottomLeft, bottomRight, topLeft, topRight) => {
                let average = (bottomLeft.value + bottomRight.value + topLeft.value + topRight.value) / 4;
                if (average < 0){
                    return [
                        ...pathFns[1](bottomLeft, bottomRight, topLeft, topRight),
                        ...pathFns[4](bottomLeft, bottomRight, topLeft, topRight)
                    ];
                }else{
                    return [
                        ...pathFns[2](bottomLeft, bottomRight, topLeft, topRight),
                        ...pathFns[7](bottomLeft, bottomRight, topLeft, topRight)
                    ];
                }
            },
            (bottomLeft, bottomRight, topLeft, topRight) => {
                return [{
                    x1: edgeLerp(bottomLeft, bottomRight),
                    y1: bottomLeft.y,
                    x2: edgeLerp(topLeft, topRight),
                    y2: topLeft.y
                }];
            },
            (bottomLeft, _, topLeft, topRight) => {
                return [{
                    x1: edgeLerp(topLeft, topRight),
                    y1: topLeft.y,
                    x2: bottomLeft.x,
                    y2: edgeLerp(bottomLeft, topLeft)
                }];
            },
            (bottomLeft, bottomRight, topLeft, topRight) => [
                ...pathFns[7](bottomLeft, bottomRight, topLeft, topRight)
            ],
            (bottomLeft, bottomRight, topLeft, topRight) => [
                ...pathFns[6](bottomLeft, bottomRight, topLeft, topRight)
            ],
            (bottomLeft, bottomRight, topLeft, topRight) => {
                let average = (bottomLeft.value + bottomRight.value + topLeft.value + topRight.value) / 4;
                if (average < 0){
                    return [
                        ...pathFns[2](bottomLeft, bottomRight, topLeft, topRight),
                        ...pathFns[7](bottomLeft, bottomRight, topLeft, topRight)
                    ];
                }else{
                    return [
                        ...pathFns[1](bottomLeft, bottomRight, topLeft, topRight),
                        ...pathFns[4](bottomLeft, bottomRight, topLeft, topRight)
                    ];
                }
            },
            (bottomLeft, bottomRight, topLeft, topRight) =>
                pathFns[4](bottomLeft, bottomRight, topLeft, topRight),
            (bottomLeft, bottomRight, topLeft, topRight) =>
                pathFns[3](bottomLeft, bottomRight, topLeft, topRight),
            (bottomLeft, bottomRight, topLeft, topRight) =>
                pathFns[2](bottomLeft, bottomRight, topLeft, topRight),
            (bottomLeft, bottomRight, topLeft, topRight) =>
                pathFns[1](bottomLeft, bottomRight, topLeft, topRight),
            () => []
        ];

        for (let i = 0; i < this.yTicks.length - 1; i++){
            for (let j = 0; j < this.xTicks.length - 1; j++){
                let bottomLeft = this.data[i][j];
                let bottomRight = this.data[i][j + 1];
                let topLeft = this.data[i + 1][j];
                let topRight = this.data[i + 1][j + 1];

                this.isolines.forEach((isoline, isolineInd) => {
                    let path = pathFns[
                        ((topLeft > isoline) << 3)
                        | ((topRight > isoline) << 2)
                        | ((bottomRight > isoline) << 1)
                        | (bottomLeft > isoline)
                    ](
                        {value: bottomLeft - isoline, ...this.graphToScreenPos({x: this.xTicks[j], y: this.yTicks[i]})},
                        {value: bottomRight - isoline, ...this.graphToScreenPos({x: this.xTicks[j + 1], y: this.yTicks[i]})},
                        {value: topLeft - isoline, ...this.graphToScreenPos({x: this.xTicks[j], y: this.yTicks[i + 1]})},
                        {value: topRight - isoline, ...this.graphToScreenPos({x: this.xTicks[j + 1], y: this.yTicks[i + 1]})}
                    );
                    if (path.length > 0){
                        path.forEach((line) => {
                            let canvasPath = new Path2D();
                            canvasPath.moveTo(line.x1, line.y1);
                            canvasPath.lineTo(line.x2, line.y2);

                            this.paths.push({line: canvasPath, color: this.colors[isolineInd]});
                        });
                    }
                });
            }
        }
    }
    lerp(a, b){
        return (a.value - ((a.weight) / (b.weight - a.weight)) * (b.value - a.value));
    }
    graphToScreenPos(point){
        return {
            x: this.dimensions.x + (
                (point.x - this.xTicks[0])
                / (this.xTicks[this.xTicks.length - 1] - this.xTicks[0])
            ) * this.dimensions.width,
            y: this.dimensions.y + this.dimensions.height - (
                (point.y - this.yTicks[0])
                / (this.yTicks[this.yTicks.length - 1] - this.yTicks[0])
            ) * this.dimensions.height
        };
    }
    draw(){
        ctx.lineCap = "round";
        ctx.lineWidth = Math.min(canvas.width, canvas.height) * 0.002;
        this.paths.forEach((path) => {
            ctx.strokeStyle = path.color;
            ctx.stroke(path.line);
        });
        ctx.lineCap = "butt";
    }
}