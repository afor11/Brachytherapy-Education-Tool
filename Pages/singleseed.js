import { TheraSeed200, Best2301, GammaMedHDRPlus, BEBIG_GK60M21, ElektaFlexisource, airKermaSliderLimits } from '../constants.js';
import { Button } from '../UIclasses/Button.js';
import { Dropdown } from '../UIclasses/Dropdown.js';
import { NumberInput } from '../UIclasses/NumberInput.js';
import { Slider } from '../UIclasses/Slider.js';
import { Seed } from '../seed.js';
import { Graph } from '../graph.js';
import { Module } from '../module.js';
import { getRegionBound, setProps, setDropdownProps, getRange, toggleSeedEnable, referencePointLabel, dwellTimeLabel, airKermaLabel, modelDropdown, airKermaSlider, dwellTimeSlider } from '../utils.js';
import { refreshNavBar, navBar } from "../navBar.js";
import { view } from "../main.js";

export let singleSeedPage = new Module({
        graphs: {
            graph1: new Graph({
                x: 0, y: 0, width: 0, height: 0,
                seeds: [
                    new Seed({x:0, y:0, z:0},{phi: 0, theta: 0},GammaMedHDRPlus,airKermaSliderLimits.HDR.min,0.00833)
                ],
                xTicks: getRange(-2, 2, 0.0625), yTicks: getRange(-2, 2, 0.0625), perspective: (point) => point, name: "graph1", refpoints: [{x: 0, y: 1, z: 0}]
            }),
            graph2: new Graph({
                x: 0, y: 0, width: 0, height: 0,
                seeds: [
                    new Seed({x:0, y:0, z:0},{phi: 0, theta: 0},GammaMedHDRPlus,airKermaSliderLimits.HDR.min,0.00833)
                ],
                xTicks: getRange(-2, 2, 0.0625), yTicks: getRange(-2, 2, 0.0625), perspective: (point) => point, name: "graph2", refpoints: [{x: 0, y: 1, z: 0}]
            })
        },
        sliders: {
            graph1AirKerma: function(thisModule,self) {return airKermaSlider(thisModule,"graph1")},
            graph2AirKerma: function(thisModule,self) {return airKermaSlider(thisModule,"graph2")},
            graph1DwellTime: function(thisModule,self) {return dwellTimeSlider(thisModule,"graph1");},
            graph2DwellTime: function(thisModule,self) {return dwellTimeSlider(thisModule,"graph2");}
        },
        dropDowns: {
            graph1Model: function(thisModule,self) {return modelDropdown([TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource],thisModule,self,"graph1",TheraSeed200.name);},
            graph2Model: function(thisModule,self) {return modelDropdown([TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource],thisModule,self,"graph2",TheraSeed200.name);}
        },
        labels: {
            graph1AirKerma: function(thisModule,self) {return airKermaLabel(thisModule,"graph1");},
            graph2AirKerma: function(thisModule,self) {return airKermaLabel(thisModule,"graph2");},
            graph1DwellTime: function(thisModule,self) {return dwellTimeLabel(thisModule,"graph1");},
            graph2DwellTime: function(thisModule,self) {return dwellTimeLabel(thisModule,"graph2");},
            graph1Reference: function(thisModule,self) {return referencePointLabel(thisModule, "graph1", 0);},
            graph2Reference: function(thisModule,self) {return referencePointLabel(thisModule, "graph2", 0);},
        },
        buttons: {
            graph1EnableSeed: function(thisModule,self) {return toggleSeedEnable(thisModule,self,"graph1",0);},
            graph2EnableSeed: function(thisModule,self) {return toggleSeedEnable(thisModule,self,"graph2",0);}
        },
        onUpdate: function (moduleData) {
            ["sliders","dropDowns","labels","buttons"].forEach((obj) => {
                Object.values(this[obj]).forEach((attribute) => {
                    attribute.draw();
                });
            });
            Object.values(navBar).forEach((button) => {
                button.draw();
            });
            this.graphs.graph1.drawRefPoints();
            this.graphs.graph2.drawRefPoints();
        },
        onReload: function (moduleData) {
            refreshNavBar(moduleData);
            if (view.width / view.height > 1.3){
                let splitY = view.height * 0.25;
                let splitX = view.width / 2;
                //resize graphs
                setProps(this.graphs.graph1, getRegionBound({
                    x: 0,
                    y: splitY,
                    width: splitX,
                    height: view.height - splitY
                }, {horizontal: 0, vertical: 0}, 1));
                setProps(this.graphs.graph2, getRegionBound({
                    x: splitX,
                    y: splitY,
                    width: splitX,
                    height: view.height - splitY
                }, {horizontal: 0, vertical: 0}, 1));

                //resize dropdowns
                setDropdownProps(this.dropDowns.graph1Model, {
                    button: getRegionBound({
                        x: 0,
                        y: view.y,
                        width: splitX,
                        height: splitY * 0.25
                    }, {horizontal: 0.2, vertical: 0.2}),
                    optionProps: (ind) => {
                        return getRegionBound({
                            x: 0,
                            y: view.y + (splitY * 0.25) * (ind + 1),
                            width: splitX,
                            height: splitY * 0.25
                        }, {horizontal: 0.2, vertical: 0});
                    }
                });
                setDropdownProps(this.dropDowns.graph2Model, {
                    button: getRegionBound({
                        x: splitX,
                        y: view.y,
                        width: splitX,
                        height: splitY * 0.25
                    }, {horizontal: 0.2, vertical: 0.2}),
                    optionProps: (ind) => {
                        return getRegionBound({
                            x: splitX,
                            y: view.y + (splitY * 0.25) * (ind + 1),
                            width: splitX,
                            height: splitY * 0.25
                        }, {horizontal: 0.2, vertical: 0});
                    }
                });
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

                //resize dropdowns
                setDropdownProps(this.dropDowns.graph1Model, {
                    button: getRegionBound({
                        x: 0,
                        y: view.y,
                        width: splitX,
                        height: splitY * 0.1
                    }, {horizontal: 0.2, vertical: 0.2}),
                    optionProps: (ind) => {
                        return getRegionBound({
                            x: 0,
                            y: view.y + (splitY * 0.1) * (ind + 1),
                            width: splitX,
                            height: splitY * 0.1
                        }, {horizontal: 0.2, vertical: 0});
                    }
                });
                setDropdownProps(this.dropDowns.graph2Model, {
                    button: getRegionBound({
                        x: 0,
                        y: view.y + splitY,
                        width: splitX,
                        height: splitY * 0.1
                    }, {horizontal: 0.2, vertical: 0.2}),
                    optionProps: (ind) => {
                        return getRegionBound({
                            x: 0,
                            y: view.y + splitY + (splitY * 0.1) * (ind + 1),
                            width: splitX,
                            height: splitY * 0.1
                        }, {horizontal: 0.2, vertical: 0});
                    }
                });
            }
            Object.values(this.graphs).forEach((graph) => {
                graph.drawGraph(document.getElementById(graph.name));
            });
            this.onUpdate(moduleData);
        }
    })