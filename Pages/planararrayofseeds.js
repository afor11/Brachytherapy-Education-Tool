import { TheraSeed200, Best2301, GammaMedHDRPlus, BEBIG_GK60M21, ElektaFlexisource, airKermaSliderLimits } from '../constants.js';
import { Seed } from '../seed.js';
import { Graph } from '../graph.js';
import { Module } from '../module.js';
import { getRegionBound, getRange, referencePointLabel, airKermaLabel, modelDropdown, airKermaSlider, rescaleDropdownButtons, multSeedDwellTimeLabel, multSeedDwellTimeSlider, toggleSeedEnable } from '../utils.js';
import { refreshNavBar, navBar } from "../navBar.js";
import { view, moduleData } from "../main.js";
import { Button } from '../UIclasses/Button.js';
import { Slider } from '../UIclasses/Slider.js';
import { NumberInput } from '../UIclasses/NumberInput.js';

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
const thisModule = "planar array of seeds";

let initPlanarArrayGraph1 = [];
let initPlanarArrayGraph2 = [];
for (let x = -1.5; x <= 1.5; x++){
    for (let y = -1.5; y <= 1.5; y++){
        initPlanarArrayGraph1.push(
            new Seed(
                {x:x, y:y, z:0},
                {phi: 0, theta: 0},
                TheraSeed200,
                airKermaSliderLimits.LDR.min,
                0.00833
            )
        );
        initPlanarArrayGraph2.push(
            new Seed(
                {x:x, y:y, z:0},
                {phi: 0, theta: 0},
                TheraSeed200,
                airKermaSliderLimits.LDR.min,
                0.00833
            )
        );
    }
}

export let PlanarArrayOfSeeds = new Module({
    graphs: {
        graph1: new Graph({
            x: 0, y: 0, width: 0, height: 0,
            seeds: initPlanarArrayGraph1,
            xTicks: getRange(-5, 5, 0.0625), yTicks: getRange(-5, 5, 0.0625), perspective: (point) => point, name: "graph1", refpoints: [{x: 0, y: 0, z: 0}]
        }),
        graph2: new Graph({
            x: 0, y: 0, width: 0, height: 0,
            seeds: initPlanarArrayGraph2,
            xTicks: getRange(-5, 5, 0.0625), yTicks: getRange(-5, 5, 0.0625), perspective: (point) => point, name: "graph2", refpoints: [{x: 0, y: 0, z: 0}]
        })
    },
    sliders: {
        graph1AirKerma: function() {return airKermaSlider(moduleData,thisModule,"graph1")},
        graph2AirKerma: function() {return airKermaSlider(moduleData,thisModule,"graph2")},
        graph1DwellTime: function() {return multSeedDwellTimeSlider(moduleData,thisModule,"graph1");},
        graph2DwellTime: function() {return multSeedDwellTimeSlider(moduleData,thisModule,"graph2");},
        graph1SeedSpacing: function() {return seedSpacingSlider("graph1")},
        graph2SeedSpacing: function() {return seedSpacingSlider("graph2")}
    },
    specialVars: {
        seedSpacing: {
            graph1: 1,
            graph2: 1
        }
    },
    dropDowns: {
        graph1Model: function() {return modelDropdown([TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource],"graph1",TheraSeed200.name);},
        graph2Model: function() {return modelDropdown([TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource],"graph2",TheraSeed200.name);}
    },
    labels: {
        graph1AirKerma: function() {return airKermaLabel(moduleData,thisModule,"graph1");},
        graph2AirKerma: function() {return airKermaLabel(moduleData,thisModule,"graph2");},
        graph1DwellTime: function() {return multSeedDwellTimeLabel(moduleData,thisModule,"graph1");},
        graph2DwellTime: function() {return multSeedDwellTimeLabel(moduleData,thisModule,"graph2");},
        graph1Reference: function() {return referencePointLabel(moduleData,thisModule,"graph1",0);},
        graph2Reference: function() {return referencePointLabel(moduleData,thisModule,"graph2",0);},
        graph1SeedSpacing: function() {return seedSpacingLabel("graph1")},
        graph2SeedSpacing: function() {return seedSpacingLabel("graph2")},
    },
    buttons: {
        graph1EnableSeed: function() {return toggleSeedEnable("graph1",function () {return this.graphs.graph1.selectedSeed})},
        graph2EnableSeed: function() {return toggleSeedEnable("graph2",function () {return this.graphs.graph2.selectedSeed})},
        graph1ExpandArray: function() {return expandArrayButton("graph1")},
        graph2ExpandArray: function() {return expandArrayButton("graph2")},
        graph1ShrinkArray: function() {return shrinkArrayButton("graph1")},
        graph2ShrinkArray: function() {return shrinkArrayButton("graph2")}
    },
    onUpdate: function () {
        ctx.clearRect(0,0,canvas.width,canvas.height);

        //draw nav bar
        Object.values(navBar).forEach((button) => {
            button.draw();
        });

        // draw air kerma label/slider for graph1
        this.sliders.graph1AirKerma.draw();
        this.labels.graph1AirKerma.draw();
        
        // draw air kerma label/slider for graph2
        this.labels.graph2AirKerma.draw();
        this.sliders.graph2AirKerma.draw();

        // draw dwell time UI or disable seed UI (if a seed is selected, depending on if the source id HDR)
        if (this.graphs.graph1.selectedSeed != -1){
            if (this.graphs.graph1.seeds[0].model.HDRsource){
                this.labels.graph1DwellTime.draw();
                this.sliders.graph1DwellTime.draw();
            }else{
                this.buttons.graph1EnableSeed.draw();
            }
        }
        if (this.graphs.graph2.selectedSeed != -1){
            if (this.graphs.graph2.seeds[0].model.HDRsource){
                this.labels.graph2DwellTime.draw();
                this.sliders.graph2DwellTime.draw();
            }else{
                this.buttons.graph2EnableSeed.draw();
            }
        }

        Object.values(this.graphs).forEach((graph) => {
            graph.drawRefPoints();
            graph.drawMouseLabel();
        });

        // update the expand / shrink array buttons to their y-position matches the bottom of the enable
        // seed button or dwell time sliders (in vertical mode)
        if (view.width / view.height <= 1){
            let splitY = view.height / 2;
            let splitX = view.width * 0.25;

            let graph1ExpandArrayBounds = getRegionBound({
                x: 0,
                y: view.y + splitY * (
                    this.graphs.graph1.selectedSeed != -1 ?
                        (this.graphs.graph1.seeds[0].model.HDRsource ?
                            0.5
                        :
                            0.4)
                    : 0.3
                ),
                width: splitX,
                height: splitY * 0.1
            }, {horizontal: 0.2, vertical: 0.2});
            
            Object.assign(this.buttons.graph1ExpandArray, graph1ExpandArrayBounds);
            graph1ExpandArrayBounds.y += splitY * 0.1;
            Object.assign(this.buttons.graph1ShrinkArray, graph1ExpandArrayBounds);
            graph1ExpandArrayBounds.y += splitY * 0.1;
            Object.assign(this.labels.graph1SeedSpacing, graph1ExpandArrayBounds);
            graph1ExpandArrayBounds.y += splitY * 0.15;
            Object.assign(this.sliders.graph1SeedSpacing, {
                x: graph1ExpandArrayBounds.x,
                y: graph1ExpandArrayBounds.y,
                length: graph1ExpandArrayBounds.width,
                thickness: graph1ExpandArrayBounds.height * 0.3,
            });

            let graph2ExpandArrayBounds = getRegionBound({
                x: 0,
                y: view.y + splitY * (
                    this.graphs.graph2.selectedSeed != -1 ?
                        (this.graphs.graph2.seeds[0].model.HDRsource ?
                            1.5
                        :
                            1.4)
                    : 1.3
                ),
                width: splitX,
                height: splitY * 0.1
            }, {horizontal: 0.2, vertical: 0.2});

            Object.assign(this.buttons.graph2ExpandArray, graph2ExpandArrayBounds);
            graph2ExpandArrayBounds.y += splitY * 0.1;
            Object.assign(this.buttons.graph2ShrinkArray, graph2ExpandArrayBounds);
            graph2ExpandArrayBounds.y += splitY * 0.1;
            Object.assign(this.labels.graph2SeedSpacing, graph2ExpandArrayBounds);
            graph2ExpandArrayBounds.y += splitY * 0.15;
            Object.assign(this.sliders.graph2SeedSpacing, {
                x: graph2ExpandArrayBounds.x,
                y: graph2ExpandArrayBounds.y,
                length: graph2ExpandArrayBounds.width,
                thickness: graph2ExpandArrayBounds.height * 0.3,
            });
        }

        this.graphs.graph1.drawGraphSeeds();
        this.graphs.graph1.drawRefPoints();
        this.labels.graph1Reference.draw();
        this.graphs.graph1.drawMouseLabel();
        this.buttons.graph1ExpandArray.draw();
        this.buttons.graph1ShrinkArray.draw();
        this.sliders.graph1SeedSpacing.draw();
        this.labels.graph1SeedSpacing.draw();
        this.dropDowns.graph1Model.draw();

        this.graphs.graph2.drawGraphSeeds();
        this.graphs.graph2.drawRefPoints();
        this.labels.graph2Reference.draw();
        this.graphs.graph2.drawMouseLabel();
        this.buttons.graph2ExpandArray.draw();
        this.buttons.graph2ShrinkArray.draw();
        this.sliders.graph2SeedSpacing.draw();
        this.labels.graph2SeedSpacing.draw();
        this.dropDowns.graph2Model.draw();
    },
    onReload: function () {
        refreshNavBar(thisModule);

        let graph3Div = document.getElementById("graph3");
        if (graph3Div.innerHTML !== ""){
            graph3Div.innerHTML = "";
        }
        
        if (view.width / view.height > 1){
            let splitY = view.height * 0.25;
            let splitX = view.width / 2;

            //resize graphs
            Object.assign(this.graphs.graph1, getRegionBound({
                x: 0,
                y: view.y + splitY,
                width: splitX,
                height: view.height - splitY
            }, {horizontal: 0, vertical: 0}, 1));

            Object.assign(this.graphs.graph2, getRegionBound({
                x: splitX,
                y: view.y + splitY,
                width: splitX,
                height: view.height - splitY
            }, {horizontal: 0, vertical: 0}, 1));
        }else{
            let splitY = view.height / 2;
            let splitX = view.width * 0.25;

            //resize graphs
            Object.assign(this.graphs.graph1, getRegionBound({
                x: splitX,
                y: view.y,
                width: view.width * 0.75,
                height: splitY
            }, {horizontal: 0, vertical: 0}, 1));

            Object.assign(this.graphs.graph2, getRegionBound({
                x: splitX,
                y: view.y + splitY,
                width: view.width * 0.75,
                height: splitY
            }, {horizontal: 0, vertical: 0}, 1));
        }

        Object.values(this.graphs).forEach((graph) => {
            graph.drawGraph(document.getElementById(graph.name));
        });

        if (view.width / view.height > 1){
            let splitY = view.height * 0.25;
            let splitX = view.width / 4;

            //resize dropdowns
            rescaleDropdownButtons(this.dropDowns.graph1Model,{
                x: 0,
                y: view.y,
                width: splitX,
                height: splitY / 5
            }, {horizontal: 0.2, vertical: 0.2});

            rescaleDropdownButtons(this.dropDowns.graph2Model,{
                x: splitX * 2,
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

            Object.assign(this.labels.graph2AirKerma, getRegionBound({
                x: splitX * 2,
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

            Object.assign(this.labels.graph2DwellTime, getRegionBound({
                x: splitX * 2,
                y: view.y + (splitY / 5) * 3,
                width: splitX,
                height: splitY / 5
            }, {horizontal: 0.2, vertical: 0.2}));

            Object.assign(this.labels.graph1SeedSpacing, getRegionBound({
                x: splitX,
                y: view.y + (splitY / 5) * 2,
                width: splitX,
                height: splitY / 5
            }, {horizontal: 0.2, vertical: 0.2}));

            Object.assign(this.labels.graph2SeedSpacing, getRegionBound({
                x: splitX * 3,
                y: view.y + (splitY / 5) * 2,
                width: splitX,
                height: splitY / 5
            }, {horizontal: 0.2, vertical: 0.2}));

            //resize sliders
            let sliderBounds = getRegionBound({
                x: 0,
                y: view.y + (splitY / 5) * 2.5,
                width: splitX,
                height: splitY / 5
            }, {horizontal: 0.2, vertical: 0.2});

            Object.assign(this.sliders.graph1AirKerma, {
                x: sliderBounds.x,
                y: sliderBounds.y,
                length: sliderBounds.width,
                thickness: sliderBounds.height * 0.4
            });

            Object.assign(this.sliders.graph2AirKerma, {
                x: sliderBounds.x + splitX * 2,
                y: sliderBounds.y,
                length: sliderBounds.width,
                thickness: sliderBounds.height * 0.4
            });

            Object.assign(this.sliders.graph1DwellTime, {
                x: sliderBounds.x,
                y: sliderBounds.y + (splitY / 5) * 2,
                length: sliderBounds.width,
                thickness: sliderBounds.height * 0.4
            });

            Object.assign(this.sliders.graph2DwellTime, {
                x: sliderBounds.x + splitX * 2,
                y: sliderBounds.y + (splitY / 5) * 2,
                length: sliderBounds.width,
                thickness: sliderBounds.height * 0.4
            });

            Object.assign(this.sliders.graph1SeedSpacing, {
                x: sliderBounds.x + splitX,
                y: sliderBounds.y + (splitY / 5),
                length: sliderBounds.width,
                thickness: sliderBounds.height * 0.4
            });

            Object.assign(this.sliders.graph2SeedSpacing, {
                x: sliderBounds.x + splitX * 3,
                y: sliderBounds.y + (splitY / 5),
                length: sliderBounds.width,
                thickness: sliderBounds.height * 0.4
            });

            // resize buttons
            Object.assign(this.buttons.graph1EnableSeed, getRegionBound({
                x: 0,
                y: view.y + (splitY / 5) * 3,
                width: splitX,
                height: splitY / 5
            }, {horizontal: 0.2, vertical: 0.2}));

            Object.assign(this.buttons.graph2EnableSeed, getRegionBound({
                x: splitX * 2,
                y: view.y + (splitY / 5) * 3,
                width: splitX,
                height: splitY / 5
            }, {horizontal: 0.2, vertical: 0.2}));

            Object.assign(this.buttons.graph1ExpandArray, getRegionBound({
                x: splitX,
                y: view.y,
                width: splitX,
                height: splitY / 5
            }, {horizontal: 0.2, vertical: 0.2}));

            Object.assign(this.buttons.graph1ShrinkArray, getRegionBound({
                x: splitX,
                y: view.y + (splitY / 5),
                width: splitX,
                height: splitY / 5
            }, {horizontal: 0.2, vertical: 0.2}));

            Object.assign(this.buttons.graph2ExpandArray, getRegionBound({
                x: 3 * splitX,
                y: view.y,
                width: splitX,
                height: splitY / 5
            }, {horizontal: 0.2, vertical: 0.2}));

            Object.assign(this.buttons.graph2ShrinkArray, getRegionBound({
                x: 3 * splitX,
                y: view.y + (splitY / 5),
                width: splitX,
                height: splitY / 5
            }, {horizontal: 0.2, vertical: 0.2}));
        }else{
            let splitY = view.height / 2;
            let splitX = view.width * 0.25;

            //resize dropdowns
            rescaleDropdownButtons(this.dropDowns.graph1Model,{
                x: 0,
                y: view.y,
                width: splitX,
                height: splitY * 0.1
            }, {horizontal: 0.2, vertical: 0.2});

            rescaleDropdownButtons(this.dropDowns.graph2Model,{
                x: 0,
                y: view.y + splitY,
                width: splitX,
                height: splitY * 0.1
            }, {horizontal: 0.2, vertical: 0.2});

            //resize labels
            Object.assign(this.labels.graph1AirKerma, getRegionBound({
                x: 0,
                y: view.y + splitY * 0.1,
                width: splitX,
                height: splitY * 0.1
            }, {horizontal: 0.2, vertical: 0.2}));

            Object.assign(this.labels.graph2AirKerma, getRegionBound({
                x: 0,
                y: view.y + splitY * 1.1,
                width: splitX,
                height: splitY * 0.1
            }, {horizontal: 0.2, vertical: 0.2}));

            Object.assign(this.labels.graph1DwellTime, getRegionBound({
                x: 0,
                y: view.y + splitY * 0.3,
                width: splitX,
                height: splitY * 0.1
            }, {horizontal: 0.2, vertical: 0.2}));

            Object.assign(this.labels.graph2DwellTime, getRegionBound({
                x: 0,
                y: view.y + splitY * 1.3,
                width: splitX,
                height: splitY * 0.1
            }, {horizontal: 0.2, vertical: 0.2}));

            //resize sliders
            let sliderBounds = getRegionBound({
                x: 0,
                y: view.y + splitY * 0.25,
                width: splitX,
                height: splitY * 0.1
            }, {horizontal: 0.2, vertical: 0.2});

            Object.assign(this.sliders.graph1AirKerma, {
                x: sliderBounds.x,
                y: sliderBounds.y,
                length: sliderBounds.width,
                thickness: sliderBounds.height * 0.3
            });

            Object.assign(this.sliders.graph2AirKerma, {
                x: sliderBounds.x,
                y: sliderBounds.y + splitY,
                length: sliderBounds.width,
                thickness: sliderBounds.height * 0.3
            });

            Object.assign(this.sliders.graph1DwellTime, {
                x: sliderBounds.x,
                y: sliderBounds.y + splitY * 0.2,
                length: sliderBounds.width,
                thickness: sliderBounds.height * 0.3
            });

            Object.assign(this.sliders.graph2DwellTime, {
                x: sliderBounds.x,
                y: sliderBounds.y + splitY * 1.2,
                length: sliderBounds.width,
                thickness: sliderBounds.height * 0.3
            });

            // resize buttons
            Object.assign(this.buttons.graph1EnableSeed, getRegionBound({
                x: 0,
                y: view.y + splitY * 0.3,
                width: splitX,
                height: splitY * 0.1
            }, {horizontal: 0.2, vertical: 0.2}));

            Object.assign(this.buttons.graph2EnableSeed, getRegionBound({
                x: 0,
                y: view.y + splitY * 1.3,
                width: splitX,
                height: splitY * 0.1
            }, {horizontal: 0.2, vertical: 0.2}));
        }

        //resize reference dose labels
        let labelPos = this.graphs.graph1.graphToScreenPos(this.graphs.graph1.refpoints[0]);
        Object.assign(this.labels.graph1Reference, {
            x: labelPos.x,
            y: labelPos.y,
            width: this.graphs.graph1.graphDimensions.width * 0.27,
            height: this.graphs.graph1.graphDimensions.height * 0.09,
        });

        labelPos = this.graphs.graph2.graphToScreenPos(this.graphs.graph2.refpoints[0]);
        Object.assign(this.labels.graph2Reference, {
            x: labelPos.x,
            y: labelPos.y,
            width: this.graphs.graph2.graphDimensions.width * 0.27,
            height: this.graphs.graph2.graphDimensions.height * 0.09,
        });
        this.onUpdate();
    },
    defaultInputHandler: {
        onMouseDown: function* () {
            //Check for dropdown clicked
            yield this.dropDowns.graph1Model.checkClicked();
            yield this.dropDowns.graph2Model.checkClicked();

            //UI around graph1
            if ((view.width / view.height > 1) || !this.dropDowns.graph1Model.showing){
                yield this.buttons.graph1ExpandArray.checkClicked();
                yield this.buttons.graph1ShrinkArray.checkClicked();
                yield this.sliders.graph1SeedSpacing.checkClicked();
                yield this.labels.graph1SeedSpacing.checkClicked();
            }

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

            //UI around graph2
            if ((view.width / view.height > 1) || !this.dropDowns.graph2Model.showing){
                yield this.buttons.graph2ExpandArray.checkClicked();
                yield this.buttons.graph2ShrinkArray.checkClicked();
                yield this.sliders.graph2SeedSpacing.checkClicked();
                yield this.labels.graph2SeedSpacing.checkClicked();
            }
            
            if (!this.dropDowns.graph2Model.showing){
                yield this.labels.graph2AirKerma.checkClicked();
                yield this.sliders.graph2AirKerma.checkClicked();

                if (this.graphs.graph2.selectedSeed != -1){
                    if (this.graphs.graph2.seeds[0].model.HDRsource){
                        yield this.labels.graph2DwellTime.checkClicked();
                        yield this.sliders.graph2DwellTime.checkClicked();
                    }else{
                        yield this.buttons.graph2EnableSeed.checkClicked();
                    }
                }
            }
            yield this.labels.graph2Reference.checkClicked();

            yield this.graphs.graph1.checkClicked();
            yield this.graphs.graph2.checkClicked();
        },
    }
});

function expandArrayButton(graph){
    return new Button({
        x: 0, y: 0, width: 0, height: 0, bgColor: "#50C878",
        onClick: function () {
            let sideLength = Math.sqrt(this.module.graphs[graph].seeds.length);
            let seeds = [];
            // add the correct number of seeds to a buffer array
            for (let i = 0; i < (sideLength + 1) * 4; i++){
                seeds.push(new Seed(
                    {x: 0, y: 0, z: this.module.graphs[graph].zSlice},
                    {phi: 0, theta: 0},
                    this.module.graphs[graph].seeds[0].model,
                    (this.module.graphs[graph].seeds[0].model.HDRsource ?
                        airKermaSliderLimits.HDR.min
                    :
                        airKermaSliderLimits.LDR.min
                    ),
                    0.00833
                ));
            }

            // push seeds from the buffer array to various to graph1.seeds. even though all elements of the buffer
            // array are identical, they must be generated independently otherwise all the added seeds will have
            // the same reference

            // push left side
            for (let i = 0; i < sideLength + 2; i++){
                seeds[i].pos.x = (-sideLength - 1) / 2;
                seeds[i].pos.y = i + (-sideLength - 1) / 2;
                this.module.graphs[graph].seeds.push(seeds[i]);
            }
            // push right side
            for (let i = sideLength + 2; i < 2 * sideLength + 4; i++){
                seeds[i].pos.x = (sideLength + 1) / 2;
                seeds[i].pos.y = (i - sideLength - 2) + (-sideLength - 1) / 2;
                this.module.graphs[graph].seeds.push(seeds[i]);
            }
            // push bottom side
            for (let i = 2 * sideLength + 4; i < 3 * sideLength + 4; i++){
                seeds[i].pos.x = (i - 2 * sideLength - 4) - (sideLength - 1) / 2;
                seeds[i].pos.y = (-sideLength - 1) / 2;
                this.module.graphs[graph].seeds.push(seeds[i]);
            }
            // push top side
            for (let i = 3 * sideLength + 4; i < 4 * sideLength + 4; i++){
                seeds[i].pos.x = (i - 3 * sideLength - 4) - (sideLength - 1) / 2;
                seeds[i].pos.y = (sideLength + 1) / 2;
                this.module.graphs[graph].seeds.push(seeds[i]);
            }
            this.module.onReload();
        },
        label: {text: "Expand Array", font: "default", color: "black"},
        outline: {color: "black", thickness: 0}
    });
}

function shrinkArrayButton(graph){
    return new Button({
        x: 0, y: 0, width: 0, height: 0, bgColor: "#EE4B2B",
        onClick: function () {
            let newSideLength = (Math.sqrt(this.module.graphs[graph].seeds.length) - 2) * this.module.seedSpacing[graph];
            if (newSideLength > 0){
                // shrinks the array by filerting for all seeds within a certain hamiltonian distance
                this.module.graphs[graph].seeds = this.module.graphs[graph].seeds.filter((seed) =>
                    Math.max(
                        Math.abs(seed.pos.x),
                        Math.abs(seed.pos.y)
                    ) < newSideLength / 2
                );
                this.module.onReload();
            }
        },
        label: {text: "Shrink Array", font: "default", color: "black"},
        outline: {color: "black", thickness: 0}
    });
}

function seedSpacingSlider(graph){
    return new Slider({
        x: 0, y: 0, length: 0, angle: 0, color: "black", thickness: 0,
        updateValue: function (value) {
            setSeedSpacing.call(this, graph, value + 0.5);
            this.module.onReload();
        },
        getValue: () => moduleData[thisModule].seedSpacing[graph] - 0.5
    });
}

function seedSpacingLabel(graph){
    return new NumberInput({
        x: 0, y: 0, width: 0, height: 0,
        label: {
            text: (value) => `Seed Spacing: ${value} cm`,
            color: {selected: "white", notSelected: "black"}
        },bgColor: {selected: "black", notSelected: "white"},
        getValue: () => moduleData[thisModule].seedSpacing[graph],
        onEnter: function (value){
            setSeedSpacing.call(this, graph, value);
            this.module.onReload();
        },
        numDecimalsEditing: 2
    });
}

function setSeedSpacing(graph,value){
    this.module.graphs[graph].seeds.forEach((seed) => {
        seed.pos.x = (seed.pos.x / this.module.seedSpacing[graph]) * value;
        seed.pos.y = (seed.pos.y / this.module.seedSpacing[graph]) * value;
    });
    this.module.seedSpacing[graph] = value;
}