import { Module } from '../../module.js';
import { tandemAndOvoidsPage } from './tandem-Ovoids.js';
import { vaginalCylinderPage } from './vaginalCylinder.js';
import { tandemAndRingPage } from './tandem-Ring.js';

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
const thisModule = "brachytherapy applicators";

// initalize brachytherapyApplicatorsPage with the appropriate subpages
export let brachytherapyApplicatorsPage = new Module({
    specialVars: {
        subPages: {
            "vaginal cylinder": vaginalCylinderPage,
            "tandem+ovoids": tandemAndOvoidsPage,
            "tandem+ring": tandemAndRingPage
        },
        applicatorName: "vaginal cylinder"
    },
    onUpdate: function () {},
    onReload: function () {
        // set the page to the appropriate subpage based on the applicator name
        Object.assign(this, this.subPages[this.applicatorName]);
        this.onUpdate();
    },
    defaultInputHandler: {}
});


// initalize the pages
Object.values(brachytherapyApplicatorsPage.subPages).forEach((subPage) => {
    ["graphs","sliders","dropDowns","labels","buttons"].forEach((obj) => {
        if (typeof subPage[obj] !== "undefined"){
            Object.keys(subPage[obj]).forEach((attribute) => {
                let attributefn = subPage[obj][attribute];
                if (typeof attributefn === "function"){
                    subPage[obj][attribute] = attributefn(attribute);
                }
            });
        }
    });
});

// reload the page after initalizing the pages
brachytherapyApplicatorsPage.onReload();