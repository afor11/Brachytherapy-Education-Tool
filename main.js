import { singleSeedPage } from './Pages/singleseed.js';
import { stringofseedsPage } from './Pages/stringofseeds.js';
import { PlanarArrayOfSeeds } from './Pages/planararrayofseeds.js';
import { brachytherapyApplicatorsPage } from './Pages/Brachytherapy Applicators/brachytherapyapplicators.js';
import { navBar, resetNavBar } from './navBar.js';
import { effectHandler } from './algebraicEffect.js';

let canvas = document.getElementById("canvas");
export let ctx = canvas.getContext("2d");
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;
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

//loop over moduleData and evaluate any attribute functions (these are neccisary since attributes that reference
//themselves must be intialized after the creation of moduleData, so they are stored in a function and after the
//creation of moduleData, they are evaluated and replaced based on the result of that function evaluation)
Object.keys(moduleData).forEach((module) => {
    ["graphs","sliders","dropDowns","labels","buttons"].forEach((obj) => {
        if (typeof moduleData[module][obj] !== "undefined"){
            Object.keys(moduleData[module][obj]).forEach((attribute) => {
                let attributefn = moduleData[module][obj][attribute];
                if (typeof attributefn === "function"){
                    moduleData[module][obj][attribute] = attributefn(attribute);
                }
            });
        }
    });
});

resetNavBar(moduleData);
moduleData[module].onReload();

setInterval(tick,50);

function tick(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    moduleData[module].onUpdate();
    if ((canvas.width != window.innerWidth) || (canvas.height != window.innerHeight)){
        view = {
            x: 0,
            y: window.innerHeight * 0.1,
            width: window.innerWidth,
            height: (window.innerHeight * 0.9)
        };
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        moduleData[module].onReload();
    }
}

addEventListener("scroll",function (){
    scrollPos = {
        x: window.scrollX,
        y: window.scrollY
    }
});
addEventListener("mousemove",function (e){
    updateMousePos(e);
    moduleData[module].eventHandler("onMouseMove",e);
});
addEventListener("mousedown",function (e){
    updateMousePos(e);
    mouse.down = true;
    Object.values(navBar).forEach((pageButton) => {
        effectHandler({
            tryCode: pageButton.checkClicked(),
            handleCode: function(effect){
                if (effect === "GET MODULE"){
                    return moduleData[module];
                }
            }
        })
    });
    moduleData[module].eventHandler("onMouseDown",e);
});
addEventListener("mouseup",function (e){
    updateMousePos(e);
    mouse.down = false;
    moduleData[module].eventHandler("onMouseUp",e);
});
addEventListener("keydown", function (e) {
    moduleData[module].eventHandler("onKeyDown",e);
});

function updateMousePos(e){
    mouse.x = e.clientX + scrollPos.x;
    mouse.y = e.clientY + scrollPos.y;
}