import { TheraSeed200, Best2301, GammaMedHDRPlus, BEBIG_GK60M21, ElektaFlexisource, airKermaSliderLimits } from '../constants.js';
import { Seed } from '../seed.js';
import { Graph } from '../graph.js';
import { Module } from '../module.js';
import { getRegionBound, getRange, referencePointLabel, dwellTimeLabel, airKermaLabel, modelDropdown, airKermaSlider, dwellTimeSlider, rescaleDropdownButtons } from '../utils.js';
import { refreshNavBar, navBar } from "../navBar.js";
import { view } from "../main.js";
import { AlgebraicEffect } from '../algebraicEffect.js';

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
const thisModule = "single seed";

export let singleSeedPage = new Module({
    graphs: {
        graph1: new Graph({
            x: 0, y: 0, width: 0, height: 0,
            seeds: [
                new Seed({x:0, y:0, z:0},{phi: 0, theta: 0},TheraSeed200,airKermaSliderLimits.LDR.min,0.00833)
            ],
            xTicks: getRange(-2, 2, 0.0625), yTicks: getRange(-2, 2, 0.0625), perspective: (point) => point, name: "graph1", refpoints: [{x: 0, y: 1, z: 0}]
        }),
        graph2: new Graph({
            x: 0, y: 0, width: 0, height: 0,
            seeds: [
                new Seed({x:0, y:0, z:0},{phi: 0, theta: 0},TheraSeed200,airKermaSliderLimits.LDR.min,0.00833)
            ],
            xTicks: getRange(-2, 2, 0.0625), yTicks: getRange(-2, 2, 0.0625), perspective: (point) => point, name: "graph2", refpoints: [{x: 0, y: 1, z: 0}]
        })
    },
    sliders: {
        graph1AirKerma: airKermaSlider("graph1"),
        graph2AirKerma: airKermaSlider("graph2"),
        graph1DwellTime: dwellTimeSlider("graph1"),
        graph2DwellTime: dwellTimeSlider("graph2")
    },
    dropDowns: {
        graph1Model: modelDropdown([TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource],"graph1",TheraSeed200.name),
        graph2Model: modelDropdown([TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource],"graph2",TheraSeed200.name)
    },
    labels: {
        graph1AirKerma: airKermaLabel("graph1"),
        graph2AirKerma: airKermaLabel("graph2"),
        graph1DwellTime: dwellTimeLabel("graph1"),
        graph2DwellTime: dwellTimeLabel("graph2"),
        graph1Reference: referencePointLabel("graph1",0),
        graph2Reference: referencePointLabel("graph2",0),
    },
    onUpdate: function* () {
        ctx.clearRect(0,0,canvas.width,canvas.height);

        let navButtons = Object.values(navBar);
        for (let i = 0; i < navButtons.length; i++){
            yield* navButtons[i].draw();
        }

        if (this.graphs.graph1.seeds[0].model.HDRsource){
            yield* this.labels.graph1DwellTime.draw();
            yield* this.sliders.graph1DwellTime.draw();
        }

        if (this.graphs.graph2.seeds[0].model.HDRsource){
            yield* this.labels.graph2DwellTime.draw();
            yield* this.sliders.graph2DwellTime.draw();
        }

        this.graphs.graph1.drawGraph();
        this.graphs.graph2.drawGraph();
        
        yield* this.labels.graph1AirKerma.draw();
        yield* this.sliders.graph1AirKerma.draw();
        yield* this.labels.graph1Reference.draw();
        yield* this.dropDowns.graph1Model.draw();

        yield* this.labels.graph2AirKerma.draw();
        yield* this.labels.graph2Reference.draw();
        yield* this.sliders.graph2AirKerma.draw();
        yield* this.dropDowns.graph2Model.draw();

        this.graphs.graph1.drawRefPoints();
        this.graphs.graph1.drawMouseLabel();
        this.graphs.graph2.drawRefPoints();
        this.graphs.graph2.drawMouseLabel();
    },
    onReload: function* () {
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
            graph.refreshGraph();
        });

        if (view.width / view.height > 1){
            let splitY = view.height * 0.25;
            let splitX = view.width / 2;

            //resize dropdowns
            rescaleDropdownButtons(this.dropDowns.graph1Model,{
                x: 0,
                y: view.y,
                width: splitX,
                height: splitY / 5
            }, {horizontal: 0.2, vertical: 0.2});

            rescaleDropdownButtons(this.dropDowns.graph2Model,{
                x: splitX,
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
                x: splitX,
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
                x: splitX,
                y: view.y + (splitY / 5) * 3,
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
                x: sliderBounds.x + splitX,
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
                x: sliderBounds.x + splitX,
                y: sliderBounds.y + (splitY / 5) * 2,
                length: sliderBounds.width,
                thickness: sliderBounds.height * 0.4
            });
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
        yield* this.onUpdate();
    },
    defaultInputHandler: {
        onMouseDown: function* () {
            let module = yield new AlgebraicEffect("GET MODULE");
            console.log(module.labels.graph1DwellTime);

            //UI around graph1
            if (!module.dropDowns.graph1Model.showing){
                yield* module.labels.graph1AirKerma.checkClicked();
                yield* module.sliders.graph1AirKerma.checkClicked();
                if (module.graphs.graph1.seeds[0].model.HDRsource){
                    yield* module.labels.graph1DwellTime.checkClicked();
                    yield* module.sliders.graph1DwellTime.checkClicked();
                }
            }
            yield* module.labels.graph1Reference.checkClicked();

            //UI around graph2
            if (!module.dropDowns.graph2Model.showing){
                yield* module.labels.graph2AirKerma.checkClicked();
                yield* module.sliders.graph2AirKerma.checkClicked();
                if (module.graphs.graph2.seeds[0].model.HDRsource){
                    yield* module.labels.graph2DwellTime.checkClicked();
                    yield* module.sliders.graph2DwellTime.checkClicked();
                }
            }
            yield* module.labels.graph2Reference.checkClicked();

            //Check for dropdown clicked
            yield* module.dropDowns.graph1Model.checkClicked();
            yield* module.dropDowns.graph2Model.checkClicked();
        },
    }
})