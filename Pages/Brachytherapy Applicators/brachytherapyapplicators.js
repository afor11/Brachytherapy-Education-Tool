import { Module } from '../../module.js';
import { tandemAndOvoidsPage } from './tandem-Ovoids.js';
import { vaginalCylinderPage } from './vaginalCylinder.js';
import { tandemAndRingPage } from './tandem-Ring.js';
import { AlgebraicEffect, effectHandler } from '../../algebraicEffect.js';

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

// initalize brachytherapyApplicatorsPage with the appropriate subpages
export let brachytherapyApplicatorsPage = new Module({
    specialVars: {
        subPages: {
            "vaginal cylinder": vaginalCylinderPage,
            "tandem+ovoids": tandemAndOvoidsPage,
            "tandem+ring": tandemAndRingPage
        },
        applicatorName: "vaginal cylinder",
        *changeApplicator(newApplicator, thisModule){
            let module = thisModule;
            if (typeof module === "undefined"){
                module = yield new AlgebraicEffect("GET MODULE");
            }
            if (typeof applicatorName !== "undefined"){
                Object.assign(module.subPages[applicatorName], module);
            }
            Object.assign(module, module.subPages[newApplicator]);
            yield* module.refreshApplicator();
            module.onReload();
        }
    },
    onUpdate: function () {},
    onReload: function () {
        // set the page to the appropriate subpage based on the applicator name
        let thisModule = this;
        effectHandler({
            tryCode: function* (){
                let module = yield new AlgebraicEffect("GET MODULE");
                yield* module.changeApplicator(module.applicatorName);
            },
            handleCode: (effect) => {
                if (effect === "GET MODULE"){
                    return thisModule;
                }
            }
        })
    },
    defaultInputHandler: {}
});