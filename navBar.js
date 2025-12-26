import { module } from "./main.js";
import { Button } from './UIclasses/Button.js';

export let navBar = {};

export function refreshNavBar(moduleData){
    navBar = Object.keys(moduleData).reduce((navButtons, moduleName, ind, arr) => {
        navButtons[moduleName] = new Button({
            x: (canvas.width / arr.length) * ind,
            y: 0,
            width: (canvas.width / arr.length),
            height: canvas.height * 0.1,
            bgColor: "white",
            onClick: () => {
                navBar[module].bgColor = "white";
                navBar[module].label.color = "black";
                navBar[moduleName].bgColor = "black";
                navBar[moduleName].label.color = "white";
                module = moduleName;
                moduleData[moduleName].onReload(moduleData);
            },
            label: {text: moduleName, font: "default", color: "black"},
            outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}
        });
        return navButtons;
    },{});
}