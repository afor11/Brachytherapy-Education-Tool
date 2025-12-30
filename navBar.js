import { module, setModule } from "./main.js";
import { Button } from './UIclasses/Button.js';

export let navBar = {};

export function resetNavBar(moduleData){
    navBar = Object.keys(moduleData).reduce((navButtons, moduleName, ind, arr) => {
        navButtons[moduleName] = new Button({
            x: (canvas.width / arr.length) * ind,
            y: 0,
            width: (canvas.width / arr.length),
            height: canvas.height * 0.1,
            bgColor: ((moduleName === module) ? "black" : "white"),
            onClick: function () {
                this.self.bgColor = "white";
                this.self.fontColor = "black";
                navBar[moduleName].bgColor = "black";
                navBar[moduleName].fontColor = "white";
                setModule(moduleName);
                moduleData[moduleName].onReload();
            },
            label: {text: moduleName, font: "default", color: ((moduleName === module) ? "white" : "black")},
            outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}
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
    })
}