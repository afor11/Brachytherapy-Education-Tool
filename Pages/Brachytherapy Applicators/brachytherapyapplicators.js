import { Module } from '../../module.js';
import { tandemAndOvoidsPage } from './tandem-Ovoids.js';
import { vaginalCylinderPage } from './vaginalCylinder.js';
import { tandemAndRingPage } from './tandem-Ring.js';
import { AlgebraicEffect, chainEffectHandler } from '../../algebraicEffect.js';
import { runFn } from '../../utils.js';

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
        yield* callModuleFunc.call(this,"onUpdate");
    },
    onReload: function* () {
        yield* callModuleFunc.call(this,"onReload");
        yield* callModuleFunc.call(this,"onUpdate");
    },
    defaultInputHandler: {
        onMouseMove: function* (e) {yield* callModuleFunc.call(this,"onMouseMove",e)},
        onMouseDown: function* (e) {yield* callModuleFunc.call(this,"onMouseDown",e)},
        onMouseUp: function* (e) {yield* callModuleFunc.call(this,"onMouseUp",e)},
        onKeyDown: function* (e) {yield* callModuleFunc.call(this,"onKeyDown",e)},
    }
});

function* callModuleFunc(func, ...args){
    let self = yield new AlgebraicEffect("GET MODULE");
    let thisModule = self.subPages[self.applicatorName];
    yield* chainEffectHandler({
        tryCode: function* (){
            if (Object.hasOwn(thisModule, func)){
                yield* runFn(thisModule[func].bind(thisModule, ...args));
            }
        },
        handleCode: handleSubpageEffects.bind(self)
    });
}

function* handleSubpageEffects(effect, ...effectArgs){
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
}