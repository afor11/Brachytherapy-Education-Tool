import { Module } from '../../module.js';
import { tandemAndOvoidsPage } from './tandem-Ovoids.js';
import { vaginalCylinderPage } from './vaginalCylinder.js';
import { tandemAndRingPage } from './tandem-Ring.js';
import { AlgebraicEffect, effectHandler, chainEffectHandler } from '../../algebraicEffect.js';
import { clone, runFn } from '../../utils.js';

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

// initalize brachytherapyApplicatorsPage with the appropriate subpages
export let brachytherapyApplicatorsPage = new Module({
    specialVars: {
        subPages: {
            "VaginalCylinder": vaginalCylinderPage,
            "tandem+ovoids": tandemAndOvoidsPage,
            "tandem+ring": tandemAndRingPage
        },
        applicatorName: "VaginalCylinder"
    },
    onUpdate: function* () {
        let thisModule = this;

        // call the onUpdate function of the module, using handleSubpageEffects as the chained effect handler,
        // allowing effects to still bubble up to main
        yield* chainEffectHandler({
            tryCode: function* (){
                let module = yield new AlgebraicEffect("GET MODULE");
                yield* runFn(module.onUpdate.bind(module));
            },
            handleCode: function* (effect, ...effectArgs){
                let effectYield = handleSubpageEffects.call(thisModule, effect, ...effectArgs);
                if (typeof effectYield != "undefined"){
                    return effectYield;
                }
            }
        });
    },
    onReload: function () {
        // when the module is reloaded, no effects will allowed to bubble up past this point
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
    effectHandler({
        tryCode: function* (){
            let module = yield new AlgebraicEffect("GET MODULE");
            if (Object.hasOwn(module, func)){
                yield* runFn(module[func].bind(module, ...args));
            }
        },
        handleCode: (effect, ...effectArgs) => handleSubpageEffects.call(this, effect, ...effectArgs)
    });
}

function handleSubpageEffects(effect, ...effectArgs){
    if (effect === "GET MODULE"){
        return this.subPages[this.applicatorName];
    }
    if (effect === "GET PARENT MODULE"){
        return this;
    }
    if (effect === "LOAD APPLICATOR"){
        this.applicatorName = effectArgs[0];
        return this.subPages[this.applicatorName].refreshApplicator();
    }
    if (effect === "GET APPLICATOR DATA"){
        return this.subPages[this.applicatorName].applicator;
    }
}