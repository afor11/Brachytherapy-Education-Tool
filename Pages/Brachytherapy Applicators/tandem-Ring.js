import { TheraSeed200, Best2301, GammaMedHDRPlus, BEBIG_GK60M21, ElektaFlexisource, airKermaSliderLimits } from '../../constants.js';
import { Seed } from '../../seed.js';
import { Graph } from '../../graph.js';
import { Module } from '../../module.js';
import { getRegionBound, getRange, referencePointLabel, dwellTimeLabel, airKermaLabel, modelDropdown, airKermaSlider, dwellTimeSlider, rescaleDropdownButtons } from '../../utils.js';
import { refreshNavBar, navBar } from "../../navBar.js";
import { view } from "../../main.js";

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
const thisModule = "brachytherapy applicators";

export let tandemAndRingPage = new Module({
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
    onUpdate: function () {
        ctx.clearRect(0,0,canvas.width,canvas.height);

        Object.values(navBar).forEach((button) => {
            button.draw();
        });
    },
    onReload: function () {
        refreshNavBar(thisModule);
        
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

        this.onUpdate();
    },
    defaultInputHandler: {
        onMouseDown: function* () {
        },
    }
});