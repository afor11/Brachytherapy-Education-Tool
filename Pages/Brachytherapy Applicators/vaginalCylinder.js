import { TheraSeed200, Best2301, GammaMedHDRPlus, BEBIG_GK60M21, ElektaFlexisource, airKermaSliderLimits } from '../../constants.js';
import { Seed } from '../../seed.js';
import { Graph } from '../../graph.js';
import { Module } from '../../module.js';
import { getRegionBound, getRange, referencePointLabel, dwellTimeLabel, airKermaLabel, modelDropdown, airKermaSlider, dwellTimeSlider, rescaleDropdownButtons } from '../../utils.js';
import { refreshNavBar, navBar } from "../../navBar.js";
import { view } from "../../main.js";
import { NumberInput } from '../../UIclasses/NumberInput.js';

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
const thisModule = "brachytherapy applicators";

export let vaginalCylinderPage = new Module({
    graphs: {
        graph1: new Graph({
            x: 0, y: 0, width: 0, height: 0,
            seeds: [
                new Seed({x:0, y:0, z:0},{phi: 0, theta: 0},TheraSeed200,airKermaSliderLimits.LDR.min,0.00833)
            ],
            xTicks: getRange(-2, 2, 0.0625), yTicks: getRange(-2, 6, 0.0625), perspective: (point) => point, name: "graph1", refpoints: [{x: 0, y: 1, z: 0}]
        }),
    },
    labels: {
        treatmentTime: function (){
            /*new NumberInput({
                x: 0, y: 0, width: 0, height: 0,
                label: {
                    text: (value) => `Dose: ${value} Gy`,
                    color: {selected: "white", notSelected: "black"}
                },bgColor: {selected: "black", notSelected: "white"},
                getValue: () => moduleData[thisModule].graphs[graphName].getPointDose(
                    moduleData[thisModule].graphs[graphName].refpoints[refPointInd]
                ),
                onEnter: function (value){
                    setDoseAtPoint(
                        this.module.graphs[graphName],
                        value,
                        this.module,
                        this.module.graphs[graphName].refpoints[refPointInd]
                    );
                },
                numDecimalsEditing: 3
            });*/
        }
    },
    onUpdate: function () {
        ctx.clearRect(0,0,canvas.width,canvas.height);

        Object.values(navBar).forEach((button) => {
            button.draw();
        });
    },
    onReload: function () {
        refreshNavBar(thisModule);

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
        Object.assign(this.graphs.graph1, getRegionBound({
            x: splitX,
            y: view.y,
            width: view.width - splitX,
            height: view.height
        }, {horizontal: 0, vertical: 0}, this.graphs.graph1.unitWidth()/this.graphs.graph1.unitHeight()));

        this.graphs.graph1.drawGraph(document.getElementById("graph1"));

        this.onUpdate();
    },
    defaultInputHandler: {
        onMouseDown: function* () {
        },
    }
});