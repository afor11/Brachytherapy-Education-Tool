import { TheraSeed200, Best2301, GammaMedHDRPlus, BEBIG_GK60M21, ElektaFlexisource, airKermaSliderLimits } from '../constants.js';
import { Seed } from '../seed.js';
import { Graph } from '../graph.js';
import { Module } from '../module.js';
import { getRegionBound, getRange, toggleSeedEnable, referencePointLabel, multSeedDwellTimeLabel, airKermaLabel, modelDropdown, airKermaSlider, multSeedDwellTimeSlider, rescaleDropdownButtons } from '../utils.js';
import { refreshNavBar, navBar } from "../navBar.js";
import { moduleData, view } from "../main.js";
import { Button } from '../UIclasses/Button.js';
import { Slider } from '../UIclasses/Slider.js';
import { NumberInput } from '../UIclasses/NumberInput.js';

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
const thisModule = "string of seeds";

export let stringofseedsPage = new Module({
    graphs: {
        graph1: new Graph({
            x: 0, y: 0, width: 0, height: 0,
            seeds: [
                new Seed({x:0, y:0, z:0},{phi: 0, theta: 0},TheraSeed200,airKermaSliderLimits.LDR.min,0.00833)
            ],
            xTicks: getRange(-10, 10, 0.125), yTicks: getRange(-2, 2, 0.0625), perspective: (point) => point, name: "graph1", refpoints: [{x: 0, y: 1, z: 0}]
        }),
    },
    sliders: {
        graph1AirKerma: function() {return airKermaSlider(moduleData,thisModule,"graph1");},
        graph1DwellTime: function() {return multSeedDwellTimeSlider(moduleData,thisModule,"graph1");},
        graph1Seedspacing: function() {
            return new Slider({
                x: 0, y: 0, length: 0, angle: 0, color: "black", thickness: 0,
                updateValue: function (value) {
                    this.module.seedSpacing = 0.5 + value;
                    this.module.onReload();
                },
                getValue: () => moduleData[thisModule].seedSpacing - 0.5
            });
        }
    },
    specialVars: {
        seedSpacing: 1
    },
    dropDowns: {
        graph1Model: function() {return modelDropdown([TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource],"graph1",TheraSeed200.name);},
    },
    labels: {
        graph1AirKerma: function() {return airKermaLabel(moduleData,thisModule,"graph1");},
        graph1DwellTime: function() {return multSeedDwellTimeLabel(moduleData,thisModule,"graph1");},
        graph1Reference: function() {return referencePointLabel(moduleData,thisModule,"graph1",0);},
        graph1Seedspacing: function() {
            return new NumberInput({
                x: 0, y: 0, width: 0, height: 0,
                label: {
                    text: (value) => `Seed Spacing: ${value} cm`,
                    color: {selected: "white", notSelected: "black"}
                },bgColor: {selected: "black", notSelected: "white"},
                getValue: () => moduleData[thisModule].seedSpacing,
                onEnter: function (value){
                    this.module.seedSpacing = value;
                },
                numDecimalsEditing: 2
            });
        },
    },
    buttons: {
        graph1EnableSeed: function() {return toggleSeedEnable("graph1",function () {return this.graphs.graph1.selectedSeed})},
        graph1AddSeed: function() {
            return new Button({
                x: 0, y: 0, width: 0, height: 0,
                label: {
                    text: "Add Seed",
                    font: "default",
                    color: "black"
                },
                bgColor: "#50C878",
                onClick: function () {
                    let model = this.module.graphs.graph1.seeds[0].model;
                    this.module.graphs.graph1.seeds.push(
                        new Seed(
                            {x: 0, y: 0, z: 0},
                            {phi: 0, theta: 0},
                            this.module.graphs.graph1.seeds[0].model,
                            (model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min),
                            0.00833
                        )
                    );
                    this.module.onReload();
                },
                outline: {color: "black", thickness: 0}
            });
        },
        graph1RemoveSeed: function() {
            return new Button({
                x: 0, y: 0, width: 0, height: 0,
                label: {
                    text: "Remove Seed",
                    font: "default",
                    color: "black"
                },
                bgColor: "#EE4B2B",
                onClick: function () {
                    if (this.module.graphs.graph1.seeds.length > 1){
                        this.module.graphs.graph1.seeds.pop();
                        this.module.onReload();
                    }
                },
                outline: {color: "black", thickness: 0}
            });
        }
    },
    onUpdate: function () {
        //reset canvas
        ctx.clearRect(0,0,canvas.width,canvas.height);

        //draw nav bar
        Object.values(navBar).forEach((button) => {
            button.draw();
        });

        // draw air kerma label and slider
        this.labels.graph1AirKerma.draw();
        this.sliders.graph1AirKerma.draw();

        // draw seed spacing label and slider
        this.sliders.graph1Seedspacing.draw();
        this.labels.graph1Seedspacing.draw();

        // draw the dwell time slider if using HDR source or
        // enable/disable source toggle otherwise
        if (this.graphs.graph1.selectedSeed != -1){
            if (this.graphs.graph1.seeds[0].model.HDRsource){
                this.labels.graph1DwellTime.draw();
                this.sliders.graph1DwellTime.draw();
            }else{
                this.buttons.graph1EnableSeed.draw();
            }
        }

        // draw model dropdown
        this.dropDowns.graph1Model.draw();

        // draw graph 1 seeds/reference point + label/mouse label
        this.graphs.graph1.drawGraphSeeds();
        this.graphs.graph1.drawRefPoints();
        this.labels.graph1Reference.draw();
        this.graphs.graph1.drawMouseLabel();

        // draw the add seed button
        this.buttons.graph1AddSeed.draw();
        this.buttons.graph1RemoveSeed.draw();
    },
    onReload: function () {
        refreshNavBar(thisModule);

        // space seeds based on seed spacing
        let numSeeds = this.graphs.graph1.seeds.length;
        this.graphs.graph1.seeds.forEach((seed, ind) => {
            seed.pos.x = (ind - ((numSeeds - 1) / 2)) * this.seedSpacing;
        });

        let graph2Div = document.getElementById("graph2");
        let graph3Div = document.getElementById("graph3");
        if (graph2Div.innerHTML !== ""){
            graph2Div.innerHTML = "";
        }
        if (graph3Div.innerHTML !== ""){
            graph3Div.innerHTML = "";
        }

        let splitY = view.height * 0.25;
        let splitX = view.width / 2;

        //resize graphs
        Object.assign(this.graphs.graph1, getRegionBound({
            x: 0,
            y: view.y + splitY,
            width: view.width,
            height: view.height - splitY
        }, {horizontal: 0, vertical: 0}));

        Object.values(this.graphs).forEach((graph) => {
            graph.drawGraph(document.getElementById(graph.name));
        });

        //resize dropdowns
        rescaleDropdownButtons(this.dropDowns.graph1Model,{
            x: 0,
            y: view.y,
            width: splitX,
            height: splitY / 5
        }, {horizontal: 0.2, vertical: 0.2});

        //resize labels
        Object.assign(this.labels.graph1AirKerma, getRegionBound({
            x: 0,
            y: view.y + splitY / 5,
            width: splitX,
            height: splitY / 5
        }, {horizontal: 0.2, vertical: 0.2}));

        Object.assign(this.labels.graph1DwellTime, getRegionBound({
            x: 0,
            y: view.y + (splitY / 5) * 3,
            width: splitX,
            height: splitY / 5
        }, {horizontal: 0.2, vertical: 0.2}));

        Object.assign(this.labels.graph1Seedspacing, getRegionBound({
            x: splitX,
            y: view.y,
            width: splitX,
            height: splitY / 5
        }, {horizontal: 0.2, vertical: 0.2}));

        //resize sliders
        let sliderBoundsLeft = getRegionBound({
            x: 0,
            y: view.y + (splitY / 5) * 2.5,
            width: splitX,
            height: splitY / 5
        }, {horizontal: 0.2, vertical: 0.2});

        Object.assign(this.sliders.graph1AirKerma, {
            x: sliderBoundsLeft.x,
            y: sliderBoundsLeft.y,
            length: sliderBoundsLeft.width,
            thickness: sliderBoundsLeft.height * 0.4
        });

        Object.assign(this.sliders.graph1DwellTime, {
            x: sliderBoundsLeft.x,
            y: sliderBoundsLeft.y + (splitY / 5) * 2,
            length: sliderBoundsLeft.width,
            thickness: sliderBoundsLeft.height * 0.4
        });

        let sliderBoundsRight = getRegionBound({
            x: splitX,
            y: view.y,
            width: splitX,
            height: splitY / 5
        }, {horizontal: 0.2, vertical: 0.2});

        Object.assign(this.sliders.graph1Seedspacing, {
            x: sliderBoundsRight.x,
            y: sliderBoundsRight.y + (splitY / 5) * 1.5,
            length: sliderBoundsRight.width,
            thickness: sliderBoundsRight.height * 0.4
        });

        //resize reference dose labels
        let labelPos = this.graphs.graph1.graphToScreenPos(this.graphs.graph1.refpoints[0]);
        Object.assign(this.labels.graph1Reference, {
            x: labelPos.x,
            y: labelPos.y,
            width: this.graphs.graph1.graphDimensions.width * 0.27,
            height: this.graphs.graph1.graphDimensions.height * 0.09,
        });

        //resize buttons
        Object.assign(this.buttons.graph1EnableSeed, getRegionBound({
            x: 0,
            y: view.y + (splitY / 5) * 3,
            width: splitX,
            height: splitY / 5
        }, {horizontal: 0.2, vertical: 0.2}));

        Object.assign(this.buttons.graph1AddSeed, getRegionBound({
            x: splitX,
            y: view.y + (splitY / 5) * 2,
            width: splitX,
            height: splitY / 5
        }, {horizontal: 0.2, vertical: 0.2}));

        Object.assign(this.buttons.graph1RemoveSeed, getRegionBound({
            x: splitX,
            y: view.y + (splitY / 5) * 3,
            width: splitX,
            height: splitY / 5
        }, {horizontal: 0.2, vertical: 0.2}));

        this.onUpdate();
    },
    defaultInputHandler: {
        onMouseDown: function* () {
            //Check for dropdown clicked
            yield this.dropDowns.graph1Model.checkClicked();

            //UI around graph1
            if (!this.dropDowns.graph1Model.showing){
                yield this.labels.graph1AirKerma.checkClicked();
                yield this.sliders.graph1AirKerma.checkClicked();
            
                if (this.graphs.graph1.selectedSeed != -1){
                    if (this.graphs.graph1.seeds[0].model.HDRsource){
                        yield this.labels.graph1DwellTime.checkClicked();
                        yield this.sliders.graph1DwellTime.checkClicked();
                    }else{
                        yield this.buttons.graph1EnableSeed.checkClicked();
                    }
                }
            }
            yield this.labels.graph1Reference.checkClicked();
            
            yield this.sliders.graph1Seedspacing.checkClicked();
            yield this.labels.graph1Seedspacing.checkClicked();

            yield this.buttons.graph1AddSeed.checkClicked();
            yield this.buttons.graph1RemoveSeed.checkClicked();

            // checking if the graph seeds are clicked should always be the last yield statement
            yield this.graphs.graph1.checkClicked();
        }
    }
})