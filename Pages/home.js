import { AlgebraicEffect } from "../algebraicEffect.js";
import { colorPalette } from "../constants.js";
import { Module } from "../module.js";
import { Button } from "../UIclasses/Button.js";
import { expandOnHover, getRegionBound, resetCanvas, getCornerRounding, setEqualFont } from "../utils.js";

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let logo = new Image();
let logoLoaded = false;
logo.src = "Images/BERT logo_2.png";
logo.onload = function() {
    logoLoaded = true;
}


export let home = new Module({
    buttons: {
        start: new Button({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: "Start",
                font: "default",
                color: colorPalette.primary
            },
            bgColor: colorPalette.secondary,
            onClick: function* () {
                yield new AlgebraicEffect("START");
            },
            outline: {thickness: 0, color: colorPalette.accent},
            animate: expandOnHover,
            hoverCol: colorPalette.grey.dark
        }),
        userGuide: new Button({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: "User Guide",
                font: "default",
                color: colorPalette.primary
            },
            bgColor: colorPalette.secondary,
            onClick: function () {
                window.location.href = "https://docs.google.com/document/d/e/2PACX-1vSVrE-ioNkNoD8S0KzqGutx5gjOninEnR17ysZ39VBcZdWexUDw0_N-QojtLg1l9fjhLMGFVgOEk7T8/pub?embedded=true"; //# update with link to user guide
            },
            outline: {thickness: 0, color: colorPalette.accent},
            animate: expandOnHover,
            hoverCol: colorPalette.grey.dark
        }),
        disclaimer: new Button({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: "This tool is for educational purposes only and NOT for clinical use",
                font: "default",
                color: colorPalette.accent
            },
            bgColor: colorPalette.primary,
            onClick: () => {},
            outline: {thickness: Math.min(canvas.width, canvas.height) * 0.05, color: colorPalette.accent},
            hoverCol: colorPalette.grey.light
        }),
        nameDateTag: new Button({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: "Avi Ford, 2026",
                font: "default",
                color: colorPalette.accent
            },
            bgColor: colorPalette.primary,
            onClick: () => {},
            outline: {thickness: 0, color: colorPalette.accent},
            hoverCol: colorPalette.grey.light
        })
    },
    onUpdate: function* () {
        resetCanvas(ctx);

        yield* this.buttons.start.draw();
        yield* this.buttons.userGuide.draw();
        yield* this.buttons.disclaimer.draw();
        yield* this.buttons.nameDateTag.draw();

        if (logoLoaded) {
            // get logo region
            let logoRegion = getRegionBound(
                {
                    x: 0,
                    y: 0,
                    width: canvas.width,
                    height: canvas.height * 0.5
                },
                {
                    horizontal: 0.2,
                    vertical: 0.2
                },
                (logo.width / logo.height)
            );

            // get clipping region for logo
            let clippingRegion = new Path2D();
            clippingRegion.roundRect(
                logoRegion.x,
                logoRegion.y,
                logoRegion.width,
                logoRegion.height,
                getCornerRounding(logoRegion, 0.5)
            );

            // draw and clip logo
            ctx.save();
            ctx.clip(clippingRegion);
            ctx.drawImage(logo, logoRegion.x, logoRegion.y, logoRegion.width, logoRegion.height);
            ctx.restore();
        }
    },
    onReload: function* () {
        Object.assign(this.buttons.start, getRegionBound({
            x: canvas.width * 0.2,
            y: canvas.height * 0.5,
            width: canvas.width * 0.6,
            height: canvas.height * 0.15
        }, { horizontal: 0.2, vertical: 0.1 }));

        Object.assign(this.buttons.userGuide, getRegionBound({
            x: canvas.width * 0.2,
            y: canvas.height * 0.7,
            width: canvas.width * 0.6,
            height: canvas.height * 0.15
        }, { horizontal: 0.2, vertical: 0.1 }));

        Object.assign(this.buttons.disclaimer, getRegionBound({
            x: 0,
            y: canvas.height * 0.9,
            width: canvas.width,
            height: canvas.height * 0.05
        }, { horizontal: 0.2, vertical: 0 }));

        Object.assign(this.buttons.nameDateTag, getRegionBound({
            x: 0,
            y: canvas.height * 0.97,
            width: canvas.width * 0.1,
            height: canvas.height * 0.03
        }, { horizontal: 0, vertical: 0 }));

        yield* setEqualFont([this.buttons.start, this.buttons.userGuide]);

        yield* this.onUpdate();
    },
    defaultInputHandler: {}
});