import { Module } from '../../module.js';
import { tandemAndOvoidsPage } from './tandem-Ovoids.js';
import { vaginalCylinderPage } from './vaginalCylinder.js';
import { tandemAndRingPage } from './tandem-Ring.js';
import { AlgebraicEffect, effectHandler } from '../../algebraicEffect.js';
import { clone, runFn } from '../../utils.js';

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
        applicatorName: "vaginal cylinder"
    },
    onUpdate: function () {
        callModuleFunc.call(this,"onUpdate");
    },
    onReload: function () {
        callModuleFunc.call(this,"onReload");
        callModuleFunc.call(this,"onUpdate");
    },
    defaultInputHandler: {
        onMouseMove: function(e) {callModuleFunc.call(this,"onMouseMove",e)},
        onMouseDown: function(e) {callModuleFunc.call(this,"onMouseDown",e)},
        onMouseUp: function(e) {callModuleFunc.call(this,"onMouseUp",e)},
        onKeyDown: function(e) {callModuleFunc.call(this,"onKeyDown",e)},
    }
});

function callModuleFunc(func, ...args){
    let thisModule = this;
    effectHandler({
        tryCode: function* (){
            let module = yield new AlgebraicEffect("GET MODULE");
            if (Object.hasOwn(module, func)){
                yield* runFn(module[func].bind(module, ...args));
            }
        },
        handleCode: (effect, ...effectArgs) => {
            if (effect === "GET MODULE"){
                return thisModule.subPages[thisModule.applicatorName];
            }
            if (effect === "GET PARENT MODULE"){
                return thisModule;
            }
            if (effect === "LOAD APPLICATOR"){
                thisModule.applicatorName = effectArgs[0];
                return thisModule.subPages[thisModule.applicatorName].refreshApplicator();
            }
        }
    });
}