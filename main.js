import { singleSeedPage } from './Pages/singleseed.js';
import { refreshNavBar } from './navBar.js';

let canvas = document.getElementById("canvas");
export let ctx = canvas.getContext("2d");
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;
export let module = "single seed";
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
    "single seed": singleSeedPage
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
                    moduleData[module][obj][attribute] = attributefn(moduleData,attribute);
                }
            });
        }
    });
});

refreshNavBar(moduleData);
moduleData[module].onReload(moduleData);

setInterval(tick,50);

function tick(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    moduleData[module].onUpdate(moduleData);
    if (!moduleData[module].clickHandled){
        moduleData[module].onClick(moduleData);
    }
    if ((canvas.width != window.innerWidth) || (canvas.height != window.innerHeight)){
        view = {
            x: 0,
            y: window.innerHeight * 0.1,
            width: window.innerWidth,
            height: (window.innerHeight * 0.9)
        };
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        moduleData[module].onReload(moduleData);
    }
}

addEventListener("scroll",function (e){
    scrollPos = {
        x: window.scrollX,
        y: window.scrollY
    }
});
addEventListener("mousemove",function (e){
    updateMousePos(e);
});
addEventListener("mousedown",function (e){
    updateMousePos(e);
    mouse.down = true;
    moduleData[module].clickHandled = false;
    moduleData[module].onClick(moduleData);
});
addEventListener("mouseup",function (e){
    updateMousePos(e);
    mouse.down = false;
});
addEventListener("keydown", function (e) {
    moduleData[module].onKeyDown(e, moduleData);
});

function updateMousePos(e){
    mouse.x = e.clientX + scrollPos.x;
    mouse.y = e.clientY + scrollPos.y;
}