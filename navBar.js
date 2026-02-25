import { AlgebraicEffect, effectHandler } from "./algebraicEffect.js";
import { page, setPage } from "./main.js";
import { Button } from './UIclasses/Button.js';
import { setEqualFont, runFn } from "./utils.js";
import { colorPalette } from "./constants.js";

export let navBar = {};

export function resetNavBar(moduleData){
    if (page[0] != "modules") {
        navBar = {};
    } else {
        let module = page[1];
        navBar = Object.keys(moduleData).reduce((navButtons, moduleName, ind, arr) => {
        navButtons[moduleName] = new Button({
                x: (canvas.width / arr.length) * ind,
                y: 0,
                width: (canvas.width / arr.length),
                height: canvas.height * 0.1,
                bgColor: ((moduleName === module) ? colorPalette.secondary : colorPalette.primary),
                onClick: function* () {
                    let self = yield new AlgebraicEffect("GET SELF");
                    self.bgColor = colorPalette.primary;
                    self.fontColor = colorPalette.accent;
                    navBar[moduleName].bgColor = colorPalette.secondary;
                    navBar[moduleName].fontColor = colorPalette.primary;
                    setPage("modules", moduleName);
                    yield* runFn(moduleData[moduleName].onReload);
                },
                label: {text: moduleName, font: "default", color: ((moduleName === module) ? colorPalette.primary : colorPalette.secondary)},
                outline: {color: colorPalette.accent, thickness: Math.min(canvas.width,canvas.height) * 0.001},
                cornerRounding: 0
            });
            return navButtons;
        },{});
    }
}

export function refreshNavBar(moduleOpen){
    if (page[0] != "modules") {
        navBar = {};
    } else {
        let numButtons = Object.keys(navBar).length;
        Object.keys(navBar).forEach((buttonName, ind) => {
            let button = navBar[buttonName];
            button.x = (canvas.width / numButtons) * ind;
            button.width = (canvas.width / numButtons);
            button.height = canvas.height * 0.1;
            button.bgColor = ((buttonName === moduleOpen) ? colorPalette.secondary : colorPalette.primary);
            button.fontColor = ((buttonName === moduleOpen) ? colorPalette.primary : colorPalette.secondary);
            button.outlineThickness = Math.min(canvas.width,canvas.height) * 0.001;
            button.hoverCol = ((buttonName === moduleOpen) ? colorPalette.secondary : colorPalette.grey.light);
        });
        effectHandler({
            tryCode: function* () {
                yield* setEqualFont(Object.values(navBar));
            },
            handleCode: function(){}
        });
    }
}