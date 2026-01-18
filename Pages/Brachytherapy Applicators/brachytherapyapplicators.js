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
        applicatorName: "VaginalCylinder",
        *handleSubpageEffects(effect, ...effectArgs){
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
            if (effect === "ERROR"){
                console.error("error :(");
            }
        },
        *callModuleFunc(func, ...args){
            let self = this;
            yield* chainEffectHandler({
                tryCode: function* (){
                    let module = yield new AlgebraicEffect("GET MODULE");
                    if (Object.hasOwn(module, func)){
                        yield* runFn(module[func].bind(module, ...args));
                    }
                },
                handleCode: self.handleSubpageEffects.bind(self)
            });
        }
    },
    onUpdate: function* () {
        yield* this.callModuleFunc("onUpdate");
    },
    onReload: function* () {
        yield* this.callModuleFunc.call(this,"onReload");
        yield* this.callModuleFunc.call(this,"onUpdate");
    },
    defaultInputHandler: {
        onMouseMove: function* (e) {yield* this.callModuleFunc.call(this,"onMouseMove",e)},
        onMouseDown: function* (e) {yield* this.callModuleFunc.call(this,"onMouseDown",e)},
        onMouseUp: function* (e) {yield* this.callModuleFunc.call(this,"onMouseUp",e)},
        onKeyDown: function* (e) {yield* this.callModuleFunc.call(this,"onKeyDown",e)},
    }
});