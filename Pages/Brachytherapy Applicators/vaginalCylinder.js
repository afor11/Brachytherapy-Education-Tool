import { TheraSeed200, Best2301, GammaMedHDRPlus, BEBIG_GK60M21, ElektaFlexisource, airKermaSliderLimits } from '../../constants.js';
import { Seed } from '../../seed.js';
import { Graph } from '../../graph.js';
import { Button } from '../../UIclasses/Button.js';
import { Module } from '../../module.js';
import { getRegionBound, getRange, referencePointLabel, dwellTimeLabel, airKermaLabel, modelDropdown, airKermaSlider, dwellTimeSlider, rescaleDropdownButtons, runUntilTrue, setDoseAtPoint } from '../../utils.js';
import { refreshNavBar, navBar } from "../../navBar.js";
import { view } from "../../main.js";
import { NumberInput } from '../../UIclasses/NumberInput.js';
import { AlgebraicEffect, effectHandler } from '../../algebraicEffect.js';

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

export let vaginalCylinderPage = new Module({
    graphs: {
        graph1: new Graph({
            x: 0, y: 0, width: 0, height: 0,
            seeds: [],
            xTicks: getRange(-2, 2, 0.0625), yTicks: getRange(-2, 6, 0.0625), perspective: (point) => point, name: "graph1", refpoints: [{x: 2, y: 2, z: 0}]
        }),
    },
    labels: {
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
        graph1Reference: new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `5mm Depth Dose: ${value} Gy`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: function* () {
                let module = yield new AlgebraicEffect("GET MODULE");
                return module.graphs.graph1.getPointDose(module.graphs.graph1.refpoints[0]);
            },
            onEnter: function* (value){
                let module = yield new AlgebraicEffect("GET MODULE");
                setDoseAtPoint(
                    module.graphs.graph1,
                    value,
                    module,
                    module.graphs.graph1.refpoints[0]
                );
            },
            numDecimalsEditing: 3
        })
    },
    buttons: {
        resetDwellTimes: new Button({
            x: 0, y: 0, width: 0, height: 0, bgColor: "black",
            label: {
                text: "Reset Dwell Times",
                font: "default",
                color: "white"
            },
            outline: {color: "black", thickness: 0},
            onClick: function* () {
                let module = yield new AlgebraicEffect("GET MODULE");
                module.graphs.graph1.seeds.forEach((seed) => {
                    seed.dwellTime = 0.00833;
                });
                module.onReload();
            },
        })
    },
    dropDowns: {
        graph1Model: modelDropdown([GammaMedHDRPlus, BEBIG_GK60M21, ElektaFlexisource],"graph1",GammaMedHDRPlus.name)
    },
    specialVars: {
        applicator: {
            length: 30,
            diameter: 20
        },
        *refreshApplicator(){
            let module = yield new AlgebraicEffect("GET MODULE");

            // get seed model
            let seedModel = GammaMedHDRPlus;
            if (module.graphs.graph1.seeds.length > 0){
                seedModel = module.graphs.graph1.seeds[0].model;
            }

            // push seeds
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

            // set xTicks and yTicks to fit applicator
            module.graphs.graph1.xTicks = getRange(
                -(module.applicator.diameter / 10) / 2 - 1,
                (module.applicator.diameter / 10) / 2 + 1,
                0.125
            );
            module.graphs.graph1.yTicks = getRange(
                -2,
                (module.applicator.length / 10) + 2,
                0.125
            );

            // set reference point
            module.graphs.graph1.refpoints = [{
                x: (module.applicator.diameter / 10) / 2 + 0.5,
                y: ((module.applicator.length / 10) - 0.7) / 2, z: 0}
            ];
        }
    },
    onUpdate: function () {
        let thisModule = this;
        effectHandler({
            tryCode: function* (){
                let module = yield new AlgebraicEffect("GET MODULE");
                ctx.clearRect(0,0,canvas.width,canvas.height);

                //draw nav bar
                let navButtons = Object.values(navBar);
                for (let i = 0; i < navButtons.length; i++){
                    yield* navButtons[i].draw();
                }

                yield* module.labels.treatmentTime.draw();
                yield* module.labels.graph1Reference.draw();

                module.graphs.graph1.drawMouseLabel();
                module.graphs.graph1.drawGraphSeeds();
                module.graphs.graph1.drawRefPoints();
                yield* module.dropDowns.graph1Model.draw();

                yield* module.buttons.resetDwellTimes.draw();
            },
            handleCode: function (effect) {
                if (effect === "GET MODULE"){
                    return thisModule;
                }
            }
        });
    },
    onReload: function () {
        refreshNavBar("brachytherapy applicators");

        let graph2Div = document.getElementById("graph2");
        let graph3Div = document.getElementById("graph3");
        if (graph2Div.innerHTML !== ""){
            graph2Div.innerHTML = "";
        }
        if (graph3Div.innerHTML !== ""){
            graph3Div.innerHTML = "";
        }

        let splitX = view.width * 0.2;
        let yStep = view.height * 0.1;

        //resize graphs
        Object.assign(this.graphs.graph1, getRegionBound(
            {
                x: splitX,
                y: view.y,
                width: view.width - splitX,
                height: view.height
            },
            {horizontal: 0, vertical: 0},
            this.graphs.graph1.unitWidth() / this.graphs.graph1.unitHeight())
        );

        this.graphs.graph1.drawGraph(document.getElementById("graph1"));

        splitX = this.graphs.graph1.graphDimensions.x;

        // resize elements (in order of height on page, top to bottom)
        [
            this.labels.treatmentTime,
            this.labels.graph1Reference,
            this.buttons.resetDwellTimes,
            this.dropDowns.graph1Model
        ].forEach((elm, ind) => {
            if (elm.constructor.name === "Dropdown"){
                rescaleDropdownButtons(elm,{
                    x: 0,
                    y: view.y + yStep * ind,
                    width: splitX,
                    height: yStep
                }, {horizontal: 0.2, vertical: 0.2});
            }
            Object.assign(elm, getRegionBound({
                x: 0,
                y: view.y + yStep * ind,
                width: splitX,
                height: yStep
            }, {horizontal: 0.2, vertical: 0.2}));
        });

        this.onUpdate();
    },
    defaultInputHandler: {
        onMouseDown: function* () {
            yield* runUntilTrue(
                function* (){
                    let module = yield new AlgebraicEffect("GET MODULE");

                    yield yield* module.dropDowns.graph1Model.checkClicked();

                    yield yield* module.labels.treatmentTime.checkClicked();
                    yield yield* module.labels.graph1Reference.checkClicked();

                    yield yield* module.buttons.resetDwellTimes.checkClicked();
                }
            )
        },
    }
});