import { TheraSeed200, Best2301, GammaMedHDRPlus, BEBIG_GK60M21, ElektaFlexisource, airKermaSliderLimits } from '../constants.js';
import { Seed } from '../seed.js';
import { Graph } from '../graph.js';
import { Module } from '../module.js';
import { getRegionBound, setProps, getRange, referencePointLabel, dwellTimeLabel, airKermaLabel, modelDropdown, airKermaSlider, dwellTimeSlider, rescaleDropdownButtons } from '../utils.js';
import { refreshNavBar, navBar } from "../navBar.js";
import { view } from "../main.js";

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
            graph1AirKerma: function(moduleData) {return airKermaSlider(moduleData,thisModule,"graph1")},
            graph2AirKerma: function(moduleData) {return airKermaSlider(moduleData,thisModule,"graph2")},
            graph1DwellTime: function(moduleData) {return dwellTimeSlider(moduleData,thisModule,"graph1");},
            graph2DwellTime: function(moduleData) {return dwellTimeSlider(moduleData,thisModule,"graph2");}
        },
        dropDowns: {
            graph1Model: function(moduleData,self) {return modelDropdown([TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource],moduleData,"single seed",self,"graph1",TheraSeed200.name);},
            graph2Model: function(moduleData,self) {return modelDropdown([TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource],moduleData,"single seed",self,"graph2",TheraSeed200.name);}
        },
        labels: {
            graph1AirKerma: function(moduleData) {return airKermaLabel(moduleData,thisModule,"graph1");},
            graph2AirKerma: function(moduleData) {return airKermaLabel(moduleData,thisModule,"graph2");},
            graph1DwellTime: function(moduleData) {return dwellTimeLabel(moduleData,thisModule,"graph1");},
            graph2DwellTime: function(moduleData) {return dwellTimeLabel(moduleData,thisModule,"graph2");},
            graph1Reference: function(moduleData) {return referencePointLabel(moduleData,thisModule,"graph1",0);},
            graph2Reference: function(moduleData) {return referencePointLabel(moduleData,thisModule,"graph2",0);},
        },
        onUpdate: function () {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            let graph3Div = document.getElementById("graph3");
            if (graph3Div.innerHTML !== ""){
                graph3Div.innerHTML = "";
            }
            this.labels.graph1AirKerma.draw();
            this.labels.graph2AirKerma.draw();
            this.labels.graph1Reference.draw();
            this.labels.graph2Reference.draw();
            this.sliders.graph1AirKerma.draw();
            this.sliders.graph2AirKerma.draw();
            if (this.graphs.graph1.seeds[0].model.HDRsource){
                this.labels.graph1DwellTime.draw();
                this.sliders.graph1DwellTime.draw();
            }
            if (this.graphs.graph2.seeds[0].model.HDRsource){
                this.labels.graph2DwellTime.draw();
                this.sliders.graph2DwellTime.draw();
            }
            ["dropDowns"].forEach((obj) => {
                Object.values(this[obj]).forEach((attribute) => {
                    attribute.draw();
                });
            });
            Object.values(navBar).forEach((button) => {
                button.draw();
            });
            Object.values(this.graphs).forEach((graph) => {
                graph.drawRefPoints();
                graph.drawMouseLabel();
            });
        },
        onReload: function (moduleData) {
            refreshNavBar(moduleData);
            if (view.width / view.height > 1){
                let splitY = view.height * 0.25;
                let splitX = view.width / 2;

                //resize graphs
                setProps(this.graphs.graph1, getRegionBound({
                    x: 0,
                    y: view.y + splitY,
                    width: splitX,
                    height: view.height - splitY
                }, {horizontal: 0, vertical: 0}, 1));

                setProps(this.graphs.graph2, getRegionBound({
                    x: splitX,
                    y: view.y + splitY,
                    width: splitX,
                    height: view.height - splitY
                }, {horizontal: 0, vertical: 0}, 1));
            }else{
                let splitY = view.height / 2;
                let splitX = view.width * 0.25;

                //resize graphs
                setProps(this.graphs.graph1, getRegionBound({
                    x: splitX,
                    y: view.y,
                    width: view.width * 0.75,
                    height: splitY
                }, {horizontal: 0, vertical: 0}, 1));

                setProps(this.graphs.graph2, getRegionBound({
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
                setProps(this.labels.graph1AirKerma, getRegionBound({
                    x: 0,
                    y: view.y + splitY / 5,
                    width: splitX,
                    height: splitY / 5
                }, {horizontal: 0.2, vertical: 0.2}));

                setProps(this.labels.graph2AirKerma, getRegionBound({
                    x: splitX,
                    y: view.y + splitY / 5,
                    width: splitX,
                    height: splitY / 5
                }, {horizontal: 0.2, vertical: 0.2}));

                setProps(this.labels.graph1DwellTime, getRegionBound({
                    x: 0,
                    y: view.y + (splitY / 5) * 3,
                    width: splitX,
                    height: splitY / 5
                }, {horizontal: 0.2, vertical: 0.2}));

                setProps(this.labels.graph2DwellTime, getRegionBound({
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

                setProps(this.sliders.graph1AirKerma, {
                    x: sliderBounds.x,
                    y: sliderBounds.y,
                    length: sliderBounds.width,
                    thickness: sliderBounds.height * 0.4
                });

                setProps(this.sliders.graph2AirKerma, {
                    x: sliderBounds.x + splitX,
                    y: sliderBounds.y,
                    length: sliderBounds.width,
                    thickness: sliderBounds.height * 0.4
                });

                setProps(this.sliders.graph1DwellTime, {
                    x: sliderBounds.x,
                    y: sliderBounds.y + (splitY / 5) * 2,
                    length: sliderBounds.width,
                    thickness: sliderBounds.height * 0.4
                });

                setProps(this.sliders.graph2DwellTime, {
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
                setProps(this.labels.graph1AirKerma, getRegionBound({
                    x: 0,
                    y: view.y + splitY * 0.1,
                    width: splitX,
                    height: splitY * 0.1
                }, {horizontal: 0.2, vertical: 0.2}));

                setProps(this.labels.graph2AirKerma, getRegionBound({
                    x: 0,
                    y: view.y + splitY * 1.1,
                    width: splitX,
                    height: splitY * 0.1
                }, {horizontal: 0.2, vertical: 0.2}));

                setProps(this.labels.graph1DwellTime, getRegionBound({
                    x: 0,
                    y: view.y + splitY * 0.3,
                    width: splitX,
                    height: splitY * 0.1
                }, {horizontal: 0.2, vertical: 0.2}));

                setProps(this.labels.graph2DwellTime, getRegionBound({
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

                setProps(this.sliders.graph1AirKerma, {
                    x: sliderBounds.x,
                    y: sliderBounds.y,
                    length: sliderBounds.width,
                    thickness: sliderBounds.height * 0.3
                });

                setProps(this.sliders.graph2AirKerma, {
                    x: sliderBounds.x,
                    y: sliderBounds.y + splitY,
                    length: sliderBounds.width,
                    thickness: sliderBounds.height * 0.3
                });

                setProps(this.sliders.graph1DwellTime, {
                    x: sliderBounds.x,
                    y: sliderBounds.y + splitY * 0.2,
                    length: sliderBounds.width,
                    thickness: sliderBounds.height * 0.3
                });

                setProps(this.sliders.graph2DwellTime, {
                    x: sliderBounds.x,
                    y: sliderBounds.y + splitY * 1.2,
                    length: sliderBounds.width,
                    thickness: sliderBounds.height * 0.3
                });
            }

            //resize reference dose labels
            let labelPos = this.graphs.graph1.graphToScreenPos(this.graphs.graph1.refpoints[0]);
            setProps(this.labels.graph1Reference, {
                x: labelPos.x,
                y: labelPos.y,
                width: this.graphs.graph1.graphDimensions.width * 0.27,
                height: this.graphs.graph1.graphDimensions.height * 0.09,
            });

            labelPos = this.graphs.graph2.graphToScreenPos(this.graphs.graph2.refpoints[0]);
            setProps(this.labels.graph2Reference, {
                x: labelPos.x,
                y: labelPos.y,
                width: this.graphs.graph2.graphDimensions.width * 0.27,
                height: this.graphs.graph2.graphDimensions.height * 0.09,
            });
            this.onUpdate(moduleData);
        },
        onClick: function() {
            //Check for dropdown clicked
            Object.values(this.dropDowns).forEach((dropdown) => {
                this.clickHandled = this.clickHandled || dropdown.checkClicked();
            });

            //UI around graph1
            if (!this.dropDowns.graph1Model.showing){
                this.clickHandled = this.clickHandled || this.labels.graph1AirKerma.checkClicked();
                this.clickHandled = this.clickHandled || this.sliders.graph1AirKerma.checkClicked();
                if (this.graphs.graph1.seeds[0].model.HDRsource){
                    this.clickHandled = this.clickHandled || this.labels.graph1DwellTime.checkClicked();
                    this.clickHandled = this.clickHandled || this.sliders.graph1DwellTime.checkClicked();
                }
            }
            this.clickHandled = this.clickHandled || this.labels.graph1Reference.checkClicked();

            //UI around graph2
            if (!this.dropDowns.graph2Model.showing){
                this.clickHandled = this.clickHandled || this.labels.graph2AirKerma.checkClicked();
                this.clickHandled = this.clickHandled || this.labels.graph2DwellTime.checkClicked();
                this.clickHandled = this.clickHandled || this.sliders.graph2AirKerma.checkClicked();
                if (this.graphs.graph2.seeds[0].model.HDRsource){
                    this.clickHandled = this.clickHandled || this.labels.graph2DwellTime.checkClicked();
                    this.clickHandled = this.clickHandled || this.sliders.graph2DwellTime.checkClicked();
                }
            }
            this.clickHandled = this.clickHandled || this.labels.graph2Reference.checkClicked();
        }
    })