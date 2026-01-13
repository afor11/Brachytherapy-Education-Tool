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
    }
    refreshPath(){
        const lerp = (a, b) => (a.value - ((a.weight) / (b.weight - a.weight)) * (b.value - a.value))
        const edgeLerp = (edgeA, edgeB, isoline) => (
            ((edgeA.value < isoline) == (edgeB.value < isoline)) ?
                {
                    edgeActive: false
                }
            :
                {
                    edgeActive: true,
                    x: lerp(
                        {value: edgeA.y, weight: edgeA.value - isoline},
                        {value: edgeB.y, weight: edgeB.value - isoline}
                    ),
                    y: lerp(
                        {value: edgeA.x, weight: edgeA.value - isoline},
                        {value: edgeB.x, weight: edgeB.value - isoline}
                    )
                }
        );

        let edgeTris = [];

        // push the main triangles NOPE
        for (let i = 0; i < this.yTicks.length - 1; i++){
            for (let j = 1; j < this.xTicks.length; j++){
                let bottomRight = {
                    x: this.xTicks[j],
                    y: this.yTicks[i],
                    value: this.data[i][j]
                };
                let topLeft = {
                    x: this.xTicks[j - 1],
                    y: this.yTicks[i + 1],
                    value: this.data[i + 1][j - 1]
                };
                let topRight = {
                    x: this.xTicks[j],
                    y: this.yTicks[i + 1],
                    value: this.data[i + 1][j]
                };

                let thisTri = {p1: [], p2: [], p3: []};
                this.isolines.forEach((isoline) => {
                    thisTri.p1.push(edgeLerp(bottomRight, topRight, isoline));
                    thisTri.p2.push(edgeLerp(topRight, topLeft, isoline));
                    thisTri.p3.push(edgeLerp(topLeft, bottomRight, isoline));
                });

                edgeTris.push(thisTri);
            }
        }
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