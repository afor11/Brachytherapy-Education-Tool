import { TheraSeed200, Best2301, GammaMedHDRPlus, BEBIG_GK60M21, ElektaFlexisource, airKermaSliderLimits } from '../constants.js';
import { Seed } from '../seed.js';
import { Graph } from '../graph.js';
import { Module } from '../module.js';
import { getRegionBound, setProps, getRange, toggleSeedEnable, referencePointLabel, dwellTimeLabel, airKermaLabel, modelDropdown, airKermaSlider, dwellTimeSlider, rescaleDropdownButtons } from '../utils.js';
import { refreshNavBar, navBar } from "../navBar.js";
import { view } from "../main.js";

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
            graph1AirKerma: function(moduleData) {return airKermaSlider(moduleData,thisModule,"graph1")},
            graph1DwellTime: function(moduleData) {return dwellTimeSlider(moduleData,thisModule,"graph1");},
        },
        dropDowns: {
            graph1Model: function(moduleData,self) {return modelDropdown([TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource],moduleData,thisModule,self,"graph1",TheraSeed200.name);},
        },
        labels: {
            graph1AirKerma: function(moduleData) {return airKermaLabel(moduleData,thisModule,"graph1");},
            graph1DwellTime: function(moduleData) {return dwellTimeLabel(moduleData,thisModule,"graph1");},
            graph1Reference: function(moduleData) {return referencePointLabel(moduleData,thisModule,"graph1",0);},
        },
        buttons: {
            graph1EnableSeed: function(moduleData,self) {
                return toggleSeedEnable(
                    moduleData,
                    thisModule,
                    self,
                    "graph1",
                    function () {return this.graphs.graph1.selectedSeed;}
                );
            }
        },
        onUpdate: function () {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            this.labels.graph1AirKerma.draw();
            this.labels.graph1Reference.draw();
            this.sliders.graph1AirKerma.draw();
            if (this.graphs.graph1.seeds[0].model.HDRsource){
                this.labels.graph1DwellTime.draw();
                this.sliders.graph1DwellTime.draw();
            }else{
                this.buttons.graph1EnableSeed.draw();
            }
            ["dropDowns"].forEach((obj) => {
                Object.values(this[obj]).forEach((attribute) => {
                    attribute.draw();
                });
            });
            Object.values(navBar).forEach((button) => {
                button.draw();
            });
            this.graphs.graph1.drawGraphSeeds();
            this.graphs.graph1.drawRefPoints();
            this.graphs.graph1.drawMouseLabel();
        },
        onReload: function (moduleData) {
            refreshNavBar(moduleData);

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
            setProps(this.graphs.graph1, getRegionBound({
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
            setProps(this.labels.graph1AirKerma, getRegionBound({
                x: 0,
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

            setProps(this.sliders.graph1DwellTime, {
                x: sliderBounds.x,
                y: sliderBounds.y + (splitY / 5) * 2,
                length: sliderBounds.width,
                thickness: sliderBounds.height * 0.4
            });

            //resize reference dose labels
            let labelPos = this.graphs.graph1.graphToScreenPos(this.graphs.graph1.refpoints[0]);
            setProps(this.labels.graph1Reference, {
                x: labelPos.x,
                y: labelPos.y,
                width: this.graphs.graph1.graphDimensions.width * 0.27,
                height: this.graphs.graph1.graphDimensions.height * 0.09,
            });

            //resize buttons
            setProps(this.buttons.graph1EnableSeed, getRegionBound({
                x: 0,
                y: view.y + (splitY / 5) * 3,
                width: splitX,
                height: splitY / 5
            }, {horizontal: 0.2, vertical: 0.2}));

            this.onUpdate(moduleData);
        },
        defaultInputHandler: {
            onMouseDown: function() {
                //##Adjust to self-modify

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
                    }else{
                        this.clickHandled = this.clickHandled || this.buttons.graph1EnableSeed.checkClicked();
                    }
                }
                this.clickHandled = this.clickHandled || this.labels.graph1Reference.checkClicked();
                this.clickHandled = this.clickHandled || this.graphs.graph1.checkClicked();
            }
        }
    })