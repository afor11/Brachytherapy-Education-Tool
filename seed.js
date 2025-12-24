import { magnitude , interpolateTable, biliniarInterpolateTable } from "./utils.js";

export class Seed {
    constructor (pos, rot, model, airKerma, dwellTime){
        this.model = model;
        this.pos = pos; // measured in cm
        this.rot = rot; // measured in radians
        this.airKerma = airKerma; // measured in U
        this.dwellTime = dwellTime; // Measured in hours
        this.enabled = true;
        this.directionVec;
        this.geometryRef = {x: 0, y: 1, z: 0, r: 1, theta: Math.PI / 2};
        this.recalcDirection();
    }
    g(r){
        if (this.model.pointSource){
            return interpolateTable(this.model.pointSourcegValues,this.model.pointSourcegMeasurementPoints,r);
        }
        return interpolateTable(this.model.gValues,this.model.gMeasurementPoints,r);
    }
    F(pos){
        if (pos.r == 0){
            return 1;
        }
        let transformedTheta;
        if (this.model.maxAngle > 90){
            transformedTheta = pos.theta;
        }else{
            if (pos.theta > Math.PI / 2){
                transformedTheta = Math.PI - pos.theta;
            }else{
                transformedTheta = pos.theta;
            }
        }
        return biliniarInterpolateTable(
            this.model.FValues,
            this.model.FAngleMeasured,
            this.model.FDistanceMeasured,
            transformedTheta,
            pos.r
        );
    }
    geometryFactor(pos){
        if (pos.r == 0){
            return 1;
        }
        let geometry;
        if (this.model.pointSource){
            geometry = 1/(pos.r ** 2);
        }else{
            if ((pos.theta == 0) || (pos.theta == Math.PI)){
                geometry = 1 / ((pos.r ** 2) - ((this.model.sourceLength ** 2) / 4)); // case for if theta == 0, since that would lead to a divide by 0 error
            }else{
                let vec1 = {
                    x: (pos.x - this.pos.x + this.directionVec.x * (this.model.sourceLength / 2)),
                    y: (pos.y - this.pos.y + this.directionVec.y * (this.model.sourceLength / 2)),
                    z: (pos.z - this.pos.z + this.directionVec.z * (this.model.sourceLength / 2))
                }; //calculates vector from one end of the seed to the given pos
                let vec2 = {
                    x: (pos.x - this.pos.x - this.directionVec.x * (this.model.sourceLength / 2)),
                    y: (pos.y - this.pos.y - this.directionVec.y * (this.model.sourceLength / 2)),
                    z: (pos.z - this.pos.z - this.directionVec.z * (this.model.sourceLength / 2))
                }; //calculates vector from the opposite end of the seed to the given pos
                let beta = Math.acos((vec1.x * vec2.x + vec1.y * vec2.y + vec1.z * vec2.z) / (magnitude(vec1) * magnitude(vec2))) //finds the angle between vec1 and vec2 using dot product
                geometry = beta / (this.model.sourceLength * pos.r * Math.abs(Math.sin(pos.theta)));
            }
        }
        return geometry;
    }
    calculateDose(pos){ //this all assumes the camera is looking such that further away is positive z, so none of these calcs include z
        if (this.enabled){
            let doseRate = this.airKerma * this.model.doseRateConstant * (this.geometryFactor(pos)/this.geometryFactor({r: this.geometryRef.r, theta: this.geometryRef.theta, x:this.geometryRef.x + this.pos.x, y:this.geometryRef.y + this.pos.y, z: this.geometryRef.z})) * this.g(pos.r) * this.F(pos);
            return doseRate * 1.44 * this.model.halfLife * (this.model.HDRsource ? (1 - Math.exp(-this.dwellTime / (1.44 * this.model.halfLife))) : 1) / 100; // this is divided by 100 to convert to Gy
        }else{
            return 0;
        }
    }
    recalcDirection(){
        // calculate direction vec
        this.directionVec = {
            x: Math.cos(this.rot.theta) * Math.cos(this.rot.phi),
            y: Math.sin(this.rot.phi),
            z: Math.sin(this.rot.theta) * Math.cos(this.rot.phi)
        };
        let norm = magnitude(this.directionVec);
        this.directionVec = {
            z: this.directionVec.z / norm,
            x: this.directionVec.x / norm,
            y: this.directionVec.y / norm,
        };

        // calculate geometry reference point
        if (this.directionVec.z == 0) {
            if (this.directionVec.x == 0) {
                this.geometryRef = {x: 1, y: ((-this.directionVec.x - this.directionVec.z) / this.directionVec.y), z: 1};
            }else{
                this.geometryRef = {x: ((-this.directionVec.y - this.directionVec.z) / this.directionVec.x), y: 1, z: 1};
            }
        }else{
            this.geometryRef = {x: 1, y: 1, z: (-this.directionVec.x - this.directionVec.y) / this.directionVec.z};
        }
        norm = magnitude(this.geometryRef);
        this.geometryRef = {
            x: this.geometryRef.x / norm,
            y: this.geometryRef.y / norm,
            z: this.geometryRef.z / norm,
            r: 1,
            theta: Math.PI / 2
        };
    }
}