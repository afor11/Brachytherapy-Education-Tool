import { TheraSeed200, Best2301, GammaMedHDRPlus, BEBIG_GK60M21, ElektaFlexisource, airKermaSliderLimits } from '../../constants.js';
import { Seed } from '../../seed.js';
import { Graph } from '../../graph.js';
import { Button } from '../../UIclasses/Button.js';
import { Module } from '../../module.js';
import { getRegionBound, getRange, referencePointLabel, dwellTimeLabel, airKermaLabel, modelDropdown, airKermaSlider, dwellTimeSlider, rescaleDropdownButtons, runUntilTrue, setDoseAtPoint, setDropdownProps, setEqualFont, multSeedDwellTimeSlider, multSeedDwellTimeLabel } from '../../utils.js';
import { refreshNavBar, navBar } from "../../navBar.js";
import { view } from '../../main.js';
import { NumberInput } from '../../UIclasses/NumberInput.js';
import { AlgebraicEffect, chainEffectHandler, effectHandler } from '../../algebraicEffect.js';
import { Dropdown } from '../../UIclasses/Dropdown.js';

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
                module.onReload();
            },
        })
    },
    dropDowns: {
        graph1Model: modelDropdown([GammaMedHDRPlus, BEBIG_GK60M21, ElektaFlexisource],"graph1",GammaMedHDRPlus.name),
        applicatorModel: blankDropdown("Vaginal Cylinder"),
        applicatorLength: blankDropdown("Length: 30mm"),
        applicatorDiameter: blankDropdown("Diameter: 30mm")
    },
    specialVars: {
        applicator: {
            length: 30,
            diameter: 20
        },
        menu: {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        },
        applicatorLoaded: "",
        *refreshApplicator(){
            let module = yield new AlgebraicEffect("GET MODULE");
            
            if (module.lastApplicatorLoaded !== JSON.stringify(module.applicator)){
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

                // reset applicator length dropdown
                module.dropDowns.applicatorLength.button.label = "Length: " + module.applicator.length + "mm";
                
                yield* addDropdownOptions(
                    module.dropDowns.applicatorLength,
                    [30, 40, 50, 60],
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
                module.dropDowns.applicatorDiameter.button.label = "Diameter: " + module.applicator.diameter + "mm";
                yield* addDropdownOptions(
                    module.dropDowns.applicatorDiameter,
                    [20, 25, 30, 35],
                    (opt) => `${opt}mm`,
                    (opt) => {
                        return function* () {
                            (yield new AlgebraicEffect("GET PARENT")).collapseDropdown();

                            let module = yield new AlgebraicEffect("GET MODULE");
                            if (module.applicator.diameter != opt){
                                module.applicator.diameter = opt;
                                yield* module.refreshApplicator();
                            }
                        }
                    }
                );

                // reset applicator model dropdown
                module.dropDowns.applicatorModel.button.label = "Applicator: vaginal cylinder";
                yield* addDropdownOptions(
                    module.dropDowns.applicatorModel,
                    ["vaginal cylinder", "tandem+ovoids","tandem+ring"],
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
            }

            if (module.graphs.graph1.selectedSeed != -1){
                module.graphs.graph1.selectedSeed = Math.min(
                    module.graphs.graph1.seeds.length - 1,
                    module.graphs.graph1.selectedSeed
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

            module.lastApplicatorLoaded = JSON.stringify(module.applicator);
            yield* module.onReload(this);
        }
    },
    onUpdate: function* () {
        ctx.clearRect(0,0,canvas.width,canvas.height);

        //draw nav bar
        let navButtons = Object.values(navBar);
        for (let i = 0; i < navButtons.length; i++){
            yield* navButtons[i].draw();
        }

        if (this.graphs.graph1.selectedSeed != -1){
            yield* this.labels.graph1DwellTime.draw();
            yield* this.sliders.graph1DwellTime.draw();

            ctx.lineWidth = Math.min(canvas.width,canvas.height) * 0.005;
            ctx.beginPath();
            ctx.rect(this.menu.x, this.menu.y, this.menu.width, this.menu.height);
            ctx.stroke();

            let graph = this.graphs.graph1;
            let seedScreenPos = graph.graphToScreenPos(
                graph.perspective(
                    graph.seeds[graph.selectedSeed].pos
                )
            );
            ctx.beginPath();
            ctx.moveTo(seedScreenPos.x, seedScreenPos.y);
            ctx.lineTo(this.menu.x, this.menu.y);
            ctx.stroke();
        }

        this.graphs.graph1.drawGraphSeeds();
        this.graphs.graph1.drawRefPoints();
        this.graphs.graph1.drawMouseLabel();

        yield* this.labels.treatmentTime.draw();
        yield* this.labels.graph1Reference.draw();
        yield* this.labels.graph1AirKerma.draw();

        yield* this.sliders.graph1AirKerma.draw();

        yield* this.buttons.resetDwellTimes.draw();

        yield* this.dropDowns.applicatorDiameter.draw();
        yield* this.dropDowns.applicatorLength.draw();
        yield* this.dropDowns.applicatorModel.draw();

        yield* this.dropDowns.graph1Model.draw();
    },
    onReload: function* () {
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
            this.dropDowns.graph1Model,
            this.labels.graph1AirKerma,
            this.sliders.graph1AirKerma
        ].forEach((elm, ind) => {
            let region = [
                {
                    x: 0,
                    y: view.y + yStep * ind,
                    width: splitX,
                    height: yStep
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
                    y: regionBound.y + yStep * 0.3,
                    length: regionBound.width,
                    thickness: regionBound.height * 0.2
                });
                return;
            }
            Object.assign(elm, getRegionBound(...region));
        });

        // rescale applicator dropdowns
        setDropdownProps(this.dropDowns.applicatorModel, {
            button: getRegionBound({
                x: 0,
                y: view.y + yStep * 6,
                width: splitX,
                height: yStep
            }, {horizontal: 0.2, vertical: 0.2}),
            optionProps: (ind) => getRegionBound({
                x: splitX * 0.9 + (splitX * 0.3) * ind,
                y: view.y + yStep * 6,
                width: splitX * 0.3,
                height: yStep
            }, {horizontal: 0, vertical: 0.2})
        });

        [
            this.dropDowns.applicatorLength,
            this.dropDowns.applicatorDiameter
        ].forEach((appDropdown, yInd) => {
            setDropdownProps(appDropdown, {
                button: getRegionBound({
                    x: 0,
                    y: view.y + yStep * (7 + yInd),
                    width: splitX,
                    height: yStep
                }, {horizontal: 0.2, vertical: 0.2}),
                optionProps: (ind) => getRegionBound({
                    x: splitX * 0.9 + (splitX * 0.15) * ind,
                    y: view.y + yStep * (7 + yInd),
                    width: splitX * 0.15,
                    height: yStep
                }, {horizontal: 0, vertical: 0.2})
            });
        });

        if (this.graphs.graph1.selectedSeed != -1){
            // get the position of the menu
            let graph = this.graphs.graph1;
            let seedScreenPos = graph.graphToScreenPos(
                graph.perspective(
                    graph.seeds[graph.selectedSeed].pos
                )
            );
            this.menu = {
                x: seedScreenPos.x + view.width * 0.2,
                y: seedScreenPos.y,
                width: view.width * 0.2,
                height: view.height * 0.1
            };
            if ((this.menu.x + this.menu.width) > view.width){
                this.menu.x -= this.menu.width + view.width * 0.4;
            }

            // split the menu into two halves and fit the label and slider to their respective halves
            let halfMenuBound = {
                x: this.menu.x,
                y: this.menu.y,
                width: this.menu.width,
                height: this.menu.height / 2
            };
            Object.assign(this.labels.graph1DwellTime, getRegionBound(halfMenuBound, {horizontal: 0.2, vertical: 0.2}));

            halfMenuBound.y += halfMenuBound.height * 1.25;
            let regionBound = getRegionBound(halfMenuBound, {horizontal: 0.2, vertical: 0.2});
            Object.assign(this.sliders.graph1DwellTime, {
                x: regionBound.x,
                y: regionBound.y,
                length: regionBound.width,
                thickness: regionBound.height * 0.2
            });
        }

        setEqualFont([
            this.buttons.resetDwellTimes,
            this.dropDowns.graph1Model,
            this.dropDowns.applicatorModel,
            this.dropDowns.applicatorLength,
            this.dropDowns.applicatorDiameter,
        ]);
    },
    defaultInputHandler: {
        onMouseDown: function* () {
            yield* runUntilTrue(
                function* (){
                    let module = yield new AlgebraicEffect("GET MODULE");

                    yield yield* module.labels.treatmentTime.checkClicked();
                    yield yield* module.labels.graph1Reference.checkClicked();

                    yield yield* module.buttons.resetDwellTimes.checkClicked();

                    if (!module.dropDowns.graph1Model.showing){
                        yield yield* module.labels.graph1AirKerma.checkClicked();
                        yield yield* module.sliders.graph1AirKerma.checkClicked();

                        yield yield* module.dropDowns.applicatorModel.checkClicked();
                        yield yield* module.dropDowns.applicatorLength.checkClicked();
                        yield yield* module.dropDowns.applicatorDiameter.checkClicked();
                    }

                    if (module.graphs.graph1.selectedSeed != -1){
                        yield yield* module.labels.graph1DwellTime.checkClicked();
                        yield yield* module.sliders.graph1DwellTime.checkClicked();
                    }

                    yield yield* module.dropDowns.graph1Model.checkClicked();

                    if (yield* module.graphs.graph1.checkClicked()){
                        module.onReload();
                        return true;
                    }
                }
            )
        },
    }
});

function blankDropdown(buttonText){
    return new Dropdown(
        new Button({
            x: 0, y: 0, width: 0, height: 0, bgColor: "white",
            onClick: () => {},
            label: {text: buttonText, font: "default", color: "black"},
            outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.01}}
        ),[]
    )
}

function *addDropdownOptions(dropdown, options, text, onClick, module){
    if (typeof module === "undefined"){
        module = yield new AlgebraicEffect("GET MODULE");
    }
    dropdown.options = [];
    for (let opt of options){
        dropdown.options.push(
            new Button({
                x: 0, y: 0, width: 0, height: 0, bgColor: "white",
                label: {
                    text: text(opt),
                    font: "default",
                    color: "black"
                },
                outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
                onClick: onClick(opt),
            })
        );
    }
}