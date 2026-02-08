import { singleSeedPage } from './Pages/singleseed.js';
import { stringofseedsPage } from './Pages/stringofseeds.js';
import { PlanarArrayOfSeeds } from './Pages/planararrayofseeds.js';
import { brachytherapyApplicatorsPage } from './Pages/Brachytherapy Applicators/brachytherapyapplicators.js';
import { navBar, resetNavBar } from './navBar.js';
import { effectHandler, AlgebraicEffect } from './algebraicEffect.js';
import { runFn, resetCanvas } from './utils.js';

let canvas = document.getElementById("canvas");
export let ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// keeps track of the current layer that is being drawn on
let layerNum = 0;

export let module = "single seed";
export function setModule(newModule) {module = newModule;}
let scrollPos = {
    x: 0,
    y: 0
};
export let view = {
    x: 0,
    y: canvas.height * 0.1,
    width: canvas.width,
    height: (canvas.height * 0.9)
};

window.mouse = {x: 0, y: 0, down: false};
export let moduleData = {
    "single seed": singleSeedPage,
    "string of seeds": stringofseedsPage,
    "planar array of seeds": PlanarArrayOfSeeds,
    "brachytherapy applicators": brachytherapyApplicatorsPage,
};

effectHandler({
    tryCode: function* (){
        let module = yield new AlgebraicEffect("GET MODULE");
        yield* module.refreshApplicator();
    },
    handleCode: (effect) => {
        if (effect === "GET MODULE"){
            return brachytherapyApplicatorsPage.subPages[brachytherapyApplicatorsPage.applicatorName];
        }
    }
});

resetNavBar(moduleData);
effectHandler({
    tryCode: function* () {
        yield* runFn(moduleData[module].onReload);
    },
    handleCode: mainEffectHandler
});

setInterval(tick,50);

function tick(){
    resetCanvas(ctx);
    layerNum = 0;

    effectHandler({
        tryCode: function* () {
            yield* runFn(moduleData[module].onUpdate);
        },
        handleCode: mainEffectHandler
    });
    if ((canvas.width != window.innerWidth) || (canvas.height != window.innerHeight)){
        view = {
            x: 0,
            y: window.innerHeight * 0.1,
            width: window.innerWidth,
            height: (window.innerHeight * 0.9)
        };
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        effectHandler({
            tryCode: function* () {
                yield* runFn(moduleData[module].onReload);
            },
            handleCode: mainEffectHandler
        });
    }
}

addEventListener("scroll",function (){
    scrollPos = {
        x: window.scrollX,
        y: window.scrollY
    }
});
addEventListener("pointermove",function (e){
    updateMousePos(e);
    effectHandler({
        tryCode: function* () {
            yield* runFn(moduleData[module].onMouseMove, e);
        },
        handleCode: mainEffectHandler
    });
});
addEventListener("pointerdown",function (e){
    updateMousePos(e);
    mouse.down = true;
    Object.values(navBar).forEach((pageButton) => {
        effectHandler({
            tryCode: pageButton.checkClicked(),
            handleCode: mainEffectHandler
        })
    });
    effectHandler({
        tryCode: function* () {
            yield* runFn(moduleData[module].onMouseDown, e);
        },
        handleCode: mainEffectHandler
    });
});
addEventListener("pointerup",function (e){
    updateMousePos(e);
    mouse.down = false;
    effectHandler({
        tryCode: function* () {
            yield* runFn(moduleData[module].onMouseUp, e);
        },
        handleCode: mainEffectHandler
    });
});
addEventListener("keydown", function (e) {
    effectHandler({
        tryCode: function* () {
            yield* runFn(moduleData[module].onKeyDown, e);
        },
        handleCode: mainEffectHandler
    });
});

function updateMousePos(e){
    mouse.x = e.clientX + scrollPos.x;
    mouse.y = e.clientY + scrollPos.y;
}

function mainEffectHandler(effect, ...args){
    if (effect === "GET MODULE"){
        return moduleData[module];
    }
    if (effect === "ERROR"){
        console.error("error");
    }
    if (effect === "ADD LAYER") {
        return ++layerNum;
    }
    if (effect === "HOVERING") {
        return true; //#
    }
}