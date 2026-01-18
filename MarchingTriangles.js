let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

export class MarchingTriangles {
    constructor(xTicks, yTicks, isolines, dimensions){
        this.xTicks = xTicks.sort((a, b) => a - b);
        this.yTicks = yTicks.sort((a, b) => a - b);
        this.paths = [];
        this.isolines = isolines;
        this.data = [];
        this.dimensions = dimensions;
        this.trisVisited = [];
    }
    lerp(a, b){
        return (a.value - ((a.weight) / (b.weight - a.weight)) * (b.value - a.value));
    }
    edgeLerp(edgeA, edgeB, isoline) {
        if (
            (edgeA === null)
            || (edgeB === null)
            || ((edgeA.value < isoline) == (edgeB.value < isoline))
        ){
            return {
                edgeActive: false
            };
        }
        return {
            edgeActive: true,
            isoline: isoline,
            x: this.lerp(
                {value: edgeA.y, weight: edgeA.value - isoline},
                {value: edgeB.y, weight: edgeB.value - isoline}
            ),
            y: this.lerp(
                {value: edgeA.x, weight: edgeA.value - isoline},
                {value: edgeB.x, weight: edgeB.value - isoline}
            )
        };
    }
    getVert(x, y){
        if (
            (y == 0)
            || (x == 0)
            || (y >= this.yTicks.length)
            || (x >= this.xTicks.length)
        ){
            return null;
        }
        return {
            x: this.xTicks[x],
            y: this.yTicks[y],
            value: this.data[y][x]
        }
    }
    getUnvisitedTri(){
        for (let i = 0; i < this.trisVisited.length; i++){
            for (let j = 0; j < this.trisVisited[i].length; j++){
                if (!this.trisVisited){
                    return {x: j, y: i};
                }
            }
        }
        return {x: -1, y: -1};
    }
    getTriPath(tri, isoline){
        let v1v2Edge = this.edgeLerp(tri.v1, tri.v2, isoline);
        let v2v3Edge = this.edgeLerp(tri.v2, tri.v3, isoline);
        let v1v3Edge = this.edgeLerp(tri.v1, tri.v3, isoline);
        if (!v1v2Edge.edgeActive || !v1v3Edge.edgeActive){
            return [];
        }
    }
    refreshPath(){
        this.paths = [];
        this.isolines.forEach((isoline) => {
            this.trisVisited = new Array(this.yTicks.length).fill(
                new Array(this.xTicks.length).fill(false)
            );
            let triInd = this.getUnvisitedTri();
            while (triInd.x != -1){
                this.paths.push(
                    ...this.getTriPath({
                        v1: this.getVert(triInd.x, triInd.y),
                        v2: this.getVert(triInd.x - 1, triInd.y),
                        v3: this.getVert(triInd.x, triInd.y - 1)
                    }, isoline)
                );
                triInd = this.getUnvisitedTri();
            }
        });
    }
    graphToScreenPos(point){
        return {
            x: this.dimensions.x + (
                (point.x - this.xTicks[0])
                / (this.xTicks[this.xTicks.length - 1] - this.xTicks[0])
            ) * this.dimensions.width,
            y: this.dimensions.y + (
                (point.y - this.yTicks[0])
                / (this.yTicks[this.yTicks.length - 1] - this.yTicks[0])
            ) * this.dimensions.height
        };
    }
    draw(){
        this.paths.forEach((square) => {
            square.forEach((path) => {
                ctx.beginPath();
                ctx.moveTo(path.x1, path.y1);
                ctx.lineTo(path.x2, path.y2);
                ctx.stroke();
            });
        });
    }
}