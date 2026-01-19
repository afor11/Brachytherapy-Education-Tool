import { GammaMedHDRPlus, BEBIG_GK60M21, ElektaFlexisource, airKermaSliderLimits } from '../../constants.js';
import { Seed } from '../../seed.js';
import { Graph } from '../../graph.js';
import { Button } from '../../UIclasses/Button.js';
import { Module } from '../../module.js';
import { getRegionBound, getRange, referencePointLabel, airKermaLabel, modelDropdown, airKermaSlider, rescaleDropdownButtons, runUntilTrue, setEqualFont, multSeedDwellTimeSlider, multSeedDwellTimeLabel, blankDropdown, addDropdownOptions } from '../../utils.js';
import { refreshNavBar, navBar } from "../../navBar.js";
import { view } from '../../main.js';
import { NumberInput } from '../../UIclasses/NumberInput.js';
import { AlgebraicEffect } from '../../algebraicEffect.js';
import { drawTandem } from './vaginalCylinder.js';

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let backCanvas = document.getElementById("backCanvas");
let backCtx = backCanvas.getContext("2d");

export let tandemAndRingPage = new Module({
    graphs: {
        graph1: new Graph({
            x: 0, y: 0, width: 0, height: 0,
            seeds: [],
            xTicks: getRange(-2, 2, 0.0625),
            yTicks: getRange(-2, 6, 0.0625),
            perspective: (point) => point,
            name: "graph1",
            refpoints: [{x: 2, y: 2, z: 0}, {x: -2, y: 2, z: 0}],
            anatomyView: "coronal",
            anatomyApplicator: "tandem+ring",
            anatomyParams: {
                length: 40,
                ringDiameter: 20
            }
        }),
        graph2: new Graph({
            x: 0, y: 0, width: 0, height: 0,
            seeds: [],
            xTicks: getRange(-2, 2, 0.0625),
            yTicks: getRange(-2, 6, 0.0625),
            perspective: (point) => {return {x: point.z, y: point.y, z: point.x}},
            name: "graph2",
            refpoints: [{x: 2, y: 2, z: 0}, {x: -2, y: 2, z: 0}],
            anatomyView: "sagittal",
            anatomyApplicator: "tandem+ring",
            anatomyParams: {
                length: 40,
                ringDiameter: 20,
                angle: 60
            }
        }),
        graph3: new Graph({
            x: 0, y: 0, width: 0, height: 0,
            seeds: [],
            xTicks: getRange(-2, 2, 0.0625),
            yTicks: getRange(-2, 6, 0.0625),
            perspective: (point) => {return {x: point.x, y: point.z, z: point.y}},
            name: "graph3",
            refpoints: [{x: 2, y: 2, z: 0}, {x: -2, y: 2, z: 0}],
            anatomyView: "axial",
            anatomyApplicator: "tandem+ring",
            anatomyParams: {
                ringDiameter: 20,
            }
        }),
    },
    sliders: {
        graph1AirKerma: airKermaSlider("graph1"),
        graph1DwellTime: multSeedDwellTimeSlider("graph1"),
    },
    labels: {
        graph1AirKerma: airKermaLabel("graph1"),
        graph1DwellTime: multSeedDwellTimeLabel("graph1"),
        treatmentTime: new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Total treatment time: ${value} mins`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: function* () {
                let module = yield new AlgebraicEffect("GET MODULE");
                return module.graphs.graph1.seeds.reduce(
                    (totalTime, seed) =>
                        totalTime + seed.dwellTime * 60
                    ,0
                );
            },
            onEnter: function* (value){
                let module = yield new AlgebraicEffect("GET MODULE");
                // convert the value from minutes to hours (what the seeds use), then divide that time evenly accross all seeds,
                // capping it at 5 minutes per seed
                let dwellTimePerSeed = Math.min((value / 60) / module.graphs.graph1.seeds.length, 0.08333);
                module.graphs.graph1.seeds.forEach((seed) => {
                    seed.dwellTime = dwellTimePerSeed;
                });
            },
            numDecimalsEditing: 1
        }),
        graph1ReferenceRight: referencePointLabel("graph1", 0, (value) => `Point A Right: ${value} Gy`),
        graph1ReferenceLeft: referencePointLabel("graph1", 1, (value) => `Point A Left: ${value} Gy`)
    },
    buttons: {
        resetDwellTimes: new Button({
            x: 0, y: 0, width: 0, height: 0, bgColor: "white",
            label: {
                text: "Reset Dwell Times",
                font: "default",
                color: "black"
            },
            outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.01},
            onClick: function* () {
                let module = yield new AlgebraicEffect("GET MODULE");
                module.graphs.graph1.seeds.forEach((seed) => {
                    seed.dwellTime = 0.00833;
                });
                yield* module.onReload.call(module);
            },
        })
    },
    dropDowns: {
        graph1Model: modelDropdown([GammaMedHDRPlus, BEBIG_GK60M21, ElektaFlexisource],"graph1",GammaMedHDRPlus.name),
        applicatorModel: blankDropdown("Applicator: tandem+ring"),
        applicatorLength: blankDropdown("Length: 40mm"),
        ringDiameter: blankDropdown("Diameter: 30mm"),
        applicatorAngle: blankDropdown("Angle: 60mm")
    },
    specialVars: {
        applicator: {
            length: 40,
            ringDiameter: 20,
            angle: 60
        },
        selectedGraph: "",
        lastApplicatorLoaded: "",
        *refreshApplicator(){
            let module = yield new AlgebraicEffect("GET MODULE");

            if (module.lastApplicatorLoaded !== JSON.stringify(module.applicator)){
                // get seed model
                let seedModel;
                if (module.graphs.graph1.seeds.length > 0){
                    seedModel = module.graphs.graph1.seeds[0].model;
                }else{
                    seedModel = GammaMedHDRPlus;
                }

                module.graphs.graph1.seeds = [];
                for (let i = (module.applicator.length / 10) - 0.7; i >= 0; i -= 1){
                    module.graphs.graph1.seeds.push(
                        new Seed(
                            {x: 0, y: i, z: 0},
                            {phi: Math.PI / 2, theta: 0},
                            seedModel,
                            airKermaSliderLimits.HDR.min,
                            0.00833
                        )
                    );
                }

                // space ring points base on this: https://www.desmos.com/calculator/nhwzaakhwz formula
                const arcDistance = 10; // arc distance between seeds (mm)
                let angles = getRange(
                    3 * Math.PI / 4,
                    9 * Math.PI / 4,
                    2 * arcDistance / module.applicator.ringDiameter
                );

                // correct error and add seeds
                let error = (3 * Math.PI / 2) - (angles[0] + angles[angles.length - 1]) / 2;
                angles.forEach((angle) => {
                    module.graphs.graph1.seeds.push(
                        new Seed(
                            {
                                x: ((module.applicator.ringDiameter / 10) / 2) * Math.cos(angle + error),
                                y: 0,
                                z: ((module.applicator.ringDiameter / 10) / 2) * Math.sin(angle + error)
                            },
                            {phi: 0, theta: angle + error + Math.PI / 2},
                            seedModel,
                            airKermaSliderLimits.HDR.min,
                            0.00833
                        )
                    );
                });

                module.graphs.graph2.seeds = module.graphs.graph1.seeds;
                module.graphs.graph3.seeds = module.graphs.graph1.seeds;
            }

            module.graphs.graph1.xTicks = getRange(
                -(module.applicator.ringDiameter / 10) - 2.6,
                (module.applicator.ringDiameter / 10) + 2.6,
                0.0625
            );
            module.graphs.graph1.yTicks = getRange(
                -3,
                (module.applicator.length / 10) + 2,
                0.0625
            );

            module.graphs.graph2.xTicks = [...module.graphs.graph1.xTicks];
            module.graphs.graph2.yTicks = [...module.graphs.graph1.yTicks];

            module.graphs.graph3.xTicks = [...module.graphs.graph1.xTicks];
            module.graphs.graph3.yTicks = [...module.graphs.graph2.xTicks];

            module.graphs.graph1.refpoints = [{x: 2, y: 2, z: 0},{x: -2, y: 2, z: 0}];
            module.graphs.graph2.refpoints = module.graphs.graph1.refpoints;
            module.graphs.graph3.refpoints = module.graphs.graph1.refpoints;

            if (module.graphs.graph1.selectedSeed != -1){
                module.graphs.graph1.selectedSeed = Math.min(
                    module.graphs.graph1.seeds.length - 1,
                    module.graphs.graph1.selectedSeed
                );
            }

            // reset applicator length dropdown
            module.dropDowns.applicatorLength.button.label = "Length: " + module.applicator.length + "mm";
            yield* addDropdownOptions(
                module.dropDowns.applicatorLength,
                [20, 30, 40, 50, 60],
                (opt) => `${opt}mm`,
                (opt) => {
                    return function* () {
                        (yield new AlgebraicEffect("GET PARENT")).collapseDropdown();

                        let module = yield new AlgebraicEffect("GET MODULE");
                        if (module.applicator.length != opt){
                            module.applicator.length = opt;
                            yield* module.refreshApplicator();
                        }
                    }
                }
            );

            // reset applicator diameter dropdown
            module.dropDowns.ringDiameter.button.label = "Ring Diameter: " + module.applicator.ringDiameter + "mm";
            yield* addDropdownOptions(
                module.dropDowns.ringDiameter,
                [20, 25, 30, 35],
                (opt) => `${opt}mm`,
                (opt) => {
                    return function* () {
                        (yield new AlgebraicEffect("GET PARENT")).collapseDropdown();

                        let module = yield new AlgebraicEffect("GET MODULE");
                        if (module.applicator.ringDiameter != opt){
                            module.applicator.ringDiameter = opt;
                            yield* module.refreshApplicator();
                        }
                    }
                }
            );

            // reset applicator angle dropdown
            module.dropDowns.applicatorAngle.button.label = "Angle: " + module.applicator.angle + "deg";
            yield* addDropdownOptions(
                module.dropDowns.applicatorAngle,
                [30, 45, 60, 90],
                (opt) => `${opt}deg`,
                (opt) => {
                    return function* () {
                        (yield new AlgebraicEffect("GET PARENT")).collapseDropdown();

                        let module = yield new AlgebraicEffect("GET MODULE");
                        if (module.applicator.angle != opt){
                            module.applicator.angle = opt;
                            yield* module.refreshApplicator();
                        }
                    }
                }
            );

            // reset applicator model dropdown
            module.dropDowns.applicatorModel.button.label = "Applicator: tandem+ring";
            yield* addDropdownOptions(
                module.dropDowns.applicatorModel,
                ["VaginalCylinder", "tandem+ovoids","tandem+ring"],
                (opt) => `${opt}`,
                (opt) => {
                    return function* () {
                        (yield new AlgebraicEffect("GET PARENT")).collapseDropdown();

                        if (opt !== module.applicatorName){
                            yield* yield new AlgebraicEffect("LOAD APPLICATOR", opt);
                        }
                    }
                }
            );

            yield* module.graphs.graph1.refreshAnatomy();
            yield* module.graphs.graph2.refreshAnatomy();
            yield* module.graphs.graph3.refreshAnatomy();

            module.lastApplicatorLoaded = JSON.stringify(module.applicator);
            yield* module.onReload();
        }
    },
    onUpdate: function* () {
        ctx.clearRect(0,0,canvas.width,canvas.height);

        //draw nav bar
        let navButtons = Object.values(navBar);
        for (let i = 0; i < navButtons.length; i++){
            yield* navButtons[i].draw();
        }

        this.graphs.graph1.overlayAnatomy();
        this.graphs.graph2.overlayAnatomy();
        this.graphs.graph3.overlayAnatomy();

        yield* drawTandem("graph1", "coronal");
        yield* drawRing("graph1", "coronal");
        yield* drawTandem("graph2", "sagittal");
        yield* drawRing("graph2", "sagittal");
        yield* drawTandem("graph3", "axial");
        yield* drawRing("graph3", "axial");

        Object.values(this.graphs).forEach((graph) => {
            graph.drawGraph();
            graph.drawGraphSeeds();
            graph.drawRefPoints();
            graph.drawMouseLabel();
        });

        yield* this.labels.treatmentTime.draw();
        yield* this.labels.graph1AirKerma.draw();
        yield* this.labels.graph1ReferenceLeft.draw();
        yield* this.labels.graph1ReferenceRight.draw();
        yield* this.buttons.resetDwellTimes.draw();
        yield* this.sliders.graph1AirKerma.draw();

        if (this.graphs.graph1.selectedSeed != -1){
            yield* this.labels.graph1DwellTime.draw();
            yield* this.sliders.graph1DwellTime.draw();
        }

        yield* this.dropDowns.applicatorAngle.draw();
        yield* this.dropDowns.ringDiameter.draw();
        yield* this.dropDowns.applicatorLength.draw();
        yield* this.dropDowns.applicatorModel.draw();
        yield* this.dropDowns.graph1Model.draw();
    },
    onReload: function* () {
        refreshNavBar("brachytherapy applicators");

        // resize/draw graphs
        if (view.height <= view.width){
            let splitY = view.height * 0.25;

            Object.values(this.graphs).forEach((graph, ind) => {
                Object.assign(graph, getRegionBound(
                    {
                        x: (view.width / 3) * ind,
                        y: view.y + splitY,
                        width: view.width / 3,
                        height: view.height - splitY
                    },
                    {horizontal: 0, vertical: 0},
                    graph.unitWidth() / graph.unitHeight())
                );

                graph.refreshGraph();
            });

            this.graphs.graph1.rescaleAnatomy();
            this.graphs.graph2.rescaleAnatomy();
            this.graphs.graph3.rescaleAnatomy();

            let elmWidth = view.width / 5;
            let elmHeight = splitY / 3;
            let splitX = [
                0,
                elmWidth,
                elmWidth * 2,
                elmWidth * 3,
                elmWidth * 4
            ];
            splitY = [
                view.y,
                view.y + elmHeight,
                view.y + elmHeight * 2
            ];

            [
                this.labels.treatmentTime,      this.labels.graph1ReferenceLeft, this.labels.graph1ReferenceRight, this.buttons.resetDwellTimes, this.dropDowns.graph1Model,
                this.dropDowns.applicatorModel, this.dropDowns.applicatorLength, this.labels.graph1AirKerma,       this.labels.graph1DwellTime,  {},
                this.dropDowns.ringDiameter,    this.dropDowns.applicatorAngle,  this.sliders.graph1AirKerma,      this.sliders.graph1DwellTime
            ].forEach((elm, ind) => {
                let region = [
                    {
                        x: splitX[ind % splitX.length],
                        y: splitY[Math.floor(ind / splitX.length)],
                        width: elmWidth,
                        height: elmHeight
                    },
                    {horizontal: 0.2, vertical: 0.2}
                ];

                if (elm.constructor.name === "Dropdown"){
                    rescaleDropdownButtons(elm,...region);
                    return;
                }
                if (elm.constructor.name === "Slider"){
                    let regionBound = getRegionBound(...region);
                    Object.assign(elm, {
                        x: regionBound.x,
                        y: regionBound.y + elmHeight * 0.3,
                        length: regionBound.width,
                        thickness: regionBound.height * 0.2
                    });
                    return;
                }
                Object.assign(elm, getRegionBound(...region));
            });
        }else{
            let splitX = view.width * 0.2;

            Object.values(this.graphs).forEach((graph, ind) => {
                Object.assign(graph, getRegionBound(
                    {
                        x: splitX,
                        y: view.y + ((view.height / 3) * ind),
                        width: view.width - splitX,
                        height: (view.height / 3)
                    },
                    {horizontal: 0, vertical: 0},
                    graph.unitWidth() / graph.unitHeight())
                );

                graph.refreshGraph();
            });

            splitX = Math.min(
                this.graphs.graph1.graphDimensions.x,
                this.graphs.graph2.graphDimensions.x,
                this.graphs.graph3.graphDimensions.x
            );

            [
                this.labels.treatmentTime,
                this.labels.graph1ReferenceLeft,
                this.labels.graph1ReferenceRight,
                this.dropDowns.graph1Model,
                this.dropDowns.applicatorModel,
                this.dropDowns.applicatorLength,
                this.dropDowns.ringDiameter,
                this.dropDowns.applicatorAngle,
                this.labels.graph1AirKerma,
                this.sliders.graph1AirKerma,
                this.labels.graph1DwellTime,
                this.sliders.graph1DwellTime,
                this.buttons.resetDwellTimes,
            ].forEach((elm, ind, elmArr) => {
                let elmHeight = (view.height * 0.9) / elmArr.length;
                let region = [
                    {
                        x: 0,
                        y: view.y + ind * elmHeight,
                        width: splitX,
                        height: elmHeight
                    },
                    {horizontal: 0.2, vertical: 0.2}
                ];

                if (elm.constructor.name === "Dropdown"){
                    rescaleDropdownButtons(elm,...region);
                    return;
                }
                if (elm.constructor.name === "Slider"){
                    let regionBound = getRegionBound(...region);
                    Object.assign(elm, {
                        x: regionBound.x,
                        y: regionBound.y + elmHeight * 0.3,
                        length: regionBound.width,
                        thickness: regionBound.height * 0.2
                    });
                    return;
                }
                Object.assign(elm, getRegionBound(...region));
            });
        }

        yield* setEqualFont([
            this.labels.treatmentTime, this.labels.graph1ReferenceLeft, this.labels.graph1ReferenceRight, this.buttons.resetDwellTimes, this.dropDowns.graph1Model,
            this.dropDowns.applicatorModel, this.dropDowns.applicatorLength, this.labels.graph1AirKerma, this.labels.graph1DwellTime,
            this.dropDowns.ringDiameter, this.dropDowns.applicatorAngle, this.sliders.graph1AirKerma, this.sliders.graph1DwellTime
        ]);
    },
    defaultInputHandler: {
        onMouseDown: function* () {
            yield* this.labels.treatmentTime.checkClicked();
            yield* this.labels.graph1ReferenceLeft.checkClicked();
            yield* this.labels.graph1ReferenceRight.checkClicked();
            yield* this.buttons.resetDwellTimes.checkClicked();
            yield* this.labels.graph1AirKerma.checkClicked();
            yield* this.sliders.graph1AirKerma.checkClicked();
            yield* runUntilTrue(
                function* (){
                    let module = yield new AlgebraicEffect("GET MODULE");

                    yield yield* module.dropDowns.graph1Model.checkClicked();

                    yield yield* module.dropDowns.applicatorModel.checkClicked();
                    yield yield* module.dropDowns.applicatorLength.checkClicked();

                    if (!module.dropDowns.applicatorModel.showing){
                        yield yield* module.dropDowns.ringDiameter.checkClicked();
                    }
                    if (!module.dropDowns.applicatorLength.showing){
                        yield yield* module.dropDowns.applicatorAngle.checkClicked();
                    }

                    yield yield* module.labels.graph1DwellTime.checkClicked();
                    yield yield* module.sliders.graph1DwellTime.checkClicked();

                    for (let graph of Object.values(module.graphs)){
                        if (yield* graph.checkClicked()){
                            module.graphs.graph1.selectedSeed = graph.selectedSeed;
                            module.graphs.graph2.selectedSeed = graph.selectedSeed;
                            module.graphs.graph3.selectedSeed = graph.selectedSeed;
                            module.selectedGraph = graph.name;
                            return true;
                        }
                    }
                }
            )
        },
    }
});

function* drawRing(graphStr, view){
    let module = yield new AlgebraicEffect("GET MODULE");
    let applicator = module.applicator;
    let graph = module.graphs[graphStr];
    let cm = graph.unit();
    let mm = {
        width: cm.width / 10,
        height: cm.height / 10
    }
    let origin = graph.graphToScreenPos({x: 0, y: 0});

    let clippingRegion = new Path2D();
    clippingRegion.rect(
        graph.graphDimensions.x,
        graph.graphDimensions.y,
        graph.graphDimensions.width,
        graph.graphDimensions.height
    );

    // set clipping region so drawing does not go outside of graph
    ctx.save();
    ctx.clip(clippingRegion);

    backCtx.save();
    backCtx.clip(clippingRegion, "evenodd");

    ctx.lineWidth = 0.5 * mm.width;
    ctx.strokeStyle = "black";

    const innerRadius = (applicator.ringDiameter / 2) - 6; // in mm
    const outerRadius = (applicator.ringDiameter / 2) + 6; // in mm

    backCtx.lineWidth = 0.5 * mm.width;
    backCtx.strokeStyle = "black";

    if (view == "axial"){
        let ring = new Path2D();

        // draw inner ring
        ring.ellipse(
            origin.x,
            origin.y,
            outerRadius * mm.width,
            outerRadius * mm.height,
            0, 0, 2 * Math.PI
        );

        // draw outer ring
        ring.ellipse(
            origin.x,
            origin.y,
            innerRadius * mm.width,
            innerRadius * mm.height,
            0, 0, 2 * Math.PI
        );

        backCtx.fillStyle = "white";
        backCtx.clip(ring, "evenodd");
        backCtx.fill(ring);
        ctx.stroke(ring);
    } else if ((view == "sagittal") || (view == "coronal")){
        let leftRing = new Path2D();
        let rightRing = new Path2D();

        let cornerRadii = [
            (outerRadius - innerRadius) / 2 * mm.width, (outerRadius - innerRadius) / 2 * mm.width,
            (outerRadius - innerRadius) * mm.width / 4, (outerRadius - innerRadius) * mm.width / 4
        ];
        // draw left part of ring
        leftRing.roundRect(
            origin.x - outerRadius * mm.width,
            origin.y - 0.75 * cm.height,
            (outerRadius - innerRadius) * mm.width,
            1.25 * cm.height,
            cornerRadii
        );

        // draw right part of ring
        rightRing.roundRect(
            origin.x + innerRadius * mm.width,
            origin.y - 0.75 * cm.height,
            (outerRadius - innerRadius) * mm.width,
            1.25 * cm.height,
            cornerRadii
        );

        backCtx.fillStyle = "white";
        backCtx.fill(leftRing);
        backCtx.fill(rightRing);
        ctx.stroke(leftRing);
        ctx.stroke(rightRing);
    }

    ctx.restore();
    backCtx.restore();
}