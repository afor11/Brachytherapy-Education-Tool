import { TheraSeed200, Best2301, GammaMedHDRPlus, BEBIG_GK60M21, ElektaFlexisource, airKermaSliderLimits, colorPalette } from '../constants.js';
import { Seed } from '../seed.js';
import { Graph } from '../graph.js';
import { Module } from '../module.js';
import { getRegionBound, getRange, toggleSeedEnable, referencePointLabel, multSeedDwellTimeLabel, airKermaLabel, modelDropdown, airKermaSlider, multSeedDwellTimeSlider, rescaleDropdownButtons, runUntilTrue, clamp, runFn, expandOnHover } from '../utils.js';
import { refreshNavBar, navBar } from "../navBar.js";
import { view } from "../main.js";
import { Button } from '../UIclasses/Button.js';
import { Slider } from '../UIclasses/Slider.js';
import { NumberInput } from '../UIclasses/NumberInput.js';
import { AlgebraicEffect } from '../algebraicEffect.js';

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
const thisModule = "string of seeds";

export let stringofseedsPage = new Module({
    graphs: {
        graph1: new Graph({
            x: 0, y: 0, width: 0, height: 0,
            seeds: [
                new Seed({x:0, y:0, z:0},{phi: 0, theta: 0},TheraSeed200,airKermaSliderLimits[TheraSeed200.isotope].min,0.00833)
            ],
            xTicks: getRange(-10, 10, 0.0625),
            yTicks: getRange(-2, 2, 0.0625),
            perspective: (point) => point,
            name: "graph1",
            refpoints: [{x: 0, y: 1, z: 0}],
        }),
    },
    sliders: {
        graph1AirKerma: airKermaSlider("graph1"),
        graph1DwellTime: multSeedDwellTimeSlider("graph1"),
        graph1Seedspacing: new Slider({
            x: 0, y: 0, length: 0, angle: 0, color: colorPalette.accent, thickness: 0,
            updateValue: function* (value) {
                let module = yield new AlgebraicEffect("GET MODULE");
                module.seedSpacing = 0.5 + value;
                yield* runFn(module.onReload)
            },
            getValue: function* () {
                return clamp((yield new AlgebraicEffect("GET MODULE")).seedSpacing, 0.5, 1.5) - 0.5;
            }
        })
    },
    specialVars: {
        seedSpacing: 1
    },
    dropDowns: {
        graph1Model: modelDropdown([TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource],"graph1",TheraSeed200),
    },
    labels: {
        graph1AirKerma: airKermaLabel("graph1"),
        graph1DwellTime: multSeedDwellTimeLabel("graph1"),
        graph1Reference: referencePointLabel("graph1",0),
        graph1Seedspacing: new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Seed Spacing: ${value} cm`,
                color: {selected: colorPalette.primary, notSelected: colorPalette.accent}
            },bgColor: {selected: colorPalette.secondary, notSelected: colorPalette.primary},
            getValue: function* () {
                return (yield new AlgebraicEffect("GET MODULE")).seedSpacing;
            },
            onEnter: function* (value){
                let module = yield new AlgebraicEffect("GET MODULE");
                module.seedSpacing = clamp(value, 0.5, 1.5);
                yield* runFn(module.onReload);
            },
            numDecimalsEditing: 2,
            animate: function* () {yield* expandOnHover(false)},
        })
    },
    buttons: {
        graph1EnableSeed: toggleSeedEnable("graph1",function () {return this.graphs.graph1.selectedSeed}),
        graph1AddSeed: new Button({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: "Add Seed",
                font: "default",
                color: colorPalette.accent
            },
            bgColor: colorPalette.green.dark,
            onClick: function* () {
                let module = yield new AlgebraicEffect("GET MODULE");
                module.graphs.graph1.seeds.push(
                    new Seed(
                        {x: 0, y: 0, z: 0},
                        {phi: 0, theta: 0},
                        module.graphs.graph1.seeds[0].model,
                        module.graphs.graph1.seeds[0].airKerma,
                        0.00833
                    )
                );
                yield* runFn(module.onReload)
            },
            outline: {color: colorPalette.accent, thickness: 0},
            animate: expandOnHover,
            hoverCol: colorPalette.green.light,
        }),
        graph1RemoveSeed: new Button({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: "Remove Seed",
                font: "default",
                color: colorPalette.accent
            },
            bgColor: colorPalette.red.dark,
            onClick: function* () {
                let module = yield new AlgebraicEffect("GET MODULE");
                if (module.graphs.graph1.seeds.length > 1){
                    if (module.graphs.graph1.selectedSeed != -1){
                        module.graphs.graph1.selectedSeed = Math.max(module.graphs.graph1.selectedSeed - 1,0);
                    }
                    module.graphs.graph1.seeds.pop();
                    yield* runFn(module.onReload)
                }
            },
            outline: {color: colorPalette.accent, thickness: 0},
            animate: expandOnHover,
            hoverCol: colorPalette.red.light,
        })
    },
    onUpdate: function* () {
        //reset canvas
        ctx.clearRect(0,0,canvas.width,canvas.height);

        //draw nav bar
        let navButtons = Object.values(navBar);
        for (let i = 0; i < navButtons.length; i++){
            yield* navButtons[i].draw();
        }

        // draw air kerma label and slider
        yield* this.labels.graph1AirKerma.draw();
        yield* this.sliders.graph1AirKerma.draw();

        // draw seed spacing label and slider
        yield* this.sliders.graph1Seedspacing.draw();
        yield* this.labels.graph1Seedspacing.draw();

        // draw the dwell time slider if using HDR source or
        // enable/disable source toggle otherwise
        if (this.graphs.graph1.selectedSeed != -1){
            if (this.graphs.graph1.seeds[0].model.HDRsource){
                yield* this.labels.graph1DwellTime.draw();
                yield* this.sliders.graph1DwellTime.draw();
            }else{
                yield* this.buttons.graph1EnableSeed.draw();
            }
        }

        // draw model dropdown
        yield* this.dropDowns.graph1Model.draw();

        // draw graph 1 seeds/reference point + label/mouse label
        this.graphs.graph1.drawGraph();
        this.graphs.graph1.drawGraphSeeds();
        this.graphs.graph1.drawRefPoints();
        yield* this.labels.graph1Reference.draw();
        this.graphs.graph1.drawMouseLabel();

        // draw the add seed button
        yield* this.buttons.graph1AddSeed.draw();
        yield* this.buttons.graph1RemoveSeed.draw();
    },
    onReload: function* () {
        refreshNavBar(thisModule);

        // space seeds based on seed spacing
        let numSeeds = this.graphs.graph1.seeds.length;
        this.graphs.graph1.seeds.forEach((seed, ind) => {
            seed.pos.x = (ind - ((numSeeds - 1) / 2)) * this.seedSpacing;
        });

        let splitY = view.height * 0.25;
        let splitX = view.width / 2;

        //resize graphs
        Object.assign(this.graphs.graph1, getRegionBound({
            x: 0,
            y: view.y + splitY,
            width: view.width,
            height: view.height - splitY
        }, {horizontal: 0, vertical: 0}));

        this.graphs.graph1.refreshGraph();

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

        yield* runFn(this.onUpdate);
    },
    defaultInputHandler: {
        onMouseDown: function* () {
            yield* runUntilTrue(
                function* () {
                    // the yield yield* notation may be a little confusing, so here is a little explination:
                    // yield* actually gets evaluated first, it turns the generation over to the given generator
                    // (in these cases, a click check), so that it has access to Algebraic Effects. The first
                    // yield then simply tells the runUntilTrue function to consider the output of that generator
                    // function once it finishes; if it is true, runUntilTrue can halt execution. This is useful
                    // if you don't want the mouse to trigger more than one checkClick generator per onMouseDown
                    // event call. In human, it ensures the user cannot interact with on more than one element
                    // per click.
                    let module = yield new AlgebraicEffect("GET MODULE");

                    //UI around graph1
                    if (!module.dropDowns.graph1Model.showing){
                        yield yield* module.labels.graph1AirKerma.checkClicked();
                        yield yield* module.sliders.graph1AirKerma.checkClicked();
                    
                        if (module.graphs.graph1.selectedSeed != -1){
                            if (module.graphs.graph1.seeds[0].model.HDRsource){
                                yield yield* module.labels.graph1DwellTime.checkClicked();
                                yield yield* module.sliders.graph1DwellTime.checkClicked();
                            }else{
                                yield yield* module.buttons.graph1EnableSeed.checkClicked();
                            }
                        }
                    }
                    //Check for dropdown clicked
                    yield yield* module.dropDowns.graph1Model.checkClicked();
                    yield yield* module.labels.graph1Reference.checkClicked();
                    
                    yield yield* module.sliders.graph1Seedspacing.checkClicked();
                    yield yield* module.labels.graph1Seedspacing.checkClicked();

                    yield yield* module.buttons.graph1AddSeed.checkClicked();
                    yield yield* module.buttons.graph1RemoveSeed.checkClicked();

                    // checking if the graph seeds are clicked should always be the last yield statement
                    yield yield* module.graphs.graph1.checkClicked();
                }
            );
        }
    }
})