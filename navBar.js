import { AlgebraicEffect, effectHandler } from "./algebraicEffect.js";
import { module, setModule } from "./main.js";
import { Button } from './UIclasses/Button.js';
import { setEqualFont, runFn } from "./utils.js";

export let navBar = {};

export function resetNavBar(moduleData){
    navBar = Object.keys(moduleData).reduce((navButtons, moduleName, ind, arr) => {
        navButtons[moduleName] = new Button({
            x: (canvas.width / arr.length) * ind,
            y: 0,
            width: (canvas.width / arr.length),
            height: canvas.height * 0.1,
            bgColor: ((moduleName === module) ? "black" : "white"),
            onClick: function* () {
                let self = yield new AlgebraicEffect("GET SELF");
                self.bgColor = "white";
                self.fontColor = "black";
                navBar[moduleName].bgColor = "black";
                navBar[moduleName].fontColor = "white";
                setModule(moduleName);
                yield* runFn(moduleData[moduleName].onReload);
            },
            label: {text: moduleName, font: "default", color: ((moduleName === module) ? "white" : "black")},
            outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
            animate: function* () {
                let self = yield new AlgebraicEffect("GET SELF");
                if (self.hovering() && (self.bgColor !== "black")){
                    self.bgColor = "#ADD8E6";
                }else if (self.bgColor !== "black"){
                    self.bgColor = "white";
                }
            }
        });
        return navButtons;
    },{});
}

export function refreshNavBar(moduleOpen){
    let numButtons = Object.keys(navBar).length;
    Object.keys(navBar).forEach((buttonName, ind) => {
        let button = navBar[buttonName];
        button.x = (canvas.width / numButtons) * ind;
        button.width = (canvas.width / numButtons);
        button.height = canvas.height * 0.1;
        button.bgColor = ((buttonName === moduleOpen) ? "black" : "white");
        button.fontColor = ((buttonName === moduleOpen) ? "white" : "black");
        button.outlineThickness = Math.min(canvas.width,canvas.height) * 0.001;
    });
    effectHandler({
        tryCode: function* () {
            yield* setEqualFont(Object.values(navBar));
        },
        handleCode: function(){}
    });
}