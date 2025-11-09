var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

let mouse = {x: 0, y: 0, down: false};
let mouseGraphPos = {x: 0, y: 0};
let scrollPos = {x: 0, y: 0};
let render = true; // used to indicate if the graphs should be re-drawn
let resetGraphs = true;
let module = "single seed";
let moduleData = {};
let savedModuleData = {};

const conversionFactors = {
    µCi: {
        µCi: 1,
        Ci: 1000,
        U: 1,
    },
    Ci: {
        µCi: 0.001,
        Ci: 1,
        U: 0.001,
    },
    U: {
        µCi: 1,
        Ci: 1000,
        U: 1,
    },
};
const airKermaSliderLimits ={
    HDR: {
        min: convertUnit("1 Ci","U"),
        max: convertUnit("10 Ci","U")
    },
    LDR: {
        min: convertUnit("1 µCi","U"),
        max: convertUnit("5 µCi","U")
    }
}
const TheraSeed200 = {
    name: "TheraSeed200",
    doseRateConstant: 0.686, // in cGy/h/U
    sourceLength: 0.423, // measured in cm
    sourceDiameter: 0.0560, //cm
    halfLife: 408, // measured in in hours
    isotope: "103-Pd",
    pointSource: false,
    HDRsource: false,
    gValues: [0.911, 1.21, 1.37, 1.38, 1.36, 1.3, 1.15, 1, 0.749, 0.555, 0.41, 0.302, 0.223, 0.163, 0.0887, 0.0482, 0.0262, 0.00615],
    gMeasurementPoints: [0.1, 0.15, 0.25, 0.3, 0.4, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 10],
    pointSourcegValues:[0.494, 0.831, 1.154, 1.22, 1.269, 1.248, 1.137, 1, 0.755, 0.561, 0.415, 0.306, 0.226, 0.165, 0.09, 0.0489, 0.0266, 0.00624],
    pointSourcegMeasurementPoints: [0.1, 0.15, 0.25, 0.3, 0.4, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 10],
    FValues: [
        [0.619,0.694,0.601,0.541,0.526,0.504,0.497,0.513,0.547],
        [0.617,0.689,0.597,0.549,0.492,0.505,0.513,0.533,0.58],
        [0.618,0.674,0.574,0.534,0.514,0.517,0.524,0.538,0.568],
        [0.62,0.642,0.577,0.538,0.506,0.509,0.519,0.532,0.57],
        [0.617,0.6,0.54,0.51,0.499,0.508,0.514,0.531,0.571],
        [0.579,0.553,0.519,0.498,0.498,0.509,0.521,0.532,0.568],
        [0.284,0.496,0.495,0.487,0.504,0.519,0.53,0.544,0.59],
        [0.191,0.466,0.486,0.487,0.512,0.529,0.544,0.555,0.614],
        [0.289,0.446,0.482,0.49,0.523,0.54,0.556,0.567,0.614],
        [0.496,0.442,0.486,0.501,0.547,0.568,0.585,0.605,0.642],
        [0.655,0.497,0.524,0.537,0.582,0.603,0.621,0.64,0.684],
        [0.775,0.586,0.585,0.593,0.633,0.654,0.667,0.683,0.719],
        [0.917,0.734,0.726,0.727,0.75,0.766,0.778,0.784,0.82],
        [0.945,0.837,0.831,0.834,0.853,0.869,0.881,0.886,0.912],
        [0.976,0.906,0.907,0.912,0.931,0.942,0.96,0.964,0.974],
        [0.981,0.929,0.954,0.964,0.989,1.001,1.008,1.004,1.011],
        [0.947,0.938,0.961,0.978,1.006,1.021,1.029,1.024,1.033],
        [0.992,0.955,0.959,0.972,1.017,1.035,1.046,1.037,1.043],
        [1.007,0.973,0.960,0.982,0.998,1.030,1.041,1.036,1.043],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    FDistanceMeasured: [0.25,0.5,0.75,1,2,3,4,5,7.5], // measured in cm
    FAngleMeasured: [0, 0.017453292519943295, 0.03490658503988659, 0.05235987755982988, 0.08726646259971647, 0.12217304763960307, 0.17453292519943295, 0.20943951023931953, 0.2617993877991494, 0.3490658503988659, 0.4363323129985824, 0.5235987755982988, 0.6981317007977318, 0.8726646259971648, 1.0471975511965976, 1.2217304763960306, 1.3089969389957472, 1.3962634015954636, 1.48352986419518, 1.5707963267948966], // measured in degrees
    maxAngle: 90,
}
const Best2301 = {
    name: "Best2301",
    doseRateConstant: 1.018, // in cGy/h/U
    sourceLength: 0.375, // measured in cm
    sourceDiameter: 0.0250, //cm
    halfLife: 1425.6, // measured in in hours
    isotope: "125-I",
    pointSource: false,
    HDRsource: false,
    gValues: [1.033, 1.029, 1.027, 1.028, 1.03, 1, 0.938, 0.866, 0.707, 0.555, 0.427, 0.32, 0.248, 0.187, 0.142, 0.103],
    gMeasurementPoints: [0.1, 0.15, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    pointSourcegValues:[0.579, 0.725, 0.878, 0.991, 1.02, 1, 0.945, 0.875, 0.715, 0.562, 0.432, 0.324, 0.251, 0.189, 0.144, 0.104],
    pointSourcegMeasurementPoints: [0.1, 0.15, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    FValues: [
        [0.367, 0.454, 0.922, 0.902, 0.894, 0.893, 0.858],
        [0.724, 0.72, 0.726, 0.738, 0.753, 0.771, 0.8],
        [0.653, 0.671, 0.699, 0.727, 0.732, 0.764, 0.782],
        [0.785, 0.794, 0.809, 0.814, 0.825, 0.852, 0.821],
        [0.9, 0.89, 0.885, 0.892, 0.899, 0.915, 0.873],
        [0.982, 0.954, 0.947, 0.939, 0.943, 0.976, 0.937],
        [1.014, 0.992, 0.985, 0.991, 0.997, 0.989, 0.961],
        [1.03, 1.01, 1.009, 1.007, 1.01, 1.019, 1.002],
        [1.036, 1.026, 1.016, 1.023, 1.011, 1.035, 1.01],
        [1.01, 1.03, 1.019, 1.017, 1.01, 1.02, 1.005],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    FDistanceMeasured: [1,2,3,4,5,6,7], // measured in cm
    FAngleMeasured: [0, 0.08726646259971647, 0.17453292519943295, 0.3490658503988659, 0.5235987755982988, 0.6981317007977318, 0.8726646259971648, 1.0471975511965976, 1.2217304763960306, 1.3962634015954636, 1.5707963267948966], // measured in radians
    maxAngle: 90,
}
const GammaMedHDRPlus = {
    name: "GammaMedHDRPlus",
    doseRateConstant: 1.117, // in cGy/h/U
    sourceLength: 0.35, // measured in cm
    sourceDiameter: 0.06, //measurec in cm
    halfLife: 1771.848, // measured in in hours
    isotope: "192-Ir",
    pointSource: false,
    HDRsource: true,
    gValues: [0.998,0.988,0.997,0.996,0.998,1,1.003,1.006,1.006,1.004,0.999,0.993,0.968,0.936],
    gMeasurementPoints: [0,0.2,0.25,0.5,0.75,1,0.5,3,4,5,6,8,10],
    pointSourcegValues:[0.998,0.988,0.997,0.996,0.998,1,1.003,1.006,1.006,1.004,0.999,0.993,0.968,0.936], //point source and line source g values are itentical here because I can't find point source g values
    pointSourcegMeasurementPoints: [0,0.2,0.25,0.5,0.75,1,0.5,3,4,5,6,8,10],
    FValues: [
        [0.695,0.695,0.666,0.636,0.630,0.608,0.615,0.634,0.625,0.629,0.648,0.654,0.660,0.683,0.702,0.716,0.758,0.789],
        [0.711,0.711,0.677,0.643,0.632,0.609,0.614,0.632,0.626,0.633,0.656,0.667,0.676,0.698,0.716,0.727,0.762,0.786],
        [0.715,0.715,0.684,0.653,0.640,0.620,0.624,0.638,0.634,0.641,0.661,0.671,0.679,0.697,0.717,0.730,0.764,0.794],
        [0.708,0.708,0.684,0.660,0.650,0.634,0.637,0.647,0.646,0.653,0.671,0.682,0.691,0.705,0.726,0.739,0.771,0.798],
        [0.736,0.736,0.701,0.666,0.654,0.645,0.652,0.662,0.663,0.668,0.680,0.690,0.697,0.711,0.736,0.750,0.779,0.805],
        [0.728,0.728,0.706,0.684,0.673,0.664,0.668,0.674,0.676,0.682,0.693,0.704,0.712,0.724,0.748,0.762,0.788,0.811],
        [0.722,0.722,0.709,0.696,0.688,0.681,0.683,0.686,0.691,0.697,0.707,0.718,0.725,0.734,0.757,0.770,0.795,0.817],
        [0.736,0.736,0.720,0.705,0.697,0.692,0.697,0.700,0.707,0.712,0.719,0.729,0.736,0.745,0.769,0.780,0.802,0.823],
        [0.732,0.732,0.726,0.720,0.715,0.712,0.713,0.713,0.719,0.724,0.731,0.743,0.751,0.758,0.779,0.789,0.810,0.830],
        [0.744,0.744,0.738,0.733,0.729,0.726,0.728,0.727,0.734,0.738,0.743,0.754,0.762,0.769,0.790,0.799,0.818,0.837],
        [0.762,0.762,0.753,0.743,0.738,0.738,0.741,0.740,0.748,0.752,0.755,0.765,0.772,0.778,0.799,0.808,0.826,0.844],
        [0.837,0.837,0.820,0.803,0.801,0.802,0.804,0.802,0.809,0.811,0.813,0.821,0.828,0.829,0.844,0.848,0.863,0.873],
        [0.962,0.962,0.866,0.855,0.854,0.852,0.853,0.852,0.858,0.858,0.862,0.865,0.870,0.869,0.878,0.880,0.893,0.900],
        [0.968,0.968,0.923,0.917,0.916,0.912,0.913,0.912,0.918,0.918,0.918,0.921,0.923,0.923,0.927,0.930,0.933,0.939],
        [0.979,0.979,0.956,0.951,0.952,0.948,0.949,0.946,0.950,0.951,0.950,0.953,0.955,0.954,0.958,0.958,0.959,0.963],
        [0.987,0.987,0.977,0.973,0.973,0.971,0.972,0.971,0.972,0.973,0.973,0.974,0.975,0.974,0.977,0.976,0.978,0.978],
        [0.993,0.993,0.987,0.984,0.985,0.985,0.987,0.985,0.987,0.988,0.989,0.989,0.988,0.988,0.989,0.988,0.988,0.988],
        [0.994,0.994,0.995,0.994,0.994,0.995,0.996,0.993,0.996,0.996,0.996,0.996,0.996,0.996,0.996,0.995,0.995,0.996],
        [0.998,0.998,0.999,0.999,0.998,0.999,1.000,0.998,1.000,1.000,1.000,1.000,1.000,1.000,0.999,0.999,0.999,0.999],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1.000,1.000,0.999,0.999,0.999,0.999,0.998,0.998,0.998,0.998,0.999,0.999,0.999,0.999,1.000,0.999,1.000,0.999],
        [0.998,0.998,0.996,0.994,0.995,0.995,0.995,0.993,0.995,0.994,0.995,0.995,0.995,0.995,0.995,0.994,0.995,0.995],
        [0.998,0.998,0.990,0.985,0.984,0.985,0.986,0.984,0.987,0.987,0.987,0.987,0.988,0.989,0.988,0.987,0.989,0.989],
        [0.994,0.994,0.976,0.973,0.971,0.972,0.972,0.970,0.972,0.973,0.974,0.974,0.974,0.975,0.976,0.977,0.977,0.979],
        [0.991,0.991,0.958,0.950,0.947,0.948,0.947,0.947,0.949,0.950,0.952,0.953,0.954,0.953,0.956,0.958,0.959,0.962],
        [0.973,0.973,0.923,0.914,0.914,0.914,0.914,0.912,0.915,0.916,0.917,0.919,0.921,0.920,0.925,0.927,0.931,0.935],
        [0.966,0.966,0.873,0.851,0.850,0.847,0.850,0.848,0.853,0.856,0.857,0.863,0.867,0.870,0.876,0.878,0.889,0.895],
        [0.828,0.828,0.814,0.801,0.798,0.796,0.798,0.801,0.802,0.806,0.809,0.818,0.822,0.829,0.838,0.843,0.860,0.870],
        [0.789,0.789,0.756,0.723,0.720,0.725,0.725,0.729,0.730,0.734,0.743,0.754,0.761,0.771,0.784,0.795,0.819,0.831],
        [0.730,0.730,0.715,0.700,0.699,0.706,0.706,0.710,0.712,0.716,0.725,0.735,0.744,0.755,0.768,0.782,0.809,0.822],
        [0.722,0.722,0.699,0.676,0.679,0.686,0.686,0.689,0.692,0.696,0.705,0.716,0.725,0.738,0.752,0.768,0.798,0.811],
        [0.627,0.627,0.635,0.642,0.649,0.664,0.663,0.666,0.671,0.675,0.684,0.695,0.705,0.719,0.735,0.752,0.785,0.799],
        [0.574,0.574,0.596,0.618,0.640,0.643,0.641,0.643,0.650,0.653,0.662,0.672,0.684,0.698,0.715,0.733,0.769,0.784],
        [0.627,0.627,0.623,0.619,0.615,0.611,0.615,0.616,0.625,0.627,0.636,0.646,0.659,0.674,0.692,0.713,0.752,0.769],
        [0.710,0.710,0.674,0.638,0.602,0.566,0.568,0.585,0.597,0.598,0.608,0.618,0.632,0.645,0.666,0.688,0.731,0.750],
        [0.687,0.687,0.658,0.630,0.601,0.572,0.536,0.500,0.565,0.564,0.575,0.584,0.600,0.610,0.634,0.659,0.706,0.729],
        [0.450,0.450,0.459,0.467,0.476,0.485,0.496,0.507,0.518,0.529,0.521,0.533,0.553,0.560,0.591,0.620,0.672,0.702],
        [0.329,0.329,0.340,0.350,0.361,0.371,0.384,0.397,0.410,0.423,0.449,0.475,0.501,0.527,0.548,0.572,0.621,0.659],
        [0.417,0.417,0.421,0.426,0.430,0.434,0.440,0.445,0.451,0.456,0.467,0.478,0.489,0.501,0.523,0.545,0.589,0.633]
    ],
    FDistanceMeasured: [0,0.2,0.4,0.6,0.8,1,1.25,1.5,1.75,2,2.5,3,3.5,4,5,6,8,10], // measured in cm
    FAngleMeasured: [0, 0.017453292519943295, 0.03490658503988659, 0.05235987755982988, 0.06981317007977318, 0.08726646259971647, 0.10471975511965977, 0.12217304763960307, 0.13962634015954636, 0.15707963267948966, 0.17453292519943295, 0.2617993877991494, 0.3490658503988659, 0.5235987755982988, 0.6981317007977318, 0.8726646259971648, 1.0471975511965976, 1.2217304763960306, 1.3962634015954636, 1.5707963267948966, 1.7453292519943295, 1.9198621771937625, 2.0943951023931953, 2.2689280275926285, 2.443460952792061, 2.6179938779914944, 2.792526803190927, 2.8797932657906435, 2.96705972839036, 2.9845130209103035, 3.001966313430247, 3.01941960595019, 3.036872898470133, 3.0543261909900767, 3.07177948351002, 3.089232776029963, 3.1066860685499065, 3.12413936106985, 3.141592653589793], // measured in radians
    maxAngle: 180,
}
const BEBIG_GK60M21 = {
    name: "BEBIG GK60M21",
    doseRateConstant: 1.089, // in cGy/h/U
    sourceLength: 0.35, // measured in cm
    sourceDiameter: 0.06, //cm
    halfLife: 46196.82, // measured in in hours
    isotope: "60-Co",
    pointSource: false,
    HDRsource: true,
    gValues: [0.83, 0.83, 0.961, 1.037, 1.072, 1.077, 1.066, 1.05, 1.037, 1.028, 1.019, 1.018, 1.011, 1, 0.992, 0.984, 0.968, 0.952, 0.935, 0.919, 0.884, 0.849],
    gMeasurementPoints: [0, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.65, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 8, 10],
    pointSourcegValues:[0.83, 0.83, 0.961, 1.037, 1.072, 1.077, 1.066, 1.05, 1.037, 1.028, 1.019, 1.018, 1.011, 1, 0.992, 0.984, 0.968, 0.952, 0.935, 0.919, 0.884, 0.849], //point source and line source g values are itentical here because I can't find point source g values
    pointSourcegMeasurementPoints: [0, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.65, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 8, 10],
    FValues: [
        [0.894, 0.894, 0.923, 0.951, 0.931, 0.931, 0.934, 0.932, 0.928, 0.926, 0.927, 0.939, 0.936, 0.941,],
        [0.898, 0.898, 0.925, 0.953, 0.934, 0.933, 0.934, 0.935, 0.934, 0.933, 0.934, 0.940, 0.940, 0.943,],
        [0.895, 0.895, 0.924, 0.952, 0.937, 0.937, 0.937, 0.939, 0.940, 0.942, 0.943, 0.945, 0.945, 0.947,],
        [0.898, 0.898, 0.925, 0.953, 0.938, 0.939, 0.939, 0.939, 0.940, 0.942, 0.945, 0.946, 0.947, 0.949,],
        [0.898, 0.898, 0.926, 0.954, 0.938, 0.938, 0.938, 0.938, 0.940, 0.942, 0.944, 0.946, 0.947, 0.949,],
        [0.898, 0.898, 0.927, 0.956, 0.941, 0.940, 0.939, 0.941, 0.942, 0.944, 0.945, 0.946, 0.947, 0.949,],
        [0.899, 0.899, 0.929, 0.958, 0.943, 0.943, 0.942, 0.944, 0.944, 0.946, 0.947, 0.948, 0.949, 0.952,],
        [0.909, 0.909, 0.934, 0.959, 0.946, 0.947, 0.948, 0.949, 0.951, 0.951, 0.952, 0.953, 0.954, 0.958,],
        [0.914, 0.914, 0.938, 0.962, 0.951, 0.952, 0.953, 0.954, 0.955, 0.957, 0.957, 0.959, 0.959, 0.961,],
        [0.930, 0.930, 0.950, 0.969, 0.967, 0.968, 0.967, 0.969, 0.969, 0.969, 0.969, 0.970, 0.971, 0.971,],
        [0.671, 0.671, 0.966, 0.983, 0.977, 0.978, 0.978, 0.979, 0.979, 0.980, 0.979, 0.980, 0.981, 0.980,],
        [0.719, 0.719, 0.983, 0.984, 0.984, 0.984, 0.984, 0.985, 0.985, 0.984, 0.985, 0.985, 0.985, 0.986,],
        [0.769, 0.769, 0.989, 0.992, 0.988, 0.989, 0.989, 0.989, 0.989, 0.989, 0.989, 0.989, 0.989, 0.989,],
        [0.862, 0.862, 0.997, 0.995, 0.993, 0.995, 0.994, 0.994, 0.994, 0.994, 0.994, 0.994, 0.994, 0.994,],
        [0.918, 0.918, 1.000, 1.000, 0.997, 0.997, 0.997, 0.998, 0.998, 0.997, 0.997, 0.997, 0.997, 0.997,],
        [0.957, 0.957, 0.999, 1.001, 0.998, 0.998, 0.997, 0.998, 0.998, 0.998, 0.998, 0.998, 0.998, 0.998,],
        [0.974, 0.974, 0.999, 1.001, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999,],
        [0.990, 0.990, 0.995, 0.999, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000,],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0.990, 0.990, 0.994, 0.999, 1.000, 0.999, 1.000, 0.999, 0.999, 1.000, 0.999, 1.000, 0.999, 0.999,],
        [0.975, 0.975, 0.997, 1.001, 0.999, 0.999, 1.000, 1.000, 1.000, 0.999, 0.999, 0.999, 0.999, 0.999,],
        [0.956, 0.956, 0.999, 1.000, 0.999, 0.998, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999, 0.999,],
        [0.918, 0.918, 1.001, 0.999, 0.996, 0.997, 0.997, 0.997, 0.997, 0.997, 0.997, 0.996, 0.996, 0.997,],
        [0.862, 0.862, 0.994, 0.995, 0.995, 0.995, 0.995, 0.996, 0.995, 0.996, 0.995, 0.995, 0.995, 0.995,],
        [0.773, 0.773, 0.983, 0.996, 0.991, 0.991, 0.991, 0.990, 0.991, 0.990, 0.990, 0.990, 0.990, 0.990,],
        [0.724, 0.724, 0.971, 0.984, 0.985, 0.985, 0.985, 0.985, 0.986, 0.986, 0.986, 0.986, 0.986, 0.986,],
        [0.678, 0.678, 0.943, 0.976, 0.980, 0.979, 0.978, 0.978, 0.978, 0.979, 0.978, 0.978, 0.979, 0.978,],
        [0.843, 0.843, 0.897, 0.951, 0.967, 0.967, 0.966, 0.966, 0.967, 0.967, 0.967, 0.968, 0.968, 0.968,],
        [0.763, 0.763, 0.832, 0.902, 0.939, 0.938, 0.938, 0.937, 0.938, 0.939, 0.940, 0.940, 0.942, 0.944,],
        [0.770, 0.770, 0.819, 0.869, 0.918, 0.917, 0.917, 0.919, 0.920, 0.921, 0.923, 0.924, 0.926, 0.929,],
        [0.737, 0.737, 0.786, 0.835, 0.885, 0.885, 0.884, 0.885, 0.887, 0.890, 0.892, 0.896, 0.898, 0.901,],
        [0.857, 0.857, 0.857, 0.857, 0.857, 0.857, 0.858, 0.861, 0.864, 0.868, 0.871, 0.875, 0.878, 0.883,],
        [0.813, 0.813, 0.813, 0.813, 0.814, 0.814, 0.816, 0.821, 0.827, 0.833, 0.838, 0.842, 0.846, 0.855,],
        [0.791, 0.791, 0.783, 0.775, 0.767, 0.750, 0.755, 0.762, 0.771, 0.779, 0.787, 0.794, 0.799, 0.812,],
        [0.861, 0.861, 0.823, 0.785, 0.747, 0.671, 0.650, 0.658, 0.672, 0.687, 0.698, 0.709, 0.719, 0.741,],
        [0.913, 0.913, 0.856, 0.799, 0.742, 0.629, 0.560, 0.549, 0.568, 0.585, 0.602, 0.616, 0.631, 0.659,],
        [0.833, 0.833, 0.819, 0.792, 0.737, 0.627, 0.540, 0.511, 0.530, 0.546, 0.564, 0.580, 0.596, 0.623,]
    ],
    FDistanceMeasured: [0, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 7, 8, 10], // measured in cm
    FAngleMeasured: [0, 0.017453292519943295, 0.03490658503988659, 0.05235987755982988, 0.06981317007977318, 0.08726646259971647, 0.10471975511965977, 0.13962634015954636, 0.17453292519943295, 0.2617993877991494, 0.3490658503988659, 0.4363323129985824, 0.5235987755982988, 0.6981317007977318, 0.8726646259971648, 1.0471975511965976, 1.2217304763960306, 1.3962634015954636, 1.5707963267948966, 1.7453292519943295, 1.9198621771937625, 2.0943951023931953, 2.2689280275926285, 2.443460952792061, 2.6179938779914944, 2.705260340591211, 2.792526803190927, 2.8797932657906435, 2.96705972839036, 3.001966313430247, 3.036872898470133, 3.0543261909900767, 3.07177948351002, 3.089232776029963, 3.1066860685499065, 3.12413936106985, 3.141592653589793], // measured in radians
    maxAngle: 180,
}
const ElektaFlexisource = {
    name: "Elekta Flexisource",
    doseRateConstant: 1.113, // in cGy/h/U
    sourceLength: 0.35, // measured in cm
    sourceDiameter: 0.06, // cm
    halfLife: 1771.92, // measured in in hours
    isotope: "192-Ir",
    pointSource: false,
    HDRsource: true,
    gValues: [0.991,0.991,0.997,0.998,1.000,1.002,1.004,1.005,1.003,0.999,0.991,0.968,0.935],
    gMeasurementPoints: [0,0.25,0.50,0.75,1.00,1.50,2.00,3.00,4.00,5.00,6.00,8.00,10.00],
    pointSourcegValues:[0.991,0.991,0.997,0.998,1.000,1.002,1.004,1.005,1.003,0.999,0.991,0.968,0.935],
    pointSourcegMeasurementPoints: [0,0.25,0.50,0.75,1.00,1.50,2.00,3.00,4.00,5.00,6.00,8.00,10.00],
    FValues: [
        [0.672,0.672,0.654,0.617,0.626,0.647,0.672,0.695,0.738,0.774],
        [0.671,0.671,0.652,0.615,0.629,0.652,0.678,0.699,0.744,0.777],
        [0.669,0.669,0.651,0.615,0.638,0.664,0.688,0.711,0.751,0.783],
        [0.663,0.663,0.652,0.629,0.650,0.677,0.699,0.719,0.759,0.789],
        [0.671,0.671,0.665,0.653,0.676,0.698,0.719,0.737,0.775,0.802],
        [0.694,0.694,0.690,0.682,0.703,0.725,0.743,0.760,0.792,0.816],
        [0.735,0.735,0.731,0.725,0.744,0.763,0.780,0.794,0.821,0.841],
        [0.762,0.762,0.760,0.756,0.770,0.785,0.799,0.812,0.835,0.854],
        [0.803,0.803,0.799,0.791,0.804,0.817,0.829,0.839,0.857,0.873],
        [0.852,0.852,0.850,0.845,0.851,0.861,0.870,0.878,0.889,0.898],
        [0.892,0.892,0.887,0.878,0.886,0.893,0.899,0.904,0.912,0.920],
        [0.917,0.917,0.913,0.904,0.911,0.917,0.921,0.922,0.932,0.936],
        [0.936,0.936,0.933,0.928,0.932,0.936,0.941,0.943,0.949,0.953],
        [0.955,0.955,0.951,0.944,0.948,0.951,0.953,0.955,0.958,0.961],
        [0.964,0.964,0.962,0.957,0.960,0.964,0.967,0.968,0.967,0.970],
        [0.973,0.973,0.972,0.969,0.971,0.973,0.975,0.978,0.978,0.980],
        [0.986,0.986,0.979,0.975,0.979,0.981,0.983,0.983,0.983,0.986],
        [0.990,0.990,0.984,0.982,0.985,0.987,0.990,0.990,0.989,0.989],
        [0.993,0.993,0.989,0.988,0.990,0.993,0.994,0.994,0.995,0.993],
        [0.996,0.996,0.993,0.993,0.994,0.996,0.997,0.998,0.995,0.996],
        [0.997,0.997,0.995,0.997,0.996,0.998,0.999,0.999,0.999,0.999],
        [0.999,0.999,1.000,0.995,1.000,1.000,1.000,1.001,1.002,1.001],
        [1.000,1.000,1.000,0.998,0.999,0.999,1.001,1.001,1.001,1.001],
        [1.000,1.000,1.000,1.000,1.000,1.000,1.000,1.000,1.000,1.000],
        [1.000,1.000,0.999,0.995,0.999,1.001,1.003,1.003,1.000,1.002],
        [0.999,0.999,0.998,0.995,0.998,1.000,1.004,1.002,0.999,0.999],
        [0.998,0.998,0.996,0.993,0.996,0.997,0.999,1.001,1.000,1.002],
        [0.996,0.996,0.993,0.992,0.993,0.993,0.994,0.996,0.995,0.994],
        [0.994,0.994,0.991,0.986,0.989,0.991,0.995,0.995,0.992,0.994],
        [0.990,0.990,0.986,0.985,0.984,0.985,0.988,0.990,0.987,0.988],
        [0.985,0.985,0.979,0.977,0.979,0.982,0.984,0.983,0.983,0.985],
        [0.972,0.972,0.971,0.968,0.971,0.974,0.976,0.977,0.978,0.979],
        [0.963,0.963,0.962,0.959,0.961,0.965,0.967,0.967,0.966,0.970],
        [0.952,0.952,0.950,0.945,0.949,0.952,0.955,0.959,0.961,0.963],
        [0.937,0.937,0.935,0.932,0.933,0.938,0.942,0.943,0.946,0.951],
        [0.918,0.918,0.915,0.908,0.914,0.919,0.922,0.925,0.932,0.937],
        [0.891,0.891,0.888,0.881,0.887,0.895,0.900,0.905,0.913,0.919],
        [0.839,0.839,0.841,0.845,0.853,0.861,0.871,0.878,0.890,0.898],
        [0.783,0.783,0.787,0.793,0.806,0.819,0.831,0.840,0.857,0.874],
        [0.748,0.748,0.751,0.758,0.770,0.786,0.802,0.812,0.834,0.855],
        [0.711,0.711,0.715,0.724,0.741,0.760,0.776,0.791,0.818,0.838],
        [0.659,0.659,0.663,0.673,0.693,0.715,0.733,0.750,0.785,0.809],
        [0.614,0.614,0.620,0.631,0.652,0.678,0.701,0.720,0.760,0.791],
        [0.542,0.542,0.550,0.566,0.599,0.631,0.660,0.684,0.729,0.766],
        [0.474,0.474,0.487,0.512,0.564,0.599,0.632,0.659,0.712,0.751],
        [0.440,0.440,0.453,0.480,0.534,0.571,0.606,0.635,0.693,0.734],
        [0.442,0.442,0.452,0.473,0.514,0.555,0.591,0.625,0.680,0.722]
    ],
    FDistanceMeasured: [0,0.25,0.50,1.00,2.00,3.00,4.00,5.00,7.50,10.00], // measured in cm
    FAngleMeasured: [0, 0.017453292519943295, 0.03490658503988659, 0.05235987755982988, 0.08726646259971647, 0.12217304763960307, 0.17453292519943295, 0.20943951023931953, 0.2617993877991494, 0.3490658503988659, 0.4363323129985824, 0.5235987755982988, 0.6108652381980153, 0.6981317007977318, 0.7853981633974483, 0.8726646259971648, 0.9599310885968813, 1.0471975511965976, 1.1344640137963142, 1.2217304763960306, 1.3089969389957472, 1.3962634015954636, 1.48352986419518, 1.5707963267948966, 1.6580627893946132, 1.7453292519943295, 1.8325957145940461, 1.9198621771937625, 2.007128639793479, 2.0943951023931953, 2.1816615649929116, 2.2689280275926285, 2.356194490192345, 2.443460952792061, 2.530727415391778, 2.6179938779914944, 2.705260340591211, 2.792526803190927, 2.8797932657906435, 2.9321531433504737, 2.96705972839036, 3.01941960595019, 3.0543261909900767, 3.089232776029963, 3.1066860685499065, 3.12413936106985, 3.141592653589793], // measured in radians
    maxAngle: 180,
}

class Seed {
    constructor (pos, rot, model, airKerma, dwellTime){
        this.model = model;
        this.pos = pos; // measured in cm
        this.rot = rot; // measured in radians
        this.airKerma = airKerma; // measured in U
        this.dwellTime = dwellTime; // Measured in hours
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
        let doseRate = this.airKerma * this.model.doseRateConstant * (this.geometryFactor(pos)/this.geometryFactor({r: this.geometryRef.r, theta: this.geometryRef.theta, x:this.geometryRef.x + this.pos.x, y:this.geometryRef.y + this.pos.y, z: this.geometryRef.z})) * this.g(pos.r) * this.F(pos);
        return doseRate * 1.44 * this.model.halfLife * (this.model.HDRsource ? (1 - Math.exp(-this.dwellTime / (1.44 * this.model.halfLife))) : 1) / 100; // this is divided by 100 to convert to Gy
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
class Graph {
    constructor({x, y, width, height, seeds, xTicks, yTicks, perspective}){
        this.x = x;
        this.y = y;
        this.zSlice = 0; //#*?
        this.width = width;
        this.height = height;
        this.seeds = seeds;
        this.xTicks = xTicks;
        this.yTicks = yTicks;
        this.perspective = perspective; //maps coordinates on the graph to coordinates in space (allows to adjust perspective)
    }
    getPointDose(pos){
        return this.seeds.reduce((z,seed) => {
            let relativePos = {
                x: (pos.x - seed.pos.x),
                y: (pos.y - seed.pos.y),
                z: (pos.z - seed.pos.z)
            };
            let dot = (relativePos.x * seed.directionVec.x + relativePos.y * seed.directionVec.y + relativePos.z * seed.directionVec.z) / magnitude(relativePos);
            dot = Math.min(Math.max(dot,-1),1); // this clamps the dot product between -1 and 1 to reduce floating point error
            return z + seed.calculateDose({
                x: pos.x,
                y: pos.y,
                z: pos.z,
                r: magnitude(relativePos),
                theta: Math.acos(dot)
            });
        },0)
    }
    getIsodose(refPoint){
        let isodose = [];
        let refDose = this.getPointDose(this.perspective({x: refPoint.x, y: refPoint.y, z: this.zSlice}));
        refDose = ((refDose == 0) ? 1 : refDose);
        for (let i = 0; i < this.yTicks.length; i++){
            let slice = [];
            for (let j = 0; j < this.xTicks.length; j++){
                slice.push(100 * this.getPointDose(this.perspective({x: this.xTicks[j], y: this.yTicks[i], z: this.zSlice})) / refDose);
            }
            isodose.push(slice);
        }
        return isodose;
    }
    drawGraph(div,refPoint){
        let data = [];
        for (let i = 1; i < 128; i *= 2){
            data.push(
                {
                    z: this.getIsodose(refPoint),
                    x: this.xTicks,
                    y: this.yTicks,
                    type: 'contour',
                    colorscale: "Jet",
                    contours: {
                        type: 'constraint',
                        operation: '=',
                        value: 100 * i / 8,
                        coloring: "lines",
                        showlabels: true,
                        labelfont: {
                            family: "Raleway",
                            size: 12,
                            color: "black"
                        }
                    },
                    line:{
                        width: 2,
                        smoothing: 0.85
                    },
                    name: 100 * (i / 8) + "%",
                },
            );
        };
        div.style.width = this.width + "px";
        div.style.height = this.height + "px";
        div.style.left = this.x + "px";
        div.style.top = this.y + "px";
        Plotly.newPlot(div.id, data); //does not update after window rescaling
        return div.children[0].children[0].children[0].children[4].children[0].children[3].getBoundingClientRect();
    }
}
class Button {
    constructor({x:x, y:y, width:width, height:height, label:{text:label, font:font, color: color}, bgColor:bgColor, onClick:onClick, outline:{color:outlineColor, thickness:outlineThickness}}){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.label = label;
        this.font = font;
        this.bgColor = bgColor;
        this.fontColor = color;
        this.onClick = onClick;
        this.outlineColor = outlineColor;
        this.outlineThickness = outlineThickness;
    }
    draw(){
        if (this.font === "default"){
            ctx.font = (getFontSize(this.width,this.height,this.label,(size) => `${size}px monospace`) * 0.8) + "px monospace";
        }else{
            ctx.font = this.font;
        }
        let textDimensions = ctx.measureText(this.label);
        let textHeight = textDimensions.actualBoundingBoxAscent + textDimensions.actualBoundingBoxDescent;
        if (this.outlineThickness > 0){
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = this.outlineThickness;
            ctx.beginPath();
            ctx.rect(this.x,this.y,this.width,this.height);
            ctx.stroke();
        }
        ctx.fillStyle = this.bgColor;
        ctx.beginPath();
        ctx.fillRect(this.x,this.y,this.width,this.height);
        ctx.fillStyle = this.fontColor;
        ctx.fillText(this.label, this.x + (this.width - textDimensions.width) / 2, this.y + textDimensions.actualBoundingBoxAscent + (this.height - textHeight) / 2);
    }
    checkClicked(){
        if (mouse.down && this.hovering()){
            this.onClick();
            return true;
        }
        return false;
    }
    hovering(){
        return ((mouse.x >= this.x) && (mouse.x <= this.x + this.width) && (mouse.y >= this.y) && (mouse.y <= this.y + this.height));
    }
}
class Dropdown {
    constructor(button, options){
        this.button = button;
        this.button.onClick = () => {
            this.showing = !this.showing;
        }
        this.options = options;
        this.showing = false;
    }
    drawDropdown(){
        if (this.showing){
            this.button.draw();
            this.options.forEach((opt) => {
                if (opt.options){
                    opt.drawDropdown();
                }else{
                    opt.draw();
                }
            });
        }else{
            this.button.draw();
        }
    }
    checkDropdownClicked(){
        this.button.checkClicked();
        if (this.showing){
            this.options.forEach((button,ind) => {
                if (button.options){
                    if (button.checkDropdownClicked()){ // if the element selected is another dropdown, this closes any other dropdowns that are open
                        this.options.forEach((neighborDropdown,ind2) => {
                            if (neighborDropdown.showing && (ind != ind2)){
                                neighborDropdown.collapseDropdown();
                            }
                        });
                    }
                }else{
                    if (button.checkClicked()){ //this checks if any of the children buttons are clicked
                        this.showing = false;
                    }
                }
            });
        }else{
            this.collapseDropdown();
        }
        return this.showing;
    }
    collapseDropdown(){
        this.showing = false;
        this.options.forEach((option) => {
            if (option.showing){
                option.collapseDropdown();
            }
        });
    }
}
class Slider{
    constructor(x,y,length,angle,color,thickness,initalValue){
        this.x = x;
        this.y = y;
        this.length = length;
        this.angle = angle;
        this.color = color;
        this.thickness = thickness;
        this.value = initalValue;
        this.selected = false;
    }
    draw(){
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.thickness;
        ctx.beginPath();
        ctx.moveTo(this.x,this.y);
        ctx.lineTo(this.x + this.length * Math.cos(this.angle),this.y + this.length * Math.sin(this.angle));
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(
            this.x + this.value * this.length * Math.cos(this.angle),
            this.y + this.value * this.length * Math.sin(this.angle), this.thickness, 0, 2 * Math.PI
        );
        ctx.fill();
    }
    checkClicked(){
        if (this.selected){
            let unclampedVal = ((mouse.x - this.x) * Math.cos(this.angle) + (mouse.y - this.y) * Math.sin(this.angle)) / this.length; // this projects the mouse position onto the slider's direction vector, gets the magnitude, and divides by the slider angle to get the new value
            this.value = Math.max(Math.min(unclampedVal, 1), 0); //clamps value between 0 and 1
        }
        if ((mouse.down && (((mouse.x - (this.x + Math.cos(this.angle) * this.length * this.value)) ** 2 + (mouse.y - (this.y + Math.sin(this.angle) * this.length * this.value)) ** 2) <= (this.thickness ** 2)))){
            this.selected = true;
        }
        if (!mouse.down){
            this.selected = false;
        }
    }
}
class NumberInput {
    constructor({x:x, y:y, width:width, height:height, label:{text:text, color: color}, bgColor:bgColor, getValue: getValue, onEnter: onEnter, numDecimalsEditing: numDecimalsEditing}){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.bgColor = bgColor;
        this.editing = false;
        this.numDecimalsEditing = numDecimalsEditing;
        this.value = () => (this.editing ? ((this.editingValue.length > 0) ? this.editingValue : "0") : getValue().toFixed(this.numDecimalsEditing).toString());
        this.label = () => text(this.value());
        this.editingValue = this.value();
        this.onEnter = onEnter;
        this.recalcFont();
    }
    draw(){
        this.recalcFont();
        ctx.fillStyle = this.bgColor[(this.editing ? "selected" : "notSelected")];
        ctx.beginPath();
        ctx.fillRect(this.x,this.y,this.width,this.height);
        ctx.font = this.font;
        ctx.fillStyle = this.color[(this.editing ? "selected" : "notSelected")];
        let textDimensions = ctx.measureText(this.label());
        let textHeight = textDimensions.actualBoundingBoxAscent + textDimensions.actualBoundingBoxDescent;
        ctx.beginPath();
        ctx.fillText(this.label(), this.x + (this.width - textDimensions.width) / 2, this.y + textDimensions.actualBoundingBoxAscent + (this.height - textHeight) / 2);
    }
    checkClicked(){
        if (mouse.down && this.hovering()){
            this.editingValue = this.value();
            this.editing = true;
        }else{
            if (this.editing){
                this.onEnter(parseFloat(this.editingValue));
                this.editing = false;
            }
        }
        return this.editing;
    }
    checkEntry(key){
        if (this.editing){
            if ("1234567890.".includes(key) && (this.editingValue.includes(".") ? ((this.editingValue.length - this.editingValue.indexOf(".") - 1) < this.numDecimalsEditing) : true)){
                this.editingValue += key;
            }
            if (key === "Enter"){
                this.onEnter(parseFloat(this.editingValue));
                this.editing = false;
            }
            if ((key === "Backspace") && (this.editingValue.length > 0)){
                this.editingValue = this.editingValue.substring(0,this.editingValue.length - 1);
            }
        }
    }
    recalcFont(){
        this.font = getFontSize(this.width * 0.8,this.height * 0.6,this.label(),(size) => `${size}px monospace`) + "px monospace";
    }
    hovering(){
        return ((mouse.x >= this.x) && (mouse.x <= this.x + this.width) && (mouse.y >= this.y) && (mouse.y <= this.y + this.height));
    }
}
initModule(module);
setInterval(tick,50);

function tick(){
    if ((canvas.width != window.innerWidth) || (canvas.height != window.innerHeight)){
        adjustFormatting();
        render = true;
        resetGraphs = true;
        tick();
        return;
    }else{
        if (render){
            if (module === "brachytherapy applicators"){
                if (resetGraphs){
                    adjustApplicatorGraphFormat(moduleData.graph1,moduleData.applicatorModel,{refPoint: "graph1refPoint", drawFunction: "graph1DrawApplicator", boundingBox: moduleData.divBoundGraph1, view: ((moduleData.applicatorModel.name === "Tandem/Ring") ? "side" : "front")});
                    if (!(moduleData.applicatorModel.name === "Vaginal Cylinder")){
                        adjustApplicatorGraphFormat(moduleData.graph2,moduleData.applicatorModel,{refPoint: "graph2refPoint", drawFunction: "graph2DrawApplicator", boundingBox: moduleData.divBoundGraph2, view: ((moduleData.applicatorModel.name === "Tandem/Ring") ? "top" : "side")});
                    }
                    if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
                        adjustApplicatorGraphFormat(moduleData.graph3,moduleData.applicatorModel,{refPoint: "graph3refPoint", drawFunction: "graph3DrawApplicator", boundingBox: moduleData.divBoundGraph3, view: "top"});
                    }
                    resetGraphs = false;
                }
                adjustFormatting();
                moduleData.divBoundGraph1 = moduleData.graph1.drawGraph(document.getElementById("graph1"),moduleData.graph1refPoint);
                if (!(moduleData.applicatorModel.name === "Vaginal Cylinder")){
                    moduleData.divBoundGraph2 = moduleData.graph2.drawGraph(document.getElementById("graph2"),moduleData.graph2refPoint);
                }
                if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
                    moduleData.divBoundGraph3 = moduleData.graph3.drawGraph(document.getElementById("graph3"),moduleData.graph3refPoint);
                }
            }else{
                adjustFormatting();
                if (moduleData.divBoundGraph1){
                    moduleData.divBoundGraph1 = moduleData.graph1.drawGraph(document.getElementById("graph1"),moduleData.graph1refPoint);
                }
                if (moduleData.divBoundGraph2){
                    moduleData.divBoundGraph2 = moduleData.graph2.drawGraph(document.getElementById("graph2"),moduleData.graph2refPoint);
                }
            }
            render = false;
        }
    }

    if (module === "single seed"){
        ctx.clearRect(0,0,canvas.width,canvas.height);

        //update graph1 seed air kerma based on slider values
        moduleData.graph1AirKermaSlider.checkClicked();
        moduleData.graph1AirKermaSlider.draw();
        if (moduleData.graph1.seeds[0].airKerma != getAirKermaFromSlider(moduleData.graph1AirKermaSlider,moduleData.graph1.seeds[0])){
            moduleData.graph1.seeds[0].airKerma = getAirKermaFromSlider(moduleData.graph1AirKermaSlider,moduleData.graph1.seeds[0]);
            render = true;
        }
        moduleData.graph2AirKermaSlider.checkClicked();
        moduleData.graph2AirKermaSlider.draw();
        if (moduleData.graph2.seeds[0].airKerma != getAirKermaFromSlider(moduleData.graph2AirKermaSlider,moduleData.graph2.seeds[0])){
            moduleData.graph2.seeds[0].airKerma = getAirKermaFromSlider(moduleData.graph2AirKermaSlider,moduleData.graph2.seeds[0]);
            render = true;
        }

        //Draw AirKerma slider text
        moduleData.graph1AirKermaLabel.draw();
        moduleData.graph2AirKermaLabel.draw();

        // draw and update graph1 dwell time
        if (moduleData.graph1.seeds[0].model.HDRsource){
            moduleData.graph1DwellTimeSlider.checkClicked();
            moduleData.graph1DwellTimeSlider.draw();
            if (moduleData.graph1.seeds[0].dwellTime != getDwellTimeFromSlider(moduleData.graph1DwellTimeSlider)){
                moduleData.graph1.seeds[0].dwellTime = getDwellTimeFromSlider(moduleData.graph1DwellTimeSlider);
                render = true;
            }
            moduleData.graph1DwellTimeLabel.draw();
        }
        // draw and update graph2 dwell time
        if (moduleData.graph2.seeds[0].model.HDRsource){
            moduleData.graph2DwellTimeSlider.checkClicked();
            moduleData.graph2DwellTimeSlider.draw();
            if (moduleData.graph2.seeds[0].dwellTime != getDwellTimeFromSlider(moduleData.graph2DwellTimeSlider)){
                moduleData.graph2.seeds[0].dwellTime = getDwellTimeFromSlider(moduleData.graph2DwellTimeSlider);
                render = true;
            }
            moduleData.graph2DwellTimeLabel.draw();
        }

        //draw dropdowns
        moduleData.graph1ModelDropdown.drawDropdown();
        moduleData.graph2ModelDropdown.drawDropdown();

        drawSeed(moduleData.graph1.seeds[0],moduleData.graph1,moduleData.divBoundGraph1);
        drawSeed(moduleData.graph2.seeds[0],moduleData.graph2,moduleData.divBoundGraph2);
    }
    if (module === "string of seeds"){
        ctx.clearRect(0,0,canvas.width,canvas.height);

        // update and draw spacing slider + update add seed button
        moduleData.seedSpacingSlider.checkClicked();
        if (moduleData.seedSpacing != (moduleData.seedSpacingSlider.value + 0.5)){
            moduleData.seedSpacing = (moduleData.seedSpacingSlider.value + 0.5);
            adjustFormatting();
            render = true;
        }
        //draw delete seed button
        if (moduleData.selectedSeed != -1){
            moduleData.airKermaSlider.checkClicked();
            let airKerma = getAirKermaFromSlider(moduleData.airKermaSlider,moduleData.graph1.seeds[moduleData.selectedSeed])
            if (moduleData.graph1.seeds[moduleData.selectedSeed].airKerma != airKerma){
                moduleData.graph1.seeds[moduleData.selectedSeed].airKerma = airKerma;
                render = true;
            }
            moduleData.airKermaLabel.draw();
            moduleData.deleteSeed.draw();
            moduleData.airKermaSlider.draw();

            if (moduleData.graph1.seeds[moduleData.selectedSeed].model.HDRsource){
                moduleData.dwellTimeSlider.checkClicked();
                let dwellTime = getDwellTimeFromSlider(moduleData.dwellTimeSlider);
                if (moduleData.graph1.seeds[moduleData.selectedSeed].dwellTime != dwellTime){
                    moduleData.graph1.seeds[moduleData.selectedSeed].dwellTime = dwellTime;
                    render = true;
                }
                moduleData.dwellTimeLabel.draw();
                moduleData.dwellTimeSlider.draw();
            }
        }
        moduleData.addSeed.draw();
        moduleData.seedSpacingSlider.draw();

        //draw "Source Spacing" text
        moduleData.seedSpacingLabel.draw();

        // draw model dropdown graph1
        moduleData.graph1ModelDropdown.drawDropdown();

        //format and draw reference point
        let refPointLabel = moduleData.refPointLabel;
        let refPos = graphToScreenPos(moduleData.graph1refPoint,moduleData.graph1,moduleData.divBoundGraph1);

        refPointLabel.x = refPos.x + Math.min(moduleData.divBoundGraph1.width,moduleData.divBoundGraph1.height) * 0.02;
        refPointLabel.y = refPos.y;
        refPointLabel.width = Math.min(moduleData.divBoundGraph1.width,moduleData.divBoundGraph1.height) * 0.15;
        refPointLabel.height = Math.min(moduleData.divBoundGraph1.width,moduleData.divBoundGraph1.height) * 0.075;

        moduleData.refPointLabel.draw();
    }
    if (module === "planar array of seeds"){
        ctx.clearRect(0,0,canvas.width,canvas.height);

        // seed spacing slider graph 1
        moduleData.graph1SeedSpacingSlider.checkClicked();
        if (moduleData.graph1SeedSpacing != 0.5 + moduleData.graph1SeedSpacingSlider.value){
            moduleData.graph1SeedSpacing = 0.5 + moduleData.graph1SeedSpacingSlider.value;
            adjustFormatting();
            render = true;
            tick();
        }
        moduleData.graph1SeedSpacingSlider.draw();
        if (canvas.width > (canvas.height * 0.9)){
            let text = "Seed Spacing: " + moduleData.graph1SeedSpacing.toFixed(2) + "cm";
            ctx.font = getFontSize(moduleData.graph1AddSeeds.width * 0.8,moduleData.graph1AddSeeds.height,text,(size) => `${size}px monospace`) + "px monospace";
            ctx.fillText(
                text,
                moduleData.graph1ModelDropdown.button.width * 0.1,
                (moduleData.graph1RemoveSeeds.y + moduleData.graph1RemoveSeeds.height + moduleData.graph1SeedSpacingSlider.y) / 2
            );
        }else{
            let text = "Seed Spacing: " + moduleData.graph1SeedSpacing.toFixed(2) + "cm";
            ctx.font = getFontSize(moduleData.graph1AddSeeds.width * 0.8,moduleData.graph1AddSeeds.height,text,(size) => `${size}px monospace`) + "px monospace";
            ctx.fillText(
                text,
                moduleData.graph1ModelDropdown.button.width * 0.1,
                (moduleData.graph1RemoveSeeds.y + moduleData.graph1RemoveSeeds.height + moduleData.graph1SeedSpacingSlider.y) / 2
            );
        }
        // seed spacing slider graph 2
        moduleData.graph2SeedSpacingSlider.checkClicked();
        if (moduleData.graph2SeedSpacing != 0.5 + moduleData.graph2SeedSpacingSlider.value){
            moduleData.graph2SeedSpacing = 0.5 + moduleData.graph2SeedSpacingSlider.value;
            adjustFormatting();
            render = true;
            tick();
        }
        moduleData.graph2SeedSpacingSlider.draw();
        if (canvas.width > (canvas.height * 0.9)){
            let text = "Seed Spacing: " + moduleData.graph2SeedSpacing.toFixed(2) + "cm";
            ctx.font = getFontSize(moduleData.graph2ModelDropdown.button.width * 0.8,moduleData.graph2ModelDropdown.button.height,text,(size) => `${size}px monospace`) + "px monospace";
            ctx.fillText(
                text,
                moduleData.graph2ModelDropdown.button.x + moduleData.graph2ModelDropdown.button.width * 0.1,
                (moduleData.graph2RemoveSeeds.y + moduleData.graph2RemoveSeeds.height + moduleData.graph2SeedSpacingSlider.y) / 2
            );
        }else{
            let text = "Seed Spacing: " + moduleData.graph2SeedSpacing.toFixed(2) + "cm";
            ctx.font = getFontSize(moduleData.graph2ModelDropdown.button.width * 0.8,moduleData.graph2ModelDropdown.button.height,text,(size) => `${size}px monospace`) + "px monospace";
            ctx.fillText(
                text,
                moduleData.graph2ModelDropdown.button.x + moduleData.graph2ModelDropdown.button.width * 0.1,
                (moduleData.graph2RemoveSeeds.y + moduleData.graph2RemoveSeeds.height + moduleData.graph2SeedSpacingSlider.y) / 2
            );
        }

        moduleData.graph1AddSeeds.draw();
        moduleData.graph1RemoveSeeds.draw();
        moduleData.graph2AddSeeds.draw();
        moduleData.graph2RemoveSeeds.draw();

        //draw seed editing sliders graph1
        if ((moduleData.selectedGraph === "graph1") && (moduleData.selectedSeed != -1)){
            moduleData.graph1AirKermaSlider.checkClicked();
            moduleData.graph1AirKermaSlider.draw();
            if (moduleData.graph1.seeds[moduleData.selectedSeed].airKerma != getAirKermaFromSlider(moduleData.graph1AirKermaSlider,moduleData.graph1.seeds[moduleData.selectedSeed])){
                moduleData.graph1.seeds[moduleData.selectedSeed].airKerma = getAirKermaFromSlider(moduleData.graph1AirKermaSlider,moduleData.graph1.seeds[moduleData.selectedSeed]);
                render = true;
            }
            if (canvas.width > (canvas.height * 0.9)){
                let text = "Air Kerma: " + moduleData.graph1.seeds[moduleData.selectedSeed].airKerma.toFixed(2) + "U";
                ctx.font = getFontSize(moduleData.graph1AddSeeds.width * 0.8,moduleData.graph1AddSeeds.height,text,(size) => `${size}px monospace`) + "px monospace";
                ctx.fillText(
                    text,
                    moduleData.graph1ModelDropdown.button.width * 1.1,
                    canvas.height * 0.15
                );
            }else{
                let text = "Air Kerma: " + moduleData.graph1.seeds[moduleData.selectedSeed].airKerma.toFixed(2) + "U";
                ctx.font = getFontSize(moduleData.graph1AddSeeds.width * 0.8,moduleData.graph1AddSeeds.height,text,(size) => `${size}px monospace`) + "px monospace";
                ctx.fillText(
                    text,
                    moduleData.graph1ModelDropdown.button.width * 0.1,
                    (moduleData.graph1SeedSpacingSlider.y + moduleData.graph1AirKermaSlider.y) / 2
                );
            }
            if (moduleData.graph1.seeds[moduleData.selectedSeed].model.HDRsource){
                moduleData.graph1DwellTimeSlider.checkClicked();
                moduleData.graph1DwellTimeSlider.draw();
                if (moduleData.graph1.seeds[moduleData.selectedSeed].dwellTime != getDwellTimeFromSlider(moduleData.graph1DwellTimeSlider,moduleData.graph1.seeds[moduleData.selectedSeed])){
                    moduleData.graph1.seeds[moduleData.selectedSeed].dwellTime = getDwellTimeFromSlider(moduleData.graph1DwellTimeSlider,moduleData.graph1.seeds[moduleData.selectedSeed]);
                    render = true;
                }
                if (canvas.width > (canvas.height * 0.9)){
                    let text = "Dwell Time: " + (moduleData.graph1.seeds[moduleData.selectedSeed].dwellTime * 60).toFixed(2) + "min(s)";
                    ctx.font = getFontSize(moduleData.graph1AddSeeds.width * 0.8,moduleData.graph1AddSeeds.height,text,(size) => `${size}px monospace`) + "px monospace";
                    ctx.fillText(
                        text,
                        moduleData.graph1ModelDropdown.button.width * 1.1,
                        canvas.height * 0.25
                    );
                }else{
                    let text = "Dwell Time: " + (moduleData.graph1.seeds[moduleData.selectedSeed].dwellTime * 60).toFixed(2) + "U";
                    ctx.font = getFontSize(moduleData.graph1AddSeeds.width * 0.8,moduleData.graph1AddSeeds.height,text,(size) => `${size}px monospace`) + "px monospace";
                    ctx.fillText(
                        text,
                        moduleData.graph1ModelDropdown.button.width * 0.1,
                        (moduleData.graph1AirKermaSlider.y + moduleData.graph1DwellTimeSlider.y) / 2
                    );
                }
            }
        }

        //draw seed editing sliders graph2
        if ((moduleData.selectedGraph === "graph2") && (moduleData.selectedSeed != -1)){
            moduleData.graph2AirKermaSlider.checkClicked();
            moduleData.graph2AirKermaSlider.draw();
            if (moduleData.graph2.seeds[moduleData.selectedSeed].airKerma != getAirKermaFromSlider(moduleData.graph2AirKermaSlider,moduleData.graph2.seeds[moduleData.selectedSeed])){
                moduleData.graph2.seeds[moduleData.selectedSeed].airKerma = getAirKermaFromSlider(moduleData.graph2AirKermaSlider,moduleData.graph2.seeds[moduleData.selectedSeed]);
                render = true;
            }
            if (canvas.width > (canvas.height * 0.9)){
                let text = "Air Kerma: " + moduleData.graph2.seeds[moduleData.selectedSeed].airKerma.toFixed(2) + "U";
                ctx.font = getFontSize(moduleData.graph2AddSeeds.width * 0.8,moduleData.graph2AddSeeds.height,text,(size) => `${size}px monospace`) + "px monospace";
                ctx.fillText(
                    text,
                    moduleData.graph2ModelDropdown.button.x + moduleData.graph2ModelDropdown.button.width * 1.1,
                    canvas.height * 0.15
                );
            }else{
                let text = "Air Kerma: " + moduleData.graph2.seeds[moduleData.selectedSeed].airKerma.toFixed(2) + "U";
                ctx.font = getFontSize(moduleData.graph2AddSeeds.width * 0.8,moduleData.graph2AddSeeds.height,text,(size) => `${size}px monospace`) + "px monospace";
                ctx.fillText(
                    text,
                    moduleData.graph2ModelDropdown.button.x + moduleData.graph2ModelDropdown.button.width * 0.1,
                    (moduleData.graph2SeedSpacingSlider.y + moduleData.graph2AirKermaSlider.y) / 2
                );
            }
            if (moduleData.graph2.seeds[moduleData.selectedSeed].model.HDRsource){
                moduleData.graph2DwellTimeSlider.checkClicked();
                moduleData.graph2DwellTimeSlider.draw();
                if (moduleData.graph2.seeds[moduleData.selectedSeed].dwellTime != getDwellTimeFromSlider(moduleData.graph2DwellTimeSlider,moduleData.graph2.seeds[moduleData.selectedSeed])){
                    moduleData.graph2.seeds[moduleData.selectedSeed].dwellTime = getDwellTimeFromSlider(moduleData.graph2DwellTimeSlider,moduleData.graph2.seeds[moduleData.selectedSeed]);
                    render = true;
                }
                if (canvas.width > (canvas.height * 0.9)){
                    let text = "Dwell Time: " + (moduleData.graph2.seeds[moduleData.selectedSeed].dwellTime * 60).toFixed(2) + "min(s)";
                    ctx.font = getFontSize(moduleData.graph2AddSeeds.width * 0.8,moduleData.graph2AddSeeds.height,text,(size) => `${size}px monospace`) + "px monospace";
                    ctx.fillText(
                        text,
                        moduleData.graph2ModelDropdown.button.x + moduleData.graph2ModelDropdown.button.width * 1.1,
                        canvas.height * 0.25
                    );
                }else{
                    let text = "Dwell Time: " + (moduleData.graph2.seeds[moduleData.selectedSeed].dwellTime * 60).toFixed(2) + "U";
                    ctx.font = getFontSize(moduleData.graph2AddSeeds.width * 0.8,moduleData.graph2AddSeeds.height,text,(size) => `${size}px monospace`) + "px monospace";
                    ctx.fillText(
                        text,
                        moduleData.graph2ModelDropdown.button.x + moduleData.graph2ModelDropdown.button.width * 0.1,
                        (moduleData.graph2AirKermaSlider.y + moduleData.graph2DwellTimeSlider.y) / 2
                    );
                }
            }
        }

        moduleData.graph1ModelDropdown.drawDropdown();
        moduleData.graph2ModelDropdown.drawDropdown();
    }
    if (module === "brachytherapy applicators"){
        //brachytheapy appliators window
        ctx.clearRect(0,0,canvas.width,canvas.height);

        //draw treatment time
        let treatmentTime = "Total Treatment Time: " + (moduleData.graph1.seeds.reduce((acc,curr) => acc + curr.dwellTime, 0) * 60).toFixed(2) + " mins";
        let airKermaText = "Air Kerma: " + getAirKermaFromSlider(moduleData.graphAirKermaSlider,moduleData.graph1.seeds[0]).toFixed(2) + " Ci";
        ctx.font = Math.min(
            getFontSize(canvas.width / 3,canvas.height * 0.05,treatmentTime,(size) => `${size}px monospace`),
            getFontSize(canvas.width * 0.25,canvas.height * 0.05,airKermaText,(size) => `${size}px monospace`)
        ) + "px monospace";
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.fillText(treatmentTime,0,canvas.height * 0.15);
        ctx.beginPath();
        ctx.fillText(airKermaText,(canvas.width / 3) + canvas.width * 0.05,canvas.height * 0.15);

        moduleData.graphAirKermaSlider.x = canvas.width * 0.65;
        let airKermaTextMetrics = ctx.measureText(airKermaText);
        moduleData.graphAirKermaSlider.y = canvas.height * 0.15 + (airKermaTextMetrics.actualBoundingBoxDescent - airKermaTextMetrics.actualBoundingBoxAscent) / 2;
        moduleData.graphAirKermaSlider.length = canvas.width * 0.16;
        moduleData.graphAirKermaSlider.thickness = Math.min(canvas.width,canvas.height) * 0.01;

        if (moduleData.graph1.seeds[0].airKerma != getAirKermaFromSlider(moduleData.graphAirKermaSlider,moduleData.graph1.seeds[0])){
            moduleData.graphAirKermaSlider.value = getValueFromAirKerma(moduleData.graph1.seeds[0]);
        }
        moduleData.graphAirKermaSlider.draw();
        moduleData.graphAirKermaSlider.checkClicked();
        if (moduleData.graph1.seeds[0].airKerma != getAirKermaFromSlider(moduleData.graphAirKermaSlider,moduleData.graph1.seeds[0])){
            let editingSeeds = [moduleData.graph1];
            if (moduleData.applicatorModel.name != "Vaginal Cylinder"){editingSeeds.push(moduleData.graph2);}
            if (moduleData.applicatorModel.name === "Tandem/Ovoids"){editingSeeds.push(moduleData.graph3);}
            editingSeeds.forEach((graph) => {
                graph.seeds.forEach((seed) => {
                    seed.airKerma = getAirKermaFromSlider(moduleData.graphAirKermaSlider,seed);
                });
            });
            render = true;
            resetGraphs = false;
        }

        //reset dwell times button
        moduleData.resetDwellTimes.draw();

        adjustApplicatorRenderer(moduleData.graph1,moduleData.applicatorModel,{refPoint: "graph1refPoint", drawFunction: "graph1DrawApplicator", boundingBox: moduleData.divBoundGraph1, view: ((moduleData.applicatorModel.name === "Tandem/Ring") ? "side" : "front")});
        moduleData.graph1DrawApplicator();
        // erase graph2 if applicator is Vaginal Cylinder
        if (!(moduleData.applicatorModel.name === "Vaginal Cylinder")){
            adjustApplicatorRenderer(moduleData.graph2,moduleData.applicatorModel,{refPoint: "graph2refPoint", drawFunction: "graph2DrawApplicator", boundingBox: moduleData.divBoundGraph2, view: ((moduleData.applicatorModel.name === "Tandem/Ring") ? "top" : "side")});
            moduleData.graph2DrawApplicator();
        }else{
            let div = document.getElementById("graph2");
            while (div.firstChild){
                div.removeChild(div.firstChild);
            }
        }
        // add graph3 if applicator is Tandem/Ovoids
        if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
            adjustApplicatorRenderer(moduleData.graph3,moduleData.applicatorModel,{refPoint: "graph3refPoint", drawFunction: "graph3DrawApplicator", boundingBox: moduleData.divBoundGraph3, view: "top"});
            moduleData.graph3DrawApplicator();
        }else{
            let div = document.getElementById("graph3");
            while (div.firstChild){
                div.removeChild(div.firstChild);
            }
        }
        moduleData.applicatorModelDropdown.drawDropdown();

        // draw model dropdown graphs
        moduleData.graphModelDropdown.drawDropdown();

        // draw reference points
        if (moduleData.applicatorModel.name === "Vaginal Cylinder"){
            //draw graph 1 reference point
            ctx.fillStyle = "black";
            ctx.font = "16px serif";
            ctx.beginPath();
            let refPos = graphToScreenPos(moduleData.graph1refPoint,moduleData.graph1,moduleData.divBoundGraph1);
            ctx.arc(refPos.x,refPos.y,Math.min(moduleData.divBoundGraph1.width,moduleData.divBoundGraph1.height) * 0.01, 0, 7);
            ctx.fill();
            let initalZ = moduleData.graph1.zSlice;
            moduleData.graph1.zSlice = moduleData.graph1refPoint.z; // adjust zSlice of graph so dose is calculated at correct depth
            ctx.fillText(moduleData.graph1.getPointDose(moduleData.graph1refPoint).toFixed(2),refPos.x + Math.min(moduleData.divBoundGraph1.width,moduleData.divBoundGraph1.height) * 0.02,refPos.y);
            moduleData.graph1.zSlice = initalZ; // reset zSlice
        }else{
            // loops over every graph for every refence point and draw the reference points based on perspective
            let graphData = [
                {graph: moduleData.graph1, bound: moduleData.divBoundGraph1},
                {graph: moduleData.graph2, bound: moduleData.divBoundGraph2},
            ];
            if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
                graphData.push({graph: moduleData.graph3, bound: moduleData.divBoundGraph3});
            }
            [{x: 2,y: 2,z: 0},{x: -2,y: 2,z: 0}].forEach((refpoint) => {
                graphData.forEach((graphData) => {
                    ctx.font = "16px serif";
                    let adjustedRefpoint = graphData.graph.perspective(refpoint); // gets the screen pos of the reference point
                    let text = graphData.graph.getPointDose(refpoint).toFixed(2);
                    let refPos = graphToScreenPos(adjustedRefpoint,graphData.graph,graphData.bound);
                    
                    // draw graph point a's
                    ctx.fillStyle = "black";
                    let textDimensions = ctx.measureText(text);
                    let boxDimensions = {
                        width: textDimensions.width,
                        height: (textDimensions.actualBoundingBoxAscent - textDimensions.actualBoundingBoxDescent)
                    }
                    ctx.fillRect(
                        refPos.x + Math.min(graphData.bound.width,graphData.bound.height) * 0.02 - boxDimensions.width * 0.1,
                        refPos.y - textDimensions.actualBoundingBoxAscent - boxDimensions.height * 0.2,
                        boxDimensions.width * 1.2,
                        boxDimensions.height * 1.4
                    );
                    
                    ctx.beginPath();
                    ctx.arc(refPos.x,refPos.y,Math.min(graphData.bound.width,graphData.bound.height) * 0.01, 0, 7);
                    ctx.fill();

                    ctx.fillStyle = "white";
                    let initalZ = graphData.graph.zSlice;
                    graphData.graph.zSlice = refpoint.z; // adjust zSlice of graph so dose is calculated at correct depth
                    ctx.fillText(text,refPos.x + Math.min(graphData.bound.width,graphData.bound.height) * 0.02,refPos.y);
                    graphData.graph.zSlice = initalZ; // reset zSlice
                });
            });
        }
    }
    if ((module === "string of seeds") || (module === "planar array of seeds") || (module === "brachytherapy applicators")){
        //draw "dwell positions of seeds" graph1
        drawGraphSeeds(moduleData.graph1,moduleData.divBoundGraph1,"graph1");
    }
    if (moduleData.graph1){
        // label dose at cursor graph 1
        if ((mouse.x > moduleData.divBoundGraph1.x) && (mouse.x < moduleData.divBoundGraph1.x + moduleData.divBoundGraph1.width)
            && (mouse.y > moduleData.divBoundGraph1.y) && (mouse.y < moduleData.divBoundGraph1.y + moduleData.divBoundGraph1.height)){
            mouseGraphPos = {
                x: (((mouse.x - moduleData.divBoundGraph1.x) / moduleData.divBoundGraph1.width)*
                    (getMax(moduleData.graph1.xTicks) - getMin(moduleData.graph1.xTicks)) + getMin(moduleData.graph1.xTicks)),
                y: (((mouse.y - moduleData.divBoundGraph1.y) / moduleData.divBoundGraph1.height)*
                    (getMin(moduleData.graph1.yTicks) - getMax(moduleData.graph1.yTicks)) + getMax(moduleData.graph1.yTicks))
            }
            ctx.beginPath();
            ctx.font = "16px serif";
            let dose = moduleData.graph1.getPointDose({x: mouseGraphPos.x, y: mouseGraphPos.y, z: moduleData.graph1.zSlice}).toFixed(2);
            let textDimensions = ctx.measureText(dose + " Gy");
            let textHeight = textDimensions.actualBoundingBoxAscent + textDimensions.actualBoundingBoxDescent;
            ctx.fillStyle = "white";
            ctx.fillRect(mouse.x,mouse.y - textHeight,textDimensions.width,textHeight);
            ctx.fillStyle = "black";
            ctx.fillText(dose + " Gy",mouse.x,mouse.y);
        }

        if (module != "brachytherapy applicators"){
            //draw graph 1 reference point
            ctx.fillStyle = "black";
            ctx.font = "16px serif";
            ctx.beginPath();
            let refPos = graphToScreenPos(moduleData.graph1refPoint,moduleData.graph1,moduleData.divBoundGraph1);
            ctx.arc(refPos.x,refPos.y,Math.min(moduleData.divBoundGraph1.width,moduleData.divBoundGraph1.height) * 0.01, 0, 7);
            ctx.fill();
            if (module != "string of seeds"){
                ctx.fillText(moduleData.graph1.getPointDose(moduleData.graph1refPoint).toFixed(2),refPos.x + Math.min(moduleData.divBoundGraph1.width,moduleData.divBoundGraph1.height) * 0.02,refPos.y);
            }
        }
    }
    if (moduleData.graph2){
        if (!(module === "brachytherapy applicators")){
            //draw graph 2 reference point
            ctx.fillStyle = "black";
            ctx.font = "16px serif";
            ctx.beginPath();
            refPos = graphToScreenPos(moduleData.graph2refPoint,moduleData.graph2,moduleData.divBoundGraph2);
            ctx.arc(refPos.x,refPos.y,moduleData.divBoundGraph2.width * 0.01, 0, 7);
            ctx.fill();
            ctx.fillText(moduleData.graph2.getPointDose(moduleData.graph2refPoint).toFixed(2),refPos.x + moduleData.divBoundGraph2.width * 0.02,refPos.y);
        }

        //dose label for graph 2
        if ((mouse.x > moduleData.divBoundGraph2.x) && (mouse.x < moduleData.divBoundGraph2.x + moduleData.divBoundGraph2.width)
            && (mouse.y > moduleData.divBoundGraph2.y) && (mouse.y < moduleData.divBoundGraph2.y + moduleData.divBoundGraph2.height)){
            mouseGraphPos = {
                x: (((mouse.x - moduleData.divBoundGraph2.x) / moduleData.divBoundGraph2.width)*
                    (getMax(moduleData.graph2.xTicks) - getMin(moduleData.graph2.xTicks)) + getMin(moduleData.graph2.xTicks)),
                y: (((mouse.y - moduleData.divBoundGraph2.y) / moduleData.divBoundGraph2.height)*
                    (getMin(moduleData.graph2.yTicks) - getMax(moduleData.graph2.yTicks)) + getMax(moduleData.graph2.yTicks))
            }
            ctx.beginPath();
            ctx.font = "16px serif";
            let dose = moduleData.graph2.getPointDose({x: mouseGraphPos.x, y: mouseGraphPos.y, z: moduleData.graph2.zSlice}).toFixed(2);
            let textDimensions = ctx.measureText(dose + " Gy");
            let textHeight = textDimensions.actualBoundingBoxAscent + textDimensions.actualBoundingBoxDescent;
            ctx.fillStyle = "white";
            ctx.fillRect(mouse.x,mouse.y - textHeight,textDimensions.width,textHeight);
            ctx.fillStyle = "black";
            ctx.fillText(dose +" Gy",mouse.x,mouse.y);
        }

        //draw "dwell positions of seeds" graph2
        if (module != "single seed"){
            if (module === "brachytherapy applicators"){
                if (moduleData.applicatorModel.name != "Vaginal Cylinder"){
                    drawGraphSeeds(moduleData.graph2,moduleData.divBoundGraph2,"graph2");
                }
            }else{
                drawGraphSeeds(moduleData.graph2,moduleData.divBoundGraph2,"graph2");
            }
        }
    }
    if (moduleData.graph3 && (moduleData.applicatorModel.name === "Tandem/Ovoids")){
        //dose label for graph 3
        if ((mouse.x > moduleData.divBoundGraph3.x) && (mouse.x < moduleData.divBoundGraph3.x + moduleData.divBoundGraph3.width)
            && (mouse.y > moduleData.divBoundGraph3.y) && (mouse.y < moduleData.divBoundGraph3.y + moduleData.divBoundGraph3.height)){
            mouseGraphPos = {
                x: (((mouse.x - moduleData.divBoundGraph3.x) / moduleData.divBoundGraph3.width)*
                    (getMax(moduleData.graph3.xTicks) - getMin(moduleData.graph3.xTicks)) + getMin(moduleData.graph3.xTicks)),
                y: (((mouse.y - moduleData.divBoundGraph3.y) / moduleData.divBoundGraph3.height)*
                    (getMin(moduleData.graph3.yTicks) - getMax(moduleData.graph3.yTicks)) + getMax(moduleData.graph3.yTicks))
            }
            ctx.beginPath();
            ctx.font = "16px serif";
            let dose = moduleData.graph3.getPointDose({x: mouseGraphPos.x, y: mouseGraphPos.y, z: moduleData.graph3.zSlice}).toFixed(2);
            let textDimensions = ctx.measureText(dose + " Gy");
            let textHeight = textDimensions.actualBoundingBoxAscent + textDimensions.actualBoundingBoxDescent;
            ctx.fillStyle = "white";
            ctx.fillRect(mouse.x,mouse.y - textHeight,textDimensions.width,textHeight);
            ctx.fillStyle = "black";
            ctx.fillText(dose +" Gy",mouse.x,mouse.y);
        }

        //draw "dwell positions of seeds" graph3
        drawGraphSeeds(moduleData.graph3,moduleData.divBoundGraph3,"graph3");
    }
    if ((typeof moduleData.selectedSeed != "undefined") && (moduleData.selectedSeed != -1) && (module === "brachytherapy applicators")){
        // draw Dwell time box in brachy applicators module
        let selectedGraph = moduleData[moduleData.selectedGraph];
        let seedPos = graphToScreenPos(selectedGraph.perspective(selectedGraph.seeds[moduleData.selectedSeed].pos),selectedGraph,moduleData["divBoundG" + moduleData.selectedGraph.substring(1)]);
        let editMenuPos = {x: 0, y: 0};
        if (seedPos.x < canvas.width * 0.5){
            editMenuPos.x = seedPos.x + canvas.width * 0.05;;
        }else{
            editMenuPos.x = seedPos.x - canvas.width * 0.25;
        }
        if (seedPos.y < canvas.height * 0.5){
            editMenuPos.y = seedPos.y + canvas.height * 0.05;
        }else{
            editMenuPos.y = seedPos.y - canvas.height * 0.25;
        }
        ctx.strokeStyle = "black";
        ctx.lineWidth = Math.min(canvas.width,canvas.height) * 0.01;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.moveTo(seedPos.x,seedPos.y);
        ctx.lineTo(editMenuPos.x + canvas.width * 0.1,editMenuPos.y + canvas.height * 0.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.rect(editMenuPos.x,editMenuPos.y,canvas.width * 0.2, canvas.height * 0.1);
        ctx.fill();
        ctx.stroke();

        moduleData.graphDwellTimeSlider.x = editMenuPos.x + canvas.width * 0.02;
        moduleData.graphDwellTimeSlider.y = editMenuPos.y + canvas.height * 0.07;
        moduleData.graphDwellTimeSlider.length = canvas.width * 0.16;
        moduleData.graphDwellTimeSlider.thickness = Math.min(canvas.width,canvas.height) * 0.01;

        moduleData.graphDwellTimeSlider.draw();
        moduleData.graphDwellTimeSlider.checkClicked();
        if (selectedGraph.seeds[moduleData.selectedSeed].dwellTime != getDwellTimeFromSlider(moduleData.graphDwellTimeSlider,selectedGraph.seeds[moduleData.selectedSeed])){
            let editingSeeds = [moduleData.graph1.seeds[moduleData.selectedSeed]];
            if (moduleData.applicatorModel.name != "Vaginal Cylinder"){editingSeeds.push(moduleData.graph2.seeds[moduleData.selectedSeed]);}
            if (moduleData.applicatorModel.name === "Tandem/Ovoids"){editingSeeds.push(moduleData.graph3.seeds[moduleData.selectedSeed]);}
            editingSeeds.forEach((seed) => {
                seed.dwellTime = getDwellTimeFromSlider(moduleData.graphDwellTimeSlider,seed);
            });
            render = true;
            resetGraphs = false;
        }

        let dwellTimeText;
        if ((selectedGraph.seeds[moduleData.selectedSeed].dwellTime * 60) < 2){
            dwellTimeText = "Dwell Time: " + (selectedGraph.seeds[moduleData.selectedSeed].dwellTime * 3600).toFixed(2) + " seconds";
        }else{
            dwellTimeText = "Dwell Time: " + (selectedGraph.seeds[moduleData.selectedSeed].dwellTime * 60).toFixed(2) + " mins";
        }
        ctx.font = getFontSize(canvas.width * 0.15,canvas.height * 0.05,dwellTimeText,(size) => `${size}px monospace`) + "px monospace";
        ctx.fillStyle = "black"
        ctx.fillText(dwellTimeText,editMenuPos.x + canvas.width * 0.025,editMenuPos.y + canvas.height * 0.04);
    }

    //draw module selection bar
    moduleData.moduleSelectBar.forEach((button) => {
        button.draw();
    });
}

function initModule(mod,previousMod){
    // this function initalizes a module, or loads a previously initalized module
    if (mod === "string of seeds"){
        let div = document.getElementById("graph2");
        while (div.firstChild){
            div.removeChild(div.firstChild);
        }
    }
    if (!(mod === "brachytherapy applicators")){
        let div = document.getElementById("graph3");
        while (div.firstChild){
            div.removeChild(div.firstChild);
        }
    }
    if (previousMod && savedModuleData[mod]){ //everything below this is only run if the page is opened for the first time, everything above is run every time a page is opened
        savedModuleData[previousMod] = {...moduleData}; // save module data
        moduleData = {...savedModuleData[mod]}; // load module data
        adjustFormatting();
        render = true;
        resetGraphs = true;
        return;
    }
    if (previousMod){
        savedModuleData[previousMod] = moduleData; // save module data
    }
    if (mod === "single seed"){
        let ticks = [];
        for (let j = -2; j <= 2; j+= 0.0625){ticks.push(j);}
        moduleData = {
            graph1: (
                new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [new Seed({x:0, y:0, z:0},{phi: 0, theta: 0},TheraSeed200,airKermaSliderLimits.LDR.min,0.00833)], xTicks: ticks, yTicks: ticks, perspective: (point) => point}) //x,y,width, and height are all set to 0 since they will be later formatted with an adjustFormatting() call
            ),
            divBoundGraph1: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph2: (
                new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [new Seed({x:0, y:0, z:0},{phi: 0, theta: 0},GammaMedHDRPlus,airKermaSliderLimits.HDR.min,0.00833)], xTicks: ticks, yTicks: ticks, perspective: (point) => point}) //x,y,width, and height are all set to 0 since they will be later formatted with an adjustFormatting() call
            ),
            divBoundGraph2: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph1ModelDropdown: new Dropdown(
                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "black", onClick: () => {},label: {text: "", font: "default", color: "white"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}}),[]
            ),
            graph2ModelDropdown: new Dropdown(
                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "black", onClick: () => {},label: {text: "", font: "default", color: "white"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}}),[]
            ),
            graph1refPoint: {x: 0, y: 1, z: 0},
            graph2refPoint: {x: 0, y: 1, z: 0},
            graph1AirKermaSlider: new Slider(0,0,0,0,"black",0,0),
            graph2AirKermaSlider: new Slider(0,0,0,0,"black",0,0),
            graph1DwellTimeSlider: new Slider(0,0,0,0,"black",0,0),
            graph2DwellTimeSlider: new Slider(0,0,0,0,"black",0,0),
        };
        moduleData.graph1DwellTimeSlider.value = getValueFromDwellTime(moduleData.graph1.seeds[0]);
        moduleData.graph2DwellTimeSlider.value = getValueFromDwellTime(moduleData.graph2.seeds[0]);
        moduleData.graph1AirKermaLabel = new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Air Kerma: ${value}U`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: () => moduleData.graph1.seeds[0].airKerma,
            onEnter: function (value){
                let clampedVal = Math.min(value,(moduleData.graph1.seeds[0].model.HDRsource) ? airKermaSliderLimits.HDR.max : airKermaSliderLimits.LDR.max);
                clampedVal = Math.max(clampedVal,(moduleData.graph1.seeds[0].model.HDRsource) ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min);
                moduleData.graph1.seeds[0].airKerma = clampedVal;
                moduleData.graph1AirKermaSlider.value = getValueFromAirKerma(moduleData.graph1.seeds[0]);
            },
            numDecimalsEditing: 3
        });
        moduleData.graph2AirKermaLabel = new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Air Kerma: ${value}U`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: () => moduleData.graph2.seeds[0].airKerma,
            onEnter: function (value){
                let clampedVal = Math.min(value,(moduleData.graph2.seeds[0].model.HDRsource) ? airKermaSliderLimits.HDR.max : airKermaSliderLimits.LDR.max);
                clampedVal = Math.max(clampedVal,(moduleData.graph2.seeds[0].model.HDRsource) ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min);
                moduleData.graph2.seeds[0].airKerma = clampedVal;
                moduleData.graph2AirKermaSlider.value = getValueFromAirKerma(moduleData.graph2.seeds[0]);
            },
            numDecimalsEditing: 3
        });
        moduleData.graph1DwellTimeLabel = new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Dwell Time: ${value} seconds`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: () => moduleData.graph1.seeds[0].dwellTime * 3600,
            onEnter: function (value){
                let clampedVal = Math.min(value / 3600,0.0833333333333);
                clampedVal = Math.max(clampedVal,0);
                moduleData.graph1.seeds[0].dwellTime = clampedVal;
                moduleData.graph1DwellTimeSlider.value = getValueFromDwellTime(moduleData.graph1.seeds[0]);
            },
            numDecimalsEditing: 3
        });
        moduleData.graph2DwellTimeLabel = new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Dwell Time: ${value} seconds`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: () => moduleData.graph2.seeds[0].dwellTime * 3600,
            onEnter: function (value){
                let clampedVal = Math.min(value / 3600,0.0833333333333);
                clampedVal = Math.max(clampedVal,0);
                moduleData.graph2.seeds[0].dwellTime = clampedVal;
                moduleData.graph2DwellTimeSlider.value = getValueFromDwellTime(moduleData.graph2.seeds[0]);
            },
            numDecimalsEditing: 3
        });
    }
    if (mod === "string of seeds"){
        let xTicks = [];
        let yTicks = [];
        for (let j = -10; j <= 10; j+= 0.25){xTicks.push(j);}
        for (let j = -2; j <= 2; j += 0.125){yTicks.push(j);}
        moduleData = {
            graph1: new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [new Seed({x: 0, y: 0, z: 0},{phi: 0, theta: 0},BEBIG_GK60M21,airKermaSliderLimits.HDR.min,0.00833)],xTicks: xTicks, yTicks: yTicks, perspective: (point) => point}),
            divBoundGraph1: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph1refPoint: {x: 0, y: 1, z: 0},
            addSeed: new Button({x: 0, y: 0, width: 0, height: 0, label: {text: "Add Source +",font: "default", color: "black"}, bgColor: "rgb(40, 197, 53)",
                onClick: () => {
                    if ((moduleData.graph1.seeds.length * moduleData.seedSpacing) <= (getMax(moduleData.graph1.xTicks) - getMin(moduleData.graph1.xTicks))){
                        moduleData.graph1.seeds.push(
                            new Seed(
                                {x: 0, y: 0, z: 0},
                                {phi: 0, theta: 0},
                                moduleData.graph1.seeds[0].model,
                                (moduleData.graph1.seeds[0].model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min)
                                ,0.00833
                            )
                        );
                        adjustFormatting();
                        render = true;
                    }
                },outline: {color: "black",thickness: Math.min(canvas.width,canvas.height) * 0.001}
            }),
            seedSpacing: 1, // measured in cm
            seedSpacingSlider: new Slider(0,0,0,0,"black",0,0.5),
            selectedSeed: -1,
            deleteSeed: new Button({x: 0, y: 0, width: 0, height: 0, label: {text: "Delete Source -",font: "default", color: "black"}, bgColor: "rgb(197, 40, 40)",
                onClick: () => {
                    if (moduleData.graph1.seeds.length > 1){
                        moduleData.graph1.seeds.splice(moduleData.selectedSeed,1);
                        moduleData.selectedSeed = -1;
                        adjustFormatting();
                        render = true;
                    }
                },outline: {color: "black",thickness: Math.min(canvas.width,canvas.height) * 0.001}
            }),
            airKermaSlider: new Slider(0,0,0,0,"black",0,0.5),
            graph1ModelDropdown: new Dropdown(
                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "black", onClick: () => {},label: {text: "", font: "default", color: "white"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}}),[]
            ),
            dwellTimeSlider: new Slider(0,0,0,0,"black",0,0.5),
        };
        moduleData.seedSpacingLabel = new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Source Spacing: ${value}cm`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: () => moduleData.seedSpacing,
            onEnter: function (value){
                let clampedVal = Math.max(Math.min(value,1.5),0.5);
                moduleData.seedSpacing = clampedVal;
                moduleData.seedSpacingSlider.value = clampedVal - 0.5;
                render = true;
            },
            numDecimalsEditing: 2
        });
        moduleData.airKermaLabel = new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Air Kerma: ${value}U`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: () => {
                if (typeof moduleData.selectedSeed != "undefined"){
                    if (moduleData.selectedSeed != -1){
                        return moduleData[moduleData.selectedGraph].seeds[moduleData.selectedSeed].airKerma
                    }
                }
                return 0;
            },
            onEnter: function (value){
                let seedSelected = moduleData[moduleData.selectedGraph].seeds[moduleData.selectedSeed];
                let clampedVal = Math.min(value,(seedSelected.model.HDRsource) ? airKermaSliderLimits.HDR.max : airKermaSliderLimits.LDR.max);
                clampedVal = Math.max(clampedVal,(seedSelected.model.HDRsource) ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min);
                seedSelected.airKerma = clampedVal;
                moduleData.airKermaSlider.value = getValueFromAirKerma(seedSelected);
                render = true;
            },
            numDecimalsEditing: 3
        });
        moduleData.dwellTimeLabel = new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `Dwell Time: ${value} second(s)`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: () => {
                if (typeof moduleData.selectedSeed != "undefined"){
                    if (moduleData.selectedSeed != -1){
                        return moduleData[moduleData.selectedGraph].seeds[moduleData.selectedSeed].dwellTime * 3600
                    }
                }
                return 0;
            },
            onEnter: function (value){
                let seedSelected = moduleData[moduleData.selectedGraph].seeds[moduleData.selectedSeed];
                let clampedVal = Math.max(Math.min(value / 3600,0.0833333333333),0);
                seedSelected.dwellTime = clampedVal;
                moduleData.dwellTimeSlider.value = getValueFromDwellTime(seedSelected);
                render = true;
            },
            numDecimalsEditing: 3
        });
        moduleData.refPointLabel = new NumberInput({
            x: 0, y: 0, width: 0, height: 0,
            label: {
                text: (value) => `${value}Gy`,
                color: {selected: "white", notSelected: "black"}
            },bgColor: {selected: "black", notSelected: "white"},
            getValue: () => moduleData.graph1.getPointDose(moduleData.graph1refPoint),
            onEnter: function (value){
                const searchPrecision = 20;
                if (moduleData.graph1.seeds[0].model.HDRsource){
                    let dwellTime = {min: 0, max: 0.0833333333333};
                    let testingDwellTime = () => (dwellTime.min + dwellTime.max) / 2;
                    for (let i = 0; i < searchPrecision; i++){
                        moduleData.graph1.seeds.forEach((seed) => {
                            seed.dwellTime = testingDwellTime();
                        });
                        if (moduleData.graph1.getPointDose(moduleData.graph1refPoint) > value){
                            dwellTime.max = testingDwellTime();
                        }else{
                            dwellTime.min = testingDwellTime();
                        }
                    }
                    if (typeof moduleData.selectedSeed != "undefined"){
                        if (moduleData.selectedSeed != -1){
                            moduleData.dwellTimeSlider.value = getValueFromDwellTime(moduleData.graph1.seeds[0]);
                        }
                    }
                }else{
                    let airKerma = {...airKermaSliderLimits.LDR};
                    let testingAirKerma = () => (airKerma.min + airKerma.max) / 2;
                    for (let i = 0; i < searchPrecision; i++){
                        moduleData.graph1.seeds.forEach((seed) => {
                            seed.airKerma = testingAirKerma();
                        });
                        if (moduleData.graph1.getPointDose(moduleData.graph1refPoint) > value){
                            airKerma.max = testingAirKerma();
                        }else{
                            airKerma.min = testingAirKerma();
                        }
                    }
                    if (typeof moduleData.selectedSeed != "undefined"){
                        if (moduleData.selectedSeed != -1){
                            moduleData.airKermaSlider.value = getValueFromAirKerma(moduleData.graph1.seeds[0]);
                        }
                    }
                }
                render = true;
            },
            numDecimalsEditing: 3
        });
    }
    if (mod === "planar array of seeds"){
        let tick = [];
        for (let j = -5; j <= 5; j+= 0.25){tick.push(j);}
        moduleData = {
            graph1: new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [],xTicks: tick, yTicks: tick, perspective: (point) => point}),
            divBoundGraph1: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph1refPoint: {x: 0, y: 0, z: 0},
            graph1SeedSpacing: 1,
            graph1SeedSpacingSlider: new Slider(0,0,0,0,"black",0,0.5),
            graph1ModelDropdown: new Dropdown(
                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "black", onClick: () => {},label: {text: "", font: "default", color: "white"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}}),[]
            ),
            graph1AirKermaSlider: new Slider(0,0,0,0,"black",0,0.5),
            graph1DwellTimeSlider: new Slider(0,0,0,0,"black",0,0.5),
            graph1AddSeeds: new Button({x: 0, y: 0, width: 0, height: 0, label: {text: "Expand Array +",font: "default", color: "black"}, bgColor: "rgb(40, 197, 53)",
                onClick: () => {
                    if (
                        (Math.sqrt(moduleData.graph1.seeds.length) + 2) * moduleData.graph1SeedSpacing
                        <= Math.min(
                            getMax(moduleData.graph1.xTicks) - getMin(moduleData.graph1.xTicks),
                            getMax(moduleData.graph1.yTicks) - getMin(moduleData.graph1.yTicks)
                        )
                    ){ //restricts adding seeds if they exceed the bound of the graph
                        let numNewSeeds = (4 * Math.sqrt(moduleData.graph1.seeds.length) + 4);
                        for (let i = 0; i < numNewSeeds; i++){
                            moduleData.graph1.seeds.push(
                                new Seed(
                                    {x: 0, y: 0, z: 0},
                                    {phi: 0, theta: 0},
                                    moduleData.graph1.seeds[0].model,
                                    (moduleData.graph1.seeds[0].model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min)
                                    ,0.00833
                                )
                            );
                        }
                        adjustFormatting();
                        render = true;
                    }
                },outline: {color: "black",thickness: Math.min(canvas.width,canvas.height) * 0.001}
            }),
            graph1RemoveSeeds: new Button({x: 0, y: 0, width: 0, height: 0, label: {text: "Shrink Array -",font: "default", color: "black"}, bgColor: "rgb(197, 40, 40)",
                onClick: () => {
                    if (moduleData.graph1.seeds.length > 4){ //restricts adding seeds if they exceed the bound of the graph
                        moduleData.graph1.seeds.splice(0,4 * Math.sqrt(moduleData.graph1.seeds.length) - 4);
                        adjustFormatting();
                        render = true;
                    }
                },outline: {color: "black",thickness: Math.min(canvas.width,canvas.height) * 0.001}
            }),
            graph2: new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [],xTicks: tick, yTicks: tick, perspective: (point) => point}),
            divBoundGraph2: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph2refPoint: {x: 0, y: 0, z: 0},
            graph2SeedSpacing: 1,
            graph2SeedSpacingSlider: new Slider(0,0,0,0,"black",0,0.5),
            graph2ModelDropdown: new Dropdown(
                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "black", onClick: () => {},label: {text: "", font: "default", color: "white"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}}),[]
            ),
            graph2AddSeeds: new Button({x: 0, y: 0, width: 0, height: 0, label: {text: "Expand Array +",font: "default", color: "black"}, bgColor: "rgb(40, 197, 53)",
                onClick: () => {
                    if (
                        (Math.sqrt(moduleData.graph2.seeds.length) + 2) * moduleData.graph2SeedSpacing
                        <= Math.min(
                            getMax(moduleData.graph2.xTicks) - getMin(moduleData.graph2.xTicks),
                            getMax(moduleData.graph2.yTicks) - getMin(moduleData.graph2.yTicks)
                        )
                    ){ //restricts adding seeds if they exceed the bound of the graph
                        let numNewSeeds = (4 * Math.sqrt(moduleData.graph2.seeds.length) + 4);
                        for (let i = 0; i < numNewSeeds; i++){
                            moduleData.graph2.seeds.push(
                                new Seed(
                                    {x: 0, y: 0, z: 0},
                                    {phi: 0, theta: 0},
                                    moduleData.graph2.seeds[0].model,
                                    (moduleData.graph2.seeds[0].model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min)
                                    ,0.00833
                                )
                            );
                        }
                        adjustFormatting();
                        render = true;
                    }
                },outline: {color: "black",thickness: 0}
            }),
            graph2RemoveSeeds: new Button({x: 0, y: 0, width: 0, height: 0, label: {text: "Shrink Array -",font: "default", color: "black"}, bgColor: "rgb(197, 40, 40)",
                onClick: () => {
                    if (moduleData.graph2.seeds.length > 4){ //restricts adding seeds if they exceed the bound of the graph
                        moduleData.graph2.seeds.splice(0,4 * Math.sqrt(moduleData.graph2.seeds.length) - 4);
                        adjustFormatting();
                        render = true;
                    }
                },outline: {color: "black",thickness: Math.min(canvas.width,canvas.height) * 0.001}
            }),
            graph2AirKermaSlider: new Slider(0,0,0,0,"black",0,0.5),
            graph2DwellTimeSlider: new Slider(0,0,0,0,"black",0,0.5),
        }
        for (let i = -1.5; i <= 1.5; i += 1){
            for (let j = -1.5; j <= 1.55; j += 1){
                moduleData.graph1.seeds.push(new Seed({x: j, y: i, z: 0},{phi: 0, theta: 0},TheraSeed200,airKermaSliderLimits.LDR.min,0.00833));
                moduleData.graph1.geometryRef = moduleData.graph1refPoint;
                moduleData.graph2.seeds.push(new Seed({x: j, y: i, z: 0},{phi: 0, theta: 0},GammaMedHDRPlus,airKermaSliderLimits.HDR.min,0.00833));
                moduleData.graph2.geometryRef = moduleData.graph2refPoint;
            }
        }
    }
    if (mod === "brachytherapy applicators"){
        moduleData = {
            graph1: new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [],xTicks: [], yTicks: [], perspective: (point) => point}),
            divBoundGraph1: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph1refPoint: {x: 0, y: 0, z: 0},
            graph2: new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [],xTicks: [], yTicks: [],
                perspective: (point) => {
                    return {
                        x: point.z,
                        y: point.y,
                        z: point.x
                    };
                }
            }),
            divBoundGraph2: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph2refPoint: {x: 0, y: 0, z: 0},
            graph3: new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [],xTicks: [], yTicks: [],
                perspective: (point) => {
                    return {
                        x: point.x,
                        y: point.z,
                        z: point.y
                    };
                }
            }),
            divBoundGraph3: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph3refPoint: {x: 0, y: 0, z: 0},
            graphModelDropdown: new Dropdown(
                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "black", onClick: () => {},label: {text: "", font: "default", color: "white"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}}),[]
            ),
            applicatorModelDropdown: new Dropdown(
                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "black", onClick: () => {},label: {text: "", font: "default", color: "white"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}}),[]
            ),
            graphAirKermaSlider: new Slider(0,0,0,0,"black",0,0),
            graphDwellTimeSlider: new Slider(0,0,0,0,"black",0,0.5),
            resetDwellTimes: new Button({
                x: 0, y: 0, width: 0, height: 0, bgColor: "black",
                onClick: () => {
                    moduleData.graph1.seeds.forEach((seed) => {seed.dwellTime = 0.00833});
                    if (moduleData.graph2.seeds){moduleData.graph2.seeds.forEach((seed) => {seed.dwellTime = 0.00833});}
                    if (moduleData.graph3.seeds){moduleData.graph3.seeds.forEach((seed) => {seed.dwellTime = 0.00833});}
                    moduleData.selectedSeed = -1;
                    render = true;
                },
                label: {text: "Reset Dwell Times", font: "default", color: "white"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001}
            }),
        }
        moduleData.applicatorModel = {name: "Vaginal Cylinder", length: 4, diameter: 2, angle: 90};
        adjustApplicatorGraphFormat(moduleData.graph1,moduleData.applicatorModel,{refPoint: "graph1refPoint", drawFunction: "graph1DrawApplicator", boundingBox: moduleData.divBoundGraph1, view: ((moduleData.applicatorModel.name === "Tandem/Ring") ? "side" : "front")});
        adjustApplicatorGraphFormat(moduleData.graph2,moduleData.applicatorModel,{refPoint: "graph2refPoint", drawFunction: "graph2DrawApplicator", boundingBox: moduleData.divBoundGraph2, view: ((moduleData.applicatorModel.name === "Tandem/Ring") ? "top" : "side")});
        adjustApplicatorGraphFormat(moduleData.graph3,moduleData.applicatorModel,{refPoint: "graph3refPoint", drawFunction: "graph3DrawApplicator", boundingBox: moduleData.divBoundGraph3, view: "top"});
        // fill options for seed model dropdown
        for (let i = 0; i < 3; i++){
            let seedModel = [GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource][i];
            moduleData.graphModelDropdown.options.push(new Button({
                x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: seedModel.name + " (" + seedModel.isotope + ")", font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
                onClick: () => {
                    moduleData.graph1.seeds.forEach((seed) => {
                        seed.model = seedModel;
                        seed.airKerma = (seed.model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min);
                        seed.dwellTime = 0.00833;
                    });
                    if (moduleData.selectedSeed && (moduleData.selectedSeed != -1)){
                        moduleData.graphAirKermaSlider.value = getValueFromAirKerma(moduleData.graph1.seeds[moduleData.selectedSeed]);
                        moduleData.graphDwellTimeSlider.value = getValueFromDwellTime(moduleData.graph1.seeds[moduleData.selectedSeed]);
                    }
                    moduleData.graphModelDropdown.button.label = seedModel.name + " (" + seedModel.isotope + ")";
                    render = true;
                    resetGraphs = true;
                },
            }));
        }
        for (let i = 0; i < 3; i ++){ // push applicator type selection to dropdown
            moduleData.applicatorModelDropdown.options.push(
                new Dropdown(new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: (["Vaginal Cylinder","Tandem/Ovoids","Tandem/Ring"][i]), font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},onClick: () => {}}),[])
            );
        }
        moduleData.applicatorModelDropdown.options.forEach((button) => { // push second layer to module selection dropdown
            if (button.button.label == "Vaginal Cylinder"){
                for (let i = 30; i <= 60; i+= 10){
                    button.options.push(
                        new Dropdown(new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: ("length: " + i / 10 + " cm"), font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},onClick: () => {}}),[]),
                    );
                }
            }else{
                for (let i = 0; i < 4; i++){
                    button.options.push(
                        new Dropdown(new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: ("Angle: " + [30,45,60,90][i] + " Deg"), font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},onClick: () => {}}),[]),
                    );
                }
            }
        });
        moduleData.applicatorModelDropdown.options.forEach((applicatorType) => {
            if (applicatorType.button.label != "Vaginal Cylinder"){
                applicatorType.options.forEach((angleSelection) => {
                    for (let i = 20; i <= 60; i+= 10){
                        angleSelection.options.push(
                            new Dropdown(new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: ("length: " + i + " mm"), font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},onClick: () => {}}),[])
                        );
                    }
                });
            }else{
                applicatorType.options.forEach((lengthSelection,lengthInd) => {
                    for (let i = 20; i <= 35; i+= 5){
                        lengthSelection.options.push(
                            new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: ("diameter: " + i / 10 + " cm"), font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
                                onClick: () => {
                                    moduleData.applicatorModel = {name: "Vaginal Cylinder", length: [3,4,5,6][lengthInd], diameter: i / 10, angle: 90};
                                    moduleData.applicatorModelDropdown.collapseDropdown();
                                    adjustFormatting();
                                    moduleData.selectedSeed = -1;
                                    render = true;
                                    resetGraphs = true;
                                }
                            })
                        );
                    }
                });
            }
        });
        moduleData.applicatorModelDropdown.options.forEach((applicatorType) => {
            if (applicatorType.button.label === "Tandem/Ovoids"){
                applicatorType.options.forEach((angleSelection,angleInd) => {
                    angleSelection.options.forEach((lengthSelection,lengthInd) => {
                        for (let i = 20; i <= 35; i+= 5){
                            lengthSelection.options.push(
                                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: ("Ovoids: " + i + " mm"), font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
                                    onClick: () => {
                                        moduleData.applicatorModel = {name: "Tandem/Ovoids", length: [2,3,4,5,6][lengthInd], diameter: 0.6, angle: [30,45,60,90][angleInd], ovoidDiameter: i / 10};
                                        moduleData.applicatorModelDropdown.collapseDropdown();
                                        adjustFormatting();
                                        moduleData.selectedSeed = -1;
                                        render = true;
                                        resetGraphs = true;
                                    }
                                })
                            );
                        }
                    });
                });
            }
            if (applicatorType.button.label === "Tandem/Ring"){
                applicatorType.options.forEach((angleSelection,angleInd) => {
                    angleSelection.options.forEach((lengthSelection,lengthInd) => {
                        for (let i = 20; i <= 35; i+= 5){
                            lengthSelection.options.push(
                                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: ("Ring Diameter: " + i + " mm"), font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
                                    onClick: () => {
                                        moduleData.applicatorModel = {name: "Tandem/Ring", length: [2,3,4,5,6][lengthInd], diameter: 0.6, angle: [30,45,60,90][angleInd], ringDiameter: i / 10};
                                        moduleData.applicatorModelDropdown.collapseDropdown();
                                        moduleData.selectedSeed = -1;
                                        render = true;
                                        resetGraphs = true;
                                    }
                                })
                            );
                        }
                    });
                });
            }
        });
    }
    // add options to model dropdown menu 1
    if (moduleData.graph1ModelDropdown){
        for (let i = 0; i < 5; i++){
            let seedModel = [TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource][i];
            moduleData.graph1ModelDropdown.options.push(new Button({
                x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: seedModel.name + " (" + seedModel.isotope + ")", font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
                onClick: () => {
                    moduleData.graph1.seeds.forEach((seed) => {
                        seed.model = seedModel;
                        seed.airKerma = (seed.model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min);
                        seed.dwellTime = 0.00833;
                    });
                    let selectedSeed = moduleData.graph1.seeds[moduleData.selectedSeed];
                    if (mod === "string of seeds"){
                        moduleData.airKermaSlider.value = selectedSeed ? getValueFromAirKerma(selectedSeed) : 0;
                        moduleData.dwellTimeSlider.value = selectedSeed ? getValueFromDwellTime(selectedSeed) : 0.1;
                    }else{
                        moduleData.graph1AirKermaSlider.value = selectedSeed ? getValueFromAirKerma(selectedSeed) : 0;
                        moduleData.graph1DwellTimeSlider.value = selectedSeed ? getValueFromDwellTime(selectedSeed) : 0.1;
                    }
                    moduleData.graph1ModelDropdown.button.label = seedModel.name + " (" + seedModel.isotope + ")";
                    render = true;
                    resetGraphs = true;
                },
            }));
        }
    }
    // add options to model dropdown menu 2
    if (moduleData.graph2ModelDropdown){
        for (let i = 0; i < 5; i++){
            let seedModel = [TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21,ElektaFlexisource][i];
            moduleData.graph2ModelDropdown.options.push(new Button({
                x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: seedModel.name + " (" + seedModel.isotope + ")", font: "default", color: "black"}, outline: {color: "black", thickness: Math.min(canvas.width,canvas.height) * 0.001},
                onClick: () => {
                    moduleData.graph2.seeds.forEach((seed) => {
                        seed.model = seedModel;
                        seed.airKerma = (seed.model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min);
                        seed.dwellTime = 0.00833;
                    });
                    let selectedSeed = moduleData.graph2.seeds[moduleData.selectedSeed];
                    if (mod === "string of seeds"){
                        moduleData.airKermaSlider.value = selectedSeed ? getValueFromAirKerma(selectedSeed) : 0;
                        moduleData.dwellTimeSlider.value = selectedSeed ? getValueFromDwellTime(selectedSeed) : 0.1;
                    }else{
                        moduleData.graph2AirKermaSlider.value = selectedSeed ? getValueFromAirKerma(selectedSeed) : 0;
                        moduleData.graph2DwellTimeSlider.value = selectedSeed ? getValueFromDwellTime(selectedSeed) : 0.1;
                    }
                    moduleData.graph2ModelDropdown.button.label = seedModel.name + " (" + seedModel.isotope + ")";
                    render = true;
                    resetGraphs = true;
                },
            }));
        }
    }
    // add module selection bar
    moduleData.moduleSelectBar = [];
    for (let i = 0; i < 4; i++){
        moduleData.moduleSelectBar.push(
            new Button({
                x: i * canvas.width / 4,
                y: 0,
                width: canvas.width / 4,
                height: canvas.height * 0.1,
                label: {
                    text: ["Single Seed","String of Seeds","Planar Array of Seeds","Brachytherapy Applicators"][i],
                    font: "default",
                    color: (mod === ["single seed","string of seeds","planar array of seeds","brachytherapy applicators"][i]) ? "white" : "black"
                },
                bgColor: (mod === ["single seed","string of seeds","planar array of seeds","brachytherapy applicators"][i]) ? "black" : "white",
                onClick: () => {
                    let previousModule = module;
                    module = ["single seed","string of seeds","planar array of seeds","brachytherapy applicators"][i];
                    initModule(module,previousModule);
                },
                outline: {
                    color: "black",
                    thickness: Math.min(canvas.width,canvas.height) * 0.001
                }
            })
        );
    }
    adjustFormatting();
    render = true;
    resetGraphs = true;
}
function adjustFormatting(){
    // this function adjusts the formatting of various UI elements to fit the aspect ratio of the screen

    //resize canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (module === "single seed"){
        // resize graph dimenstions
        let graph1 = moduleData.graph1;
        let graph2 = moduleData.graph2;
        let graph1ModelDropdown = moduleData.graph1ModelDropdown.button;
        let graph2ModelDropdown = moduleData.graph2ModelDropdown.button;
        let graph1AirKermaSlider = moduleData.graph1AirKermaSlider;
        let graph2AirKermaSlider = moduleData.graph2AirKermaSlider;
        let graph1DwellTimeSlider = moduleData.graph1DwellTimeSlider;
        let graph2DwellTimeSlider = moduleData.graph2DwellTimeSlider;
        let graph1AirKermaLabel = moduleData.graph1AirKermaLabel;
        let graph2AirKermaLabel = moduleData.graph2AirKermaLabel;
        let graph1DwellTimeLabel = moduleData.graph1DwellTimeLabel;
        let graph2DwellTimeLabel = moduleData.graph2DwellTimeLabel;

        if (canvas.height / canvas.width > 0.8){
            // graphs stacked on top of eachother
            let splitX = canvas.width - Math.min(canvas.width * 0.75, canvas.height * 0.45);

            graph1.x = splitX;
            graph1.y = canvas.height * 0.1;
            graph1.width = Math.min(canvas.width * 0.75, canvas.height * 0.45);
            graph1.height = Math.min(canvas.width * 0.75, canvas.height * 0.45);

            graph2.x = splitX;
            graph2.y = canvas.height * 0.55;
            graph2.width = Math.min(canvas.width * 0.75, canvas.height * 0.45);
            graph2.height = Math.min(canvas.width * 0.75, canvas.height * 0.45);

            graph1ModelDropdown.x = 0;
            graph1ModelDropdown.y = canvas.height * 0.15;
            graph1ModelDropdown.width = splitX * 0.9;
            graph1ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph1ModelDropdown.options.length + 1);
            graph1ModelDropdown.label = graph1.seeds[0].model.name + " (" + graph1.seeds[0].model.isotope + ")";

            graph2ModelDropdown.x = 0;
            graph2ModelDropdown.y = canvas.height * 0.55;
            graph2ModelDropdown.width = splitX * 0.9;
            graph2ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph2ModelDropdown.options.length + 1);
            graph2ModelDropdown.label = graph2.seeds[0].model.name + " (" + graph2.seeds[0].model.isotope + ")";

            graph1AirKermaSlider.x = graph1ModelDropdown.width * 0.1;
            graph1AirKermaSlider.y = graph1ModelDropdown.y + 3 * graph1ModelDropdown.height;
            graph1AirKermaSlider.thickness = canvas.height * 0.01;
            graph1AirKermaSlider.length = graph1ModelDropdown.width * 0.8;

            graph2AirKermaSlider.x = graph2ModelDropdown.width * 0.1;
            graph2AirKermaSlider.y = graph2ModelDropdown.y + 3 * graph2ModelDropdown.height;
            graph2AirKermaSlider.thickness = canvas.height * 0.01;
            graph2AirKermaSlider.length = graph2ModelDropdown.width * 0.8;

            graph1DwellTimeSlider.x = graph1ModelDropdown.width * 0.1;
            graph1DwellTimeSlider.y = graph1ModelDropdown.y + graph1ModelDropdown.height * 5;
            graph1DwellTimeSlider.thickness = canvas.height * 0.01;
            graph1DwellTimeSlider.length = graph1ModelDropdown.width * 0.8;

            graph2DwellTimeSlider.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 0.1;
            graph2DwellTimeSlider.y = graph2ModelDropdown.y + graph2ModelDropdown.height * 5;
            graph2DwellTimeSlider.thickness = canvas.height * 0.01;
            graph2DwellTimeSlider.length = graph2ModelDropdown.width * 0.8;
        }else{
            //graphs side by side
            graph1.x = canvas.width * 0.125;
            graph1.y = canvas.height * 0.1 + (canvas.height * 0.9 - Math.min(canvas.width * 0.375, canvas.height * 0.9)) / 2;
            graph1.width = Math.min(canvas.width * 0.375, canvas.height * 0.9);
            graph1.height = Math.min(canvas.width * 0.375, canvas.height * 0.9);

            graph2.x = canvas.width * 0.625;
            graph2.y = canvas.height * 0.1 + (canvas.height * 0.9 - Math.min(canvas.width * 0.375, canvas.height * 0.9)) / 2;
            graph2.width = Math.min(canvas.width * 0.375, canvas.height * 0.9);
            graph2.height = Math.min(canvas.width * 0.375, canvas.height * 0.9);

            graph1ModelDropdown.x = 0;
            graph1ModelDropdown.y = canvas.height * 0.3;
            graph1ModelDropdown.width = canvas.width * 0.125;
            graph1ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph1ModelDropdown.options.length + 1);
            graph1ModelDropdown.label = graph1.seeds[0].model.name + " (" + graph1.seeds[0].model.isotope + ")";

            graph2ModelDropdown.x = canvas.width * 0.5;
            graph2ModelDropdown.y = canvas.height * 0.3;
            graph2ModelDropdown.width = canvas.width * 0.125;
            graph2ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph2ModelDropdown.options.length + 1);
            graph2ModelDropdown.label = graph2.seeds[0].model.name + " (" + graph2.seeds[0].model.isotope + ")";

            graph1AirKermaSlider.x = graph1ModelDropdown.width * 0.1;
            graph1AirKermaSlider.y = canvas.height * 0.3 + graph1ModelDropdown.height * 3;
            graph1AirKermaSlider.thickness = canvas.height * 0.01;
            graph1AirKermaSlider.length = graph1ModelDropdown.width * 0.8;

            graph2AirKermaSlider.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 0.1;
            graph2AirKermaSlider.y = canvas.height * 0.3 + graph2ModelDropdown.height * 3;
            graph2AirKermaSlider.thickness = canvas.height * 0.01;
            graph2AirKermaSlider.length = graph2ModelDropdown.width * 0.8;

            graph1DwellTimeSlider.x = graph1ModelDropdown.width * 0.1;
            graph1DwellTimeSlider.y = canvas.height * 0.3 + graph1ModelDropdown.height * 5;
            graph1DwellTimeSlider.thickness = canvas.height * 0.01;
            graph1DwellTimeSlider.length = graph1ModelDropdown.width * 0.8;

            graph2DwellTimeSlider.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 0.1;
            graph2DwellTimeSlider.y = canvas.height * 0.3 + graph2ModelDropdown.height * 5;
            graph2DwellTimeSlider.thickness = canvas.height * 0.01;
            graph2DwellTimeSlider.length = graph2ModelDropdown.width * 0.8;
        }
        graph1AirKermaLabel.x = graph1ModelDropdown.x + graph1ModelDropdown.width * 0.1;
        graph1AirKermaLabel.y = graph1ModelDropdown.y + 1.5 * graph1ModelDropdown.height;
        graph1AirKermaLabel.width = graph1ModelDropdown.width * 0.8;
        graph1AirKermaLabel.height = graph1ModelDropdown.height;

        graph2AirKermaLabel.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 0.1;
        graph2AirKermaLabel.y = graph2ModelDropdown.y + 1.5 * graph2ModelDropdown.height;
        graph2AirKermaLabel.width = graph2ModelDropdown.width * 0.8;
        graph2AirKermaLabel.height = graph2ModelDropdown.height;
        
        graph1DwellTimeLabel.x = graph1ModelDropdown.x + graph1ModelDropdown.width * 0.1;
        graph1DwellTimeLabel.y = graph1ModelDropdown.y + 3.5 * graph1ModelDropdown.height;
        graph1DwellTimeLabel.width = graph1ModelDropdown.width * 0.8;
        graph1DwellTimeLabel.height = graph1ModelDropdown.height;

        graph2DwellTimeLabel.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 0.1;
        graph2DwellTimeLabel.y = graph2ModelDropdown.y + 3.5 * graph2ModelDropdown.height;
        graph2DwellTimeLabel.width = graph2ModelDropdown.width * 0.8;
        graph2DwellTimeLabel.height = graph2ModelDropdown.height;
    }
    if (module === "string of seeds"){
        let graph1 = moduleData.graph1;
        let addSeedButton = moduleData.addSeed;
        let deleteSeedButton = moduleData.deleteSeed;
        let seedSpacingSlider = moduleData.seedSpacingSlider;
        let seedSpacingLabel = moduleData.seedSpacingLabel;
        let airKermaSlider = moduleData.airKermaSlider;
        let airKermaLabel = moduleData.airKermaLabel;
        let graph1ModelDropdown = moduleData.graph1ModelDropdown.button
        let dwellTimeSlider = moduleData.dwellTimeSlider;
        let dwellTimeLabel = moduleData.dwellTimeLabel;

        graph1.width = Math.min(canvas.width,(canvas.height * 0.65) * 2.5);
        graph1.height = canvas.height * 0.65;
        graph1.x = (canvas.width - graph1.width) / 2;
        graph1.y = (canvas.height * 0.35) + (canvas.height * 0.65) - graph1.height;

        addSeedButton.x = 0;
        addSeedButton.y = canvas.height * 0.15;
        addSeedButton.width = canvas.width * 0.2;
        addSeedButton.height = canvas.height * 0.05;

        seedSpacingSlider.x = addSeedButton.width * 0.05;
        seedSpacingSlider.y = canvas.height * 0.29;
        seedSpacingSlider.thickness = canvas.height * 0.01;
        seedSpacingSlider.length = addSeedButton.width * 0.9;

        seedSpacingLabel.x = seedSpacingSlider.x;
        seedSpacingLabel.y = (addSeedButton.y + seedSpacingSlider.y) / 2;
        seedSpacingLabel.height = addSeedButton.height;
        seedSpacingLabel.width = addSeedButton.width * 0.9;

        deleteSeedButton.x = canvas.width * 0.5;
        deleteSeedButton.y = canvas.height * 0.15;
        deleteSeedButton.width = canvas.width * 0.2;
        deleteSeedButton.height = canvas.height * 0.05;

        airKermaSlider.x = canvas.width * 0.5;
        airKermaSlider.y = canvas.height * 0.3;
        airKermaSlider.thickness = canvas.height * 0.01;
        airKermaSlider.length = deleteSeedButton.width;

        airKermaLabel.x = deleteSeedButton.x;
        airKermaLabel.y = (deleteSeedButton.y + airKermaSlider.y) / 2;
        airKermaLabel.width = addSeedButton.width;
        airKermaLabel.height = addSeedButton.height;

        dwellTimeSlider.x = canvas.width * 0.75;
        dwellTimeSlider.y = canvas.height * 0.225;
        dwellTimeSlider.thickness = canvas.height * 0.01;
        dwellTimeSlider.length = deleteSeedButton.width;

        dwellTimeLabel.x = dwellTimeSlider.x;
        dwellTimeLabel.y = canvas.height * 0.15;
        dwellTimeLabel.height = deleteSeedButton.height;
        dwellTimeLabel.width = deleteSeedButton.width;

        graph1ModelDropdown.x = canvas.width * 0.25;
        graph1ModelDropdown.y = canvas.height * 0.15;
        graph1ModelDropdown.width = canvas.width * 0.2;
        graph1ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph1ModelDropdown.options.length + 1);
        graph1ModelDropdown.label = graph1.seeds[0].model.name + " (" + graph1.seeds[0].model.isotope + ")";

        graph1.seeds.forEach((seed,ind) => {
            seed.pos.x = (ind * moduleData.seedSpacing) - ((graph1.seeds.length - 1) * moduleData.seedSpacing / 2);
        });
    }
    if (module === "planar array of seeds"){
        let graph1 = moduleData.graph1;
        let graph2 = moduleData.graph2;
        let graph1ModelDropdown = moduleData.graph1ModelDropdown.button;
        let graph1AirKermaSlider = moduleData.graph1AirKermaSlider;
        let graph1DwellTimeSlider = moduleData.graph1DwellTimeSlider;
        let addSeedsGraph1 = moduleData.graph1AddSeeds;
        let removeSeedsGraph1 = moduleData.graph1RemoveSeeds;
        let graph1SeedSpacing = moduleData.graph1SeedSpacingSlider;
        let graph2ModelDropdown = moduleData.graph2ModelDropdown.button;
        let graph2AirKermaSlider = moduleData.graph2AirKermaSlider;
        let graph2DwellTimeSlider = moduleData.graph2DwellTimeSlider;
        let addSeedsGraph2 = moduleData.graph2AddSeeds;
        let removeSeedsGraph2 = moduleData.graph2RemoveSeeds;
        let graph2SeedSpacing = moduleData.graph2SeedSpacingSlider;

        if (canvas.width > canvas.height * 0.9){
            // graphs are side-by side
            graph1.width = Math.min(canvas.height * 0.65, canvas.width * 0.5);
            graph1.height = graph1.width;
            graph1.x = ((canvas.width * 0.5) - graph1.width) / 2;
            graph1.y = canvas.height * 0.35;

            graph2.width = Math.min(canvas.height * 0.65, canvas.width * 0.5);
            graph2.height = graph2.width;
            graph2.x = (canvas.width * 0.5) + ((canvas.width * 0.5) - graph2.width) / 2;
            graph2.y = canvas.height * 0.35;

            graph1ModelDropdown.x = 0;
            graph1ModelDropdown.y = canvas.height * 0.125;
            graph1ModelDropdown.width = moduleData.graph1.width * 0.5;
            graph1ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph1ModelDropdown.options.length + 1);
            graph1ModelDropdown.label = graph1.seeds[0].model.name + " (" + graph1.seeds[0].model.isotope + ")";

            let splitY = graph1ModelDropdown.y + graph1ModelDropdown.height
            let spaceAboveGraph = canvas.height * 0.35 - splitY;

            addSeedsGraph1.x = 0;
            addSeedsGraph1.y = splitY + spaceAboveGraph * 0.1;
            addSeedsGraph1.width = graph1ModelDropdown.width;
            addSeedsGraph1.height = spaceAboveGraph * 0.2;

            removeSeedsGraph1.x = 0;
            removeSeedsGraph1.y = splitY + spaceAboveGraph * 0.4;
            removeSeedsGraph1.width = graph1ModelDropdown.width;
            removeSeedsGraph1.height = spaceAboveGraph * 0.2;

            graph1SeedSpacing.x = graph1ModelDropdown.width * 0.1;
            graph1SeedSpacing.y = splitY + spaceAboveGraph * 0.9;
            graph1SeedSpacing.thickness = canvas.height * 0.01;
            graph1SeedSpacing.length = graph1ModelDropdown.width * 0.8;

            graph1AirKermaSlider.x = graph1ModelDropdown.width * 1.1;
            graph1AirKermaSlider.y = canvas.height * 0.2;
            graph1AirKermaSlider.thickness = canvas.height * 0.01;
            graph1AirKermaSlider.length = graph1ModelDropdown.width * 0.8;

            graph1DwellTimeSlider.x = graph1ModelDropdown.width * 1.1;
            graph1DwellTimeSlider.y = canvas.height * 0.3;
            graph1DwellTimeSlider.thickness = canvas.height * 0.01;
            graph1DwellTimeSlider.length = graph1ModelDropdown.width * 0.8;

            graph2ModelDropdown.x = graph2.x;
            graph2ModelDropdown.y = canvas.height * 0.125;
            graph2ModelDropdown.width = moduleData.graph2.width * 0.5;
            graph2ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph2ModelDropdown.options.length + 1);
            graph2ModelDropdown.label = graph2.seeds[0].model.name + " (" + graph2.seeds[0].model.isotope + ")";

            addSeedsGraph2.x = graph2ModelDropdown.x;
            addSeedsGraph2.y = splitY + spaceAboveGraph * 0.1;
            addSeedsGraph2.width = graph2ModelDropdown.width;
            addSeedsGraph2.height = spaceAboveGraph * 0.2;

            removeSeedsGraph2.x = graph2ModelDropdown.x;
            removeSeedsGraph2.y = splitY + spaceAboveGraph * 0.4;
            removeSeedsGraph2.width = graph2ModelDropdown.width;
            removeSeedsGraph2.height = spaceAboveGraph * 0.2;

            graph2SeedSpacing.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 0.1;
            graph2SeedSpacing.y = splitY + spaceAboveGraph * 0.9;
            graph2SeedSpacing.thickness = canvas.height * 0.01;
            graph2SeedSpacing.length = graph2ModelDropdown.width * 0.8;

            graph2AirKermaSlider.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 1.1;
            graph2AirKermaSlider.y = canvas.height * 0.2;
            graph2AirKermaSlider.thickness = canvas.height * 0.01;
            graph2AirKermaSlider.length = graph2ModelDropdown.width * 0.8;

            graph2DwellTimeSlider.x = graph2ModelDropdown.x + graph2ModelDropdown.width * 1.1;
            graph2DwellTimeSlider.y = canvas.height * 0.3;
            graph2DwellTimeSlider.thickness = canvas.height * 0.01;
            graph2DwellTimeSlider.length = graph2ModelDropdown.width * 0.8;
        }else{
            // graphs are stacked
            graph1.width = Math.min(canvas.width * 0.75, canvas.height * 0.5);
            graph1.height = graph1.width;
            graph1.x = canvas.width * 0.25;
            graph1.y = (canvas.height * 0.1) + ((graph1.height - (canvas.height * 0.45)) / 2);

            graph2.width = Math.min(canvas.width * 0.75, canvas.height * 0.5);
            graph2.height = graph2.width;
            graph2.x = canvas.width * 0.25;
            graph2.y = (canvas.height * 0.55) + ((graph2.height - (canvas.height * 0.45)) / 2);

            graph1ModelDropdown.x = 0;
            graph1ModelDropdown.y = canvas.height * 0.125;
            graph1ModelDropdown.width = graph1.x;
            graph1ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph1ModelDropdown.options.length + 1);
            graph1ModelDropdown.label = graph1.seeds[0].model.name + " (" + graph1.seeds[0].model.isotope + ")";

            let splitY = graph1ModelDropdown.y + graph1ModelDropdown.height
            let spaceToYSplit = graph2.y - splitY;

            addSeedsGraph1.x = 0;
            addSeedsGraph1.y = splitY + spaceToYSplit * 0.05;
            addSeedsGraph1.width = graph1ModelDropdown.width;
            addSeedsGraph1.height = spaceToYSplit * 0.1;

            removeSeedsGraph1.x = 0;
            removeSeedsGraph1.y = splitY + spaceToYSplit * 0.2;
            removeSeedsGraph1.width = graph1ModelDropdown.width;
            removeSeedsGraph1.height = spaceToYSplit * 0.1;

            graph1SeedSpacing.x = graph1ModelDropdown.width * 0.1;
            graph1SeedSpacing.y = splitY + spaceToYSplit * 0.50;
            graph1SeedSpacing.thickness = canvas.height * 0.01;
            graph1SeedSpacing.length = graph1ModelDropdown.width * 0.8;

            graph1AirKermaSlider.x = graph1ModelDropdown.width * 0.1;
            graph1AirKermaSlider.y = splitY + spaceToYSplit * 0.65;
            graph1AirKermaSlider.thickness = canvas.height * 0.01;
            graph1AirKermaSlider.length = graph1ModelDropdown.width * 0.8;

            graph1DwellTimeSlider.x = graph1ModelDropdown.width * 0.1;
            graph1DwellTimeSlider.y = splitY + spaceToYSplit * 0.80;
            graph1DwellTimeSlider.thickness = canvas.height * 0.01;
            graph1DwellTimeSlider.length = graph1ModelDropdown.width * 0.8;

            graph2ModelDropdown.x = 0;
            graph2ModelDropdown.y = canvas.height * 0.625;
            graph2ModelDropdown.width = graph2.x;
            graph2ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph2ModelDropdown.options.length + 1);
            graph2ModelDropdown.label = graph2.seeds[0].model.name + " (" + graph2.seeds[0].model.isotope + ")";

            splitY = graph2ModelDropdown.y + graph2ModelDropdown.height
            spaceToYSplit = canvas.height - splitY;

            addSeedsGraph2.x = 0;
            addSeedsGraph2.y = splitY + spaceToYSplit * 0.05;
            addSeedsGraph2.width = graph2ModelDropdown.width;
            addSeedsGraph2.height = spaceToYSplit * 0.1;

            removeSeedsGraph2.x = 0;
            removeSeedsGraph2.y = splitY + spaceToYSplit * 0.2;
            removeSeedsGraph2.width = graph2ModelDropdown.width;
            removeSeedsGraph2.height = spaceToYSplit * 0.1;

            graph2SeedSpacing.x = graph2ModelDropdown.width * 0.1;
            graph2SeedSpacing.y = splitY + spaceToYSplit * 0.50;
            graph2SeedSpacing.thickness = canvas.height * 0.01;
            graph2SeedSpacing.length = graph2ModelDropdown.width * 0.8;

            graph2AirKermaSlider.x = graph2ModelDropdown.width * 0.1;
            graph2AirKermaSlider.y = splitY + spaceToYSplit * 0.65;
            graph2AirKermaSlider.thickness = canvas.height * 0.01;
            graph2AirKermaSlider.length = graph2ModelDropdown.width * 0.8;

            graph2DwellTimeSlider.x = graph2ModelDropdown.width * 0.1;
            graph2DwellTimeSlider.y = splitY + spaceToYSplit * 0.80;
            graph2DwellTimeSlider.thickness = canvas.height * 0.01;
            graph2DwellTimeSlider.length = graph2ModelDropdown.width * 0.8;
        }

        let planeSize =  Math.sqrt(moduleData.graph1.seeds.length)
        moduleData.graph1.seeds.forEach((seed,ind) => {
            seed.pos.x = moduleData.graph1SeedSpacing * (ind % planeSize - (planeSize - 1) / 2);
            seed.pos.y = moduleData.graph1SeedSpacing * (Math.floor(ind / planeSize) - (planeSize - 1) / 2);
        });

        planeSize =  Math.sqrt(moduleData.graph2.seeds.length)
        moduleData.graph2.seeds.forEach((seed,ind) => {
            seed.pos.x = moduleData.graph2SeedSpacing * (ind % planeSize - (planeSize - 1) / 2);
            seed.pos.y = moduleData.graph2SeedSpacing * (Math.floor(ind / planeSize) - (planeSize - 1) / 2);
        });
    }
    if (module === "brachytherapy applicators"){
        let graph1 = moduleData.graph1;
        let graph2 = moduleData.graph2;
        let graph3 = moduleData.graph3;
        let resetDwellTimes = moduleData.resetDwellTimes;
        let graphModelDropdown = moduleData.graphModelDropdown.button;
        let applicatorModelDropdown = moduleData.applicatorModelDropdown.button;

        let graph1Dimensions = {
            width: getMax(graph1.xTicks) - getMin(graph1.xTicks),
            height: getMax(graph1.yTicks) - getMin(graph1.yTicks)
        }
        let graph2Dimensions = {
            width: getMax(graph2.xTicks) - getMin(graph2.xTicks),
            height: getMax(graph2.yTicks) - getMin(graph2.yTicks)
        }
        let graph3Dimensions = {
            width: getMax(graph3.xTicks) - getMin(graph3.xTicks),
            height: getMax(graph3.yTicks) - getMin(graph3.yTicks)
        }

        let format;
        if (moduleData.applicatorModel.name === "Vaginal Cylinder"){
            // get format based on aspect ratio of graph1
            format = (Math.abs((graph1Dimensions.height / graph1Dimensions.width) - 1.2 * (canvas.height / canvas.width))
                < Math.abs((graph1Dimensions.height / graph1Dimensions.width) - 0.75 * (canvas.height / canvas.width)))
                    ? "sideUI" : "topUI";
            
            // stretch graph according to format
            let graph1Stretchfactor;
            if (format === "sideUI"){
                graph1Stretchfactor = Math.min((canvas.width * 0.75) / graph1Dimensions.width, (canvas.height * 0.9) / graph1Dimensions.height);
            }else{
                graph1Stretchfactor = Math.min(canvas.width / graph1Dimensions.width, (canvas.height * 0.75) / graph1Dimensions.height);
            }
            // apply stretch
            graph1.width = graph1Stretchfactor * graph1Dimensions.width;
            graph1.height = graph1Stretchfactor * graph1Dimensions.height;

            moduleData.graph1refPoint = {
                x: (moduleData.applicatorModel.diameter / 2) + 0.5,
                y: moduleData.applicatorModel.length / 2,
                z: 0,
            };
        }
        if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
            // get format based on aspect ratio of graph1
            format = (Math.abs((graph1Dimensions.height / graph1Dimensions.width) - 3.6 * (canvas.height / canvas.width))
                < Math.abs((graph1Dimensions.height / graph1Dimensions.width) - 2.25 * (canvas.height / canvas.width)))
                    ? "sideUI" : "topUI";
            
            // stretch graphs according to format
            let graph1Stretchfactor;
            let graph2Stretchfactor;
            let graph3Stretchfactor;
            if (format === "sideUI"){
                graph1Stretchfactor = Math.min((canvas.width * 0.25) / graph1Dimensions.width, (canvas.height * 0.9) / graph1Dimensions.height);
                graph2Stretchfactor = Math.min((canvas.width * 0.25) / graph2Dimensions.width, (canvas.height * 0.9) / graph2Dimensions.height);
                graph2Stretchfactor = Math.min((canvas.width * 0.25) / graph3Dimensions.width, (canvas.height * 0.9) / graph3Dimensions.height);
            }else{
                graph1Stretchfactor = Math.min((canvas.width / 3) / graph1Dimensions.width, (canvas.height * 0.75) / graph1Dimensions.height);
                graph2Stretchfactor = Math.min((canvas.width / 3) / graph2Dimensions.width, (canvas.height * 0.75) / graph2Dimensions.height);
                graph3Stretchfactor = Math.min((canvas.width / 3) / graph3Dimensions.width, (canvas.height * 0.75) / graph3Dimensions.height);
            }

            // apply stretch
            graph1.width = graph1Stretchfactor * graph1Dimensions.width;
            graph1.height = graph1Stretchfactor * graph1Dimensions.height;
            graph2.width = graph2Stretchfactor * graph2Dimensions.width;
            graph2.height = graph2Stretchfactor * graph2Dimensions.height;
            graph3.width = graph3Stretchfactor * graph3Dimensions.width;
            graph3.height = graph3Stretchfactor * graph3Dimensions.height;

            moduleData.graph1refPoint = {x: 2,y: 2,z: 0};
            moduleData.graph2refPoint = {x: 2,y: 2,z: 0};
            moduleData.graph3refPoint = {x: 2,y: 2,z: 0};
        }
        if (moduleData.applicatorModel.name === "Tandem/Ring"){
            // get format based on aspect ratio of graph1
            format = (Math.abs((graph1Dimensions.height / graph1Dimensions.width) - 2.4 * (canvas.height / canvas.width))
                < Math.abs((graph1Dimensions.height / graph1Dimensions.width) - 1.5 * (canvas.height / canvas.width)))
                    ? "sideUI" : "topUI";
            
            // stretch graphs according to format
            let graph1Stretchfactor;
            let graph2Stretchfactor;
            if (format === "sideUI"){
                graph1Stretchfactor = Math.min((canvas.width * 0.375) / graph1Dimensions.width, (canvas.height * 0.9) / graph1Dimensions.height);
                graph2Stretchfactor = Math.min((canvas.width * 0.375) / graph2Dimensions.width, (canvas.height * 0.9) / graph2Dimensions.height);
            }else{
                graph1Stretchfactor = Math.min((canvas.width * 0.5) / graph1Dimensions.width, (canvas.height * 0.75) / graph1Dimensions.height);
                graph2Stretchfactor = Math.min((canvas.width * 0.5) / graph2Dimensions.width, (canvas.height * 0.75) / graph2Dimensions.height);
            }

            graph1.width = graph1Stretchfactor * graph1Dimensions.width;
            graph1.height = graph1Stretchfactor * graph1Dimensions.height;
            graph2.width = graph2Stretchfactor * graph2Dimensions.width;
            graph2.height = graph2Stretchfactor * graph2Dimensions.height;

            moduleData.graph1refPoint = {x: 2,y: 2.2,z: 0};
            moduleData.graph2refPoint = {x: 2,y: 2.2,z: 0};
        }
        if (format === "sideUI"){
            if (moduleData.applicatorModel.name === "Vaginal Cylinder"){
                graph1.x = (canvas.width * 0.25) + ((canvas.width * 0.75) - graph1.width) / 2;
                graph1.y = canvas.height * 0.1 + ((canvas.height * 0.9) - graph1.height) / 2;
            }
            if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
                graph1.x = (canvas.width * 0.25) + ((canvas.width * 0.25) - graph1.width) / 2;
                graph1.y = canvas.height * 0.1 + ((canvas.height * 0.9) - graph1.height) / 2;
                graph2.x = (canvas.width * 0.5) + ((canvas.width * 0.25) - graph2.width) / 2;
                graph2.y = canvas.height * 0.1 + ((canvas.height * 0.9) - graph2.height) / 2;
                graph3.x = (canvas.width * 0.75) + ((canvas.width * 0.25) - graph3.width) / 2;
                graph3.y = canvas.height * 0.1 + ((canvas.height * 0.9) - graph3.height) / 2;
            }
            if (moduleData.applicatorModel.name === "Tandem/Ring"){
                graph1.x = (canvas.width * 0.25) + ((canvas.width * 0.375) - graph1.width) / 2;
                graph1.y = canvas.height * 0.1 + ((canvas.height * 0.9) - graph1.height) / 2;
                graph2.x = (canvas.width * 0.625) + ((canvas.width * 0.375) - graph1.width) / 2;
                graph2.y = canvas.height * 0.1 + ((canvas.height * 0.9) - graph2.height) / 2;
            }

            resetDwellTimes.width = canvas.width * 0.25;
            resetDwellTimes.height = canvas.height * 0.05;
            resetDwellTimes.x = 0;
            resetDwellTimes.y = canvas.height * 0.2;

            graphModelDropdown.x = 0;
            graphModelDropdown.y = canvas.height * 0.3;
            graphModelDropdown.width = canvas.width * 0.25;
            graphModelDropdown.height = canvas.height * 0.05;
            graphModelDropdown.label = graph1.seeds[0].model.name + " (" + graph1.seeds[0].model.isotope + ")";

            applicatorModelDropdown.x = 0;
            applicatorModelDropdown.y = canvas.height * 0.4;
            applicatorModelDropdown.width = canvas.width * 0.25;
            applicatorModelDropdown.height = canvas.height * 0.05; //label is reolved at the bottom of this if statement
        }else{
            if (moduleData.applicatorModel.name === "Vaginal Cylinder"){
                graph1.x = (canvas.width - graph1.width) / 2;
                graph1.y = canvas.height * 0.25 + ((canvas.height * 0.75) - graph1.height) / 2;
            }
            if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
                graph1.x = ((canvas.width / 3) - graph1.width) / 2;
                graph1.y = canvas.height * 0.1 + ((canvas.height * 0.9) - graph1.height) / 2;
                graph2.x = (canvas.width / 3) + ((canvas.width / 3) - graph2.width) / 2;
                graph2.y = canvas.height * 0.1 + ((canvas.height * 0.9) - graph2.height) / 2;
                graph3.x = 2 * (canvas.width / 3) + ((canvas.width / 3) - graph3.width) / 2;
                graph3.y = canvas.height * 0.1 + ((canvas.height * 0.9) - graph3.height) / 2;
            }
            if (moduleData.applicatorModel.name === "Tandem/Ring"){
                graph1.x = ((canvas.width / 2) - graph1.width) / 2;
                graph1.y = canvas.height * 0.25 + ((canvas.height * 0.75) - graph1.height) / 2;
                graph2.x = (canvas.width / 2) + ((canvas.width / 2) - graph2.width) / 2;
                graph2.y = canvas.height * 0.25 + ((canvas.height * 0.75) - graph2.height) / 2;
            }

            resetDwellTimes.width = canvas.width * 0.2;
            resetDwellTimes.height = canvas.height * 0.05;
            resetDwellTimes.x = canvas.width * 0.025;
            resetDwellTimes.y = canvas.height * 0.2;

            graphModelDropdown.x = canvas.width * 0.275;
            graphModelDropdown.y = canvas.height * 0.2;
            graphModelDropdown.width = canvas.width * 0.2;
            graphModelDropdown.height = canvas.height * 0.05;
            graphModelDropdown.label = graph1.seeds[0].model.name + " (" + graph1.seeds[0].model.isotope + ")";

            applicatorModelDropdown.x = canvas.width * 0.525;
            applicatorModelDropdown.y = canvas.height * 0.2;
            applicatorModelDropdown.width = canvas.width * 0.45;
            applicatorModelDropdown.height = canvas.height * 0.05;
        }

        if (moduleData.applicatorModel.name === "Vaginal Cylinder"){
            applicatorModelDropdown.label = "Vaginal Cylinder: " + moduleData.applicatorModel.length * 10 + "mm length, " + moduleData.applicatorModel.diameter + "cm diameter";
        }
        if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
            applicatorModelDropdown.label = "Tandem/Ovoids: " + moduleData.applicatorModel.length * 10 + "mm Tandem, " + moduleData.applicatorModel.angle + "°, " + moduleData.applicatorModel.ovoidDiameter + "cm Ovoids";
        }
        if (moduleData.applicatorModel.name === "Tandem/Ring"){
            applicatorModelDropdown.label = "Tandem/Ring: " + moduleData.applicatorModel.length * 10 + "mm Tandem, " + moduleData.applicatorModel.angle + "°, " + moduleData.applicatorModel.ringDiameter + "cm Ring";
        }

        moduleData.applicatorModelDropdown.options.forEach(({button: opt},ind) => {
            opt.x = applicatorModelDropdown.x;
            opt.y = applicatorModelDropdown.y + applicatorModelDropdown.height * (ind + 1);
            opt.width = applicatorModelDropdown.width / 4;
            opt.height = applicatorModelDropdown.height;
        });

        let fontSizes = [];
        moduleData.applicatorModelDropdown.options.forEach(({button: button}) => fontSizes.push(getFontSize(button.width,button.height,button.label,(size) => `${size}px monospace`)));
        moduleData.applicatorModelDropdown.options.forEach(({button: opt}) => {opt.font = getMin(fontSizes) + "px monospace";});

        formatApplicatorTypeDropdown(moduleData.applicatorModelDropdown,0);

        adjustApplicatorRenderer(moduleData.graph1,moduleData.applicatorModel,{refPoint: "graph1refPoint", drawFunction: "graph1DrawApplicator", boundingBox: moduleData.divBoundGraph1, view: ((moduleData.applicatorModel.name === "Tandem/Ring") ? "side" : "front")});
        if (!(moduleData.applicatorModel.name === "Vaginal Cylinder")){
            adjustApplicatorRenderer(moduleData.graph2,moduleData.applicatorModel,{refPoint: "graph2refPoint", drawFunction: "graph2DrawApplicator", boundingBox: moduleData.divBoundGraph2, view: ((moduleData.applicatorModel.name === "Tandem/Ring") ? "top" : "side")});
        }
        if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
            adjustApplicatorRenderer(moduleData.graph3,moduleData.applicatorModel,{refPoint: "graph3refPoint", drawFunction: "graph3DrawApplicator", boundingBox: moduleData.divBoundGraph3, view: "top"});
        }

        moduleData.graphModelDropdown.options.forEach((opt,ind) => {
            opt.x = graphModelDropdown.x;
            opt.y = graphModelDropdown.y + graphModelDropdown.height * (ind + 1);
            opt.width = graphModelDropdown.width;
            opt.height = graphModelDropdown.height;
        });

        fontSizes = [];
        moduleData.graphModelDropdown.options.forEach((button) => fontSizes.push(getFontSize(button.width,button.height,button.label,(size) => `${size}px monospace`)));
        moduleData.graphModelDropdown.options.forEach((opt) => {
            opt.font = getMin(fontSizes) * 0.8 + "px monospace";
        });
    }
    if (moduleData.graph1ModelDropdown){
        moduleData.graph1ModelDropdown.options.forEach((opt,ind) => {
            opt.x = moduleData.graph1ModelDropdown.button.x;
            opt.y = moduleData.graph1ModelDropdown.button.y + moduleData.graph1ModelDropdown.button.height * (ind + 1);
            opt.width = moduleData.graph1ModelDropdown.button.width;
            opt.height = moduleData.graph1ModelDropdown.button.height;
        });

        let fontSizes = [];
        moduleData.graph1ModelDropdown.options.forEach((button) => fontSizes.push(getFontSize(button.width,button.height,button.label,(size) => `${size}px monospace`)));
        moduleData.graph1ModelDropdown.options.forEach((opt) => {
            opt.font = getMin(fontSizes) * 0.8 + "px monospace";
        });
    }
    if (moduleData.graph2ModelDropdown){
        moduleData.graph2ModelDropdown.options.forEach((opt,ind) => {
            opt.x = moduleData.graph2ModelDropdown.button.x;
            opt.y = moduleData.graph2ModelDropdown.button.y + moduleData.graph2ModelDropdown.button.height * (ind + 1);
            opt.width = moduleData.graph2ModelDropdown.button.width;
            opt.height = moduleData.graph2ModelDropdown.button.height;
        });

        let fontSizes = [];
        moduleData.graph2ModelDropdown.options.forEach((button) => fontSizes.push(getFontSize(button.width,button.height,button.label,(size) => `${size}px monospace`)));
        moduleData.graph2ModelDropdown.options.forEach((opt) => {
            opt.font = getMin(fontSizes) * 0.8 + "px monospace";
        });
    }

    //logic to resize module selector
    moduleData.moduleSelectBar.forEach((button,ind) => {
        button.width = canvas.width / 4;
        button.height = canvas.height * 0.1;
        button.x = ind * canvas.width / 4;
        button.outlineThickness = 0.005 * Math.min(canvas.width,canvas.height);
    });

    let fontSizes = [];
    moduleData.moduleSelectBar.forEach((button) => fontSizes.push(getFontSize(button.width,button.height,button.label,(size) => `${size}px monospace`)));
    moduleData.moduleSelectBar.forEach((opt) => {
        opt.font = getMin(fontSizes) * 0.8 + "px monospace";
    });
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
    moduleData.moduleSelectBar.forEach((button) => {
        button.checkClicked();
    });
    if (module === "single seed"){
        if (!moduleData.graph1ModelDropdown.showing){
            moduleData.graph1AirKermaLabel.checkClicked();
            moduleData.graph1DwellTimeLabel.checkClicked();
        }
        if (!moduleData.graph2ModelDropdown.showing){
            moduleData.graph2AirKermaLabel.checkClicked();
            moduleData.graph2DwellTimeLabel.checkClicked();
        }
        moduleData.graph1ModelDropdown.checkDropdownClicked();
        moduleData.graph2ModelDropdown.checkDropdownClicked();
    }
    if (module === "string of seeds"){
        moduleData.addSeed.checkClicked();
        moduleData.deleteSeed.checkClicked();
        moduleData.seedSpacingLabel.checkClicked();
        moduleData.airKermaLabel.checkClicked();
        moduleData.dwellTimeLabel.checkClicked();
        moduleData.refPointLabel.checkClicked();
    }
    if (module === "planar array of seeds"){
        if (!moduleData.graph1ModelDropdown.showing){
            moduleData.graph1AddSeeds.checkClicked();
            moduleData.graph1RemoveSeeds.checkClicked();
        }
        if (!moduleData.graph2ModelDropdown.showing){
            moduleData.graph2AddSeeds.checkClicked();
            moduleData.graph2RemoveSeeds.checkClicked();
        }
        moduleData.graph2ModelDropdown.checkDropdownClicked();
        checkSeedClicked(moduleData.graph2,moduleData.divBoundGraph2,"graph2");
    }
    if ((module === "string of seeds") || (module === "planar array of seeds")){
        moduleData.graph1ModelDropdown.checkDropdownClicked();
        checkSeedClicked(moduleData.graph1,moduleData.divBoundGraph1,"graph1");
    }
    if (module === "brachytherapy applicators"){
        moduleData.resetDwellTimes.checkClicked();
        if (!moduleData.graphModelDropdown.showing && moduleData.applicatorModelDropdown.checkDropdownClicked()){
            adjustFormatting();
        }
        moduleData.graphModelDropdown.checkDropdownClicked();
        checkSeedClicked(moduleData.graph1,moduleData.divBoundGraph1,"graph1");
        if (moduleData.applicatorModel.name != "Vaginal Cylinder"){
            checkSeedClicked(moduleData.graph2,moduleData.divBoundGraph2,"graph2");
        }
        if (moduleData.applicatorModel.name === "Tandem/Ovoids"){
            checkSeedClicked(moduleData.graph3,moduleData.divBoundGraph3,"graph3");
        }
    }
});
addEventListener("mouseup",function (e){
	updateMousePos(e);
	mouse.down = false;
});
addEventListener("keydown",function (e) {
    let selectedGraph;
    if (moduleData.graph2){
        if ((mouse.x > moduleData.divBoundGraph1.x) && (mouse.x < moduleData.divBoundGraph1.x + moduleData.divBoundGraph1.width)
            && (mouse.y > moduleData.divBoundGraph1.y) && (mouse.y < moduleData.divBoundGraph1.y + moduleData.divBoundGraph1.height)){
            selectedGraph = moduleData.graph1;
        }
        if ((mouse.x > moduleData.divBoundGraph2.x) && (mouse.x < moduleData.divBoundGraph2.x + moduleData.divBoundGraph2.width)
            && (mouse.y > moduleData.divBoundGraph2.y) && (mouse.y < moduleData.divBoundGraph2.y + moduleData.divBoundGraph2.height)){
            selectedGraph = moduleData.graph2;
        }
        if (moduleData.graph3){
            if ((mouse.x > moduleData.divBoundGraph3.x) && (mouse.x < moduleData.divBoundGraph3.x + moduleData.divBoundGraph3.width)
                && (mouse.y > moduleData.divBoundGraph3.y) && (mouse.y < moduleData.divBoundGraph3.y + moduleData.divBoundGraph3.height)){
                selectedGraph = moduleData.graph3;
            }
        }
        if ((module === "brachytherapy applicators") && (moduleData.applicatorModel.name === "Vaginal Cylinder")){
            selectedGraph = moduleData.graph1;
        }
    }else{
        selectedGraph = moduleData.graph1;
    }
    if (typeof selectedGraph != "undefined"){
        if (e.key === "ArrowDown"){
            selectedGraph.zSlice = Math.max(selectedGraph.zSlice - 0.05,Math.max(getMin(selectedGraph.xTicks),getMin(selectedGraph.yTicks)));
            render = true;
        }
        if (e.key === "ArrowUp"){
            selectedGraph.zSlice = Math.min(selectedGraph.zSlice + 0.05,Math.min(getMax(selectedGraph.xTicks),getMax(selectedGraph.yTicks)));
            render = true;
        }
    }
    if (module === "single seed"){
        moduleData.graph1AirKermaLabel.checkEntry(e.key);
        moduleData.graph2AirKermaLabel.checkEntry(e.key);
        moduleData.graph1DwellTimeLabel.checkEntry(e.key);
        moduleData.graph2DwellTimeLabel.checkEntry(e.key);
    }
    if (module === "string of seeds"){
        moduleData.seedSpacingLabel.checkEntry(e.key);
        moduleData.airKermaLabel.checkEntry(e.key);
        moduleData.dwellTimeLabel.checkEntry(e.key);
        moduleData.refPointLabel.checkEntry(e.key);
    }
})
function updateMousePos(e){
	mouse.x = e.clientX + scrollPos.x;
	mouse.y = e.clientY + scrollPos.y;
}

function magnitude(vec){
    return Math.sqrt(vec.x ** 2 + vec.y ** 2 + vec.z ** 2);
}
function interpolateTable(dataArr,spacingArr,ind){
    let neighborHigh = Math.min(getInterpolationIndex(spacingArr,ind),spacingArr.length);
    let neighborLow = Math.max(neighborHigh - 1,0);
    if (neighborHigh == neighborLow) {
        return dataArr[neighborLow];
    }
    return (
        lerp(
            dataArr[neighborLow],
            dataArr[neighborHigh],
            (ind - spacingArr[neighborLow]) / (spacingArr[neighborHigh] - spacingArr[neighborLow]))
    );
}
function biliniarInterpolateTable(data,xSpacing,ySpacing,x,y){
    let x2 = Math.min(getInterpolationIndex(xSpacing,x),xSpacing.length);
    let x1 = Math.max(x2 - 1,0);
    let y2 = Math.min(getInterpolationIndex(ySpacing,y),ySpacing.length);
    let y1 = Math.max(y2 - 1,0);
    return lerp(
        lerp(data[x1][y1],data[x2][y1],(x - xSpacing[x1]) / (xSpacing[x2] - xSpacing[x1])),
        lerp(data[x1][y2],data[x2][y2],(x - xSpacing[x1]) / (xSpacing[x2] - xSpacing[x1])),
        (y - ySpacing[y1]) / (ySpacing[y2] - ySpacing[y1])
    );
}
function getInterpolationIndex(spacingArr,ind){
    for (let i = 0; i < spacingArr.length; i++){
        if (spacingArr[i] >= ind){
            return i;
        }
    }
    return spacingArr.length - 1;
}
function lerp(a,b,t){
    return (a == b) ? a : (a + (t * (b - a)));
}
function getFontSize(width,height,label,font){
    if (!width || !height || !label || !font){return 0}
    let metrics = ctx.measureText(label);
    let size = {min: 0, max: 200};
    let checkFont = () => {
        ctx.font = font((size.min + size.max) / 2);
        metrics = ctx.measureText(label);
        return ((metrics.actualBoundingBoxRight + metrics.actualBoundingBoxLeft) < width) && ((metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) < height)
    };
    for (let i = 0; (i < 10) || !checkFont(); i++) { // binary search for best font size based on width and height intil i > 10 and checkFont() is true
        if (checkFont()){
            size.min = (size.min + size.max) / 2;
        }else{
            size.max = (size.min + size.max) / 2;
        }
    }
    return (size.min + size.max) / 2;
}
function getMin(arr){
    return arr.reduce((minVal,curVal) => ((curVal < minVal) ? curVal : minVal),arr[0]);
}
function getMax(arr){
    return arr.reduce((minVal,curVal) => ((curVal > minVal) ? curVal : minVal),arr[0]);
}
function graphToScreenPos(pos,graph,boundingBox){
    return {
        x: boundingBox.x + ((pos.x - getMin(graph.xTicks)) / (getMax(graph.xTicks) - getMin(graph.xTicks))) * boundingBox.width,
        y: boundingBox.y + boundingBox.height - ((pos.y - getMin(graph.yTicks)) / (getMax(graph.yTicks) - getMin(graph.yTicks))) * boundingBox.height,
    };
}
function getAirKermaFromSlider(slider,source){
    if (source.model.HDRsource){
        return airKermaSliderLimits.HDR.min + slider.value * (airKermaSliderLimits.HDR.max - airKermaSliderLimits.HDR.min);
    }
    return airKermaSliderLimits.LDR.min + slider.value * (airKermaSliderLimits.LDR.max - airKermaSliderLimits.LDR.min);
}
function getDwellTimeFromSlider(slider){
    return slider.value * 0.0833333333333; // slider from 30 seconds to 10 minutes
}
function getValueFromAirKerma(seed){
    return seed.model.HDRsource ?
            ((seed.airKerma - airKermaSliderLimits.HDR.min) / (airKermaSliderLimits.HDR.max - airKermaSliderLimits.HDR.min))
            : 
            ((seed.airKerma - airKermaSliderLimits.LDR.min) / (airKermaSliderLimits.LDR.max - airKermaSliderLimits.LDR.min))
}
function getValueFromDwellTime(seed){
    return seed.dwellTime / 0.0833333333333;
}
function convertUnit(unit,newUnit){
    return parseFloat(unit.split(" ")[0]) * conversionFactors[newUnit][unit.split(" ")[1]];
}
function checkSeedClicked(graph,boundingBox,graphName){
    let seedRadius = Math.min(canvas.width,canvas.height * 0.9) * 0.01; // the radius is double the actual size of the drawn dots for ease of selection
    let ind = graph.seeds.findIndex((seed) => {
        let seedScreenPos = graphToScreenPos(seed.pos,graph,boundingBox);
        return (Math.sqrt((mouse.x - seedScreenPos.x)**2 + (mouse.y - seedScreenPos.y)**2) <= seedRadius);
    });
    ind = graph.seeds.reduce((closestSeed,seed,currInd) => {
        let seedScreenPos = graphToScreenPos(graph.perspective(seed.pos),graph,boundingBox);
        let dist = Math.sqrt((mouse.x - seedScreenPos.x)**2 + (mouse.y - seedScreenPos.y)**2);
        if ((dist <= seedRadius) && ((closestSeed.ind == -1) || (dist < closestSeed.dist))){
            return {dist: dist, ind: currInd};
        }else{
            return closestSeed;
        }
    },{dist: 0, ind: -1}).ind;
    let seed = graph.seeds[ind];
    if (seed) {
        if (moduleData.selectedSeed == ind){
            moduleData.selectedSeed = -1;
        }else{
            moduleData.selectedSeed = ind;
            moduleData.selectedGraph = graphName;
        }
        if (module === "string of seeds"){
            moduleData.airKermaSlider.value = getValueFromAirKerma(seed);
            moduleData.dwellTimeSlider.value = getValueFromDwellTime(seed);
        }
        if (module === "planar array of seeds"){
            moduleData[graphName + "AirKermaSlider"].value = getValueFromAirKerma(seed);
            moduleData[graphName + "DwellTimeSlider"].value = getValueFromDwellTime(seed);
        }
        if (module === "brachytherapy applicators"){
            moduleData.graphDwellTimeSlider.value = getValueFromDwellTime(seed);
        }
    }
}
function drawSeed(seed,graph,bounds){
    let centerPos = graphToScreenPos(seed.pos,graph,bounds);
    let cornerPos = graphToScreenPos({x: (seed.pos.x - (seed.model.sourceLength / 2)), y: (seed.pos.y + (seed.model.sourceDiameter / 2))},graph,bounds);
    ctx.fillStyle = "rgb(58, 58, 58)";
    ctx.beginPath();
    ctx.roundRect(cornerPos.x,cornerPos.y,2 * (centerPos.x - cornerPos.x),2 * (centerPos.y - cornerPos.y),Math.min(centerPos.x - cornerPos.x,centerPos.y - cornerPos.y));
    ctx.fill();
}
function drawGraphSeeds(graph,bound,name){
    let seedRadius = Math.min(canvas.width,canvas.height * 0.9) * 0.005;
    ctx.lineWidth = seedRadius * 0.5;
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.strokeStyle = "rgb(255, 255, 255)";
    graph.seeds.forEach((seed) => {
        let seedPos = graph.perspective(seed.pos);
        if ((seedPos.x <= getMax(graph.xTicks)) && (seedPos.x >= getMin(graph.xTicks))
            && (seedPos.y <= getMax(graph.yTicks)) && (seedPos.y >= getMin(graph.yTicks))){
            let screenPos = graphToScreenPos({x: seedPos.x,y: seedPos.y},graph,bound);
            ctx.beginPath();
            ctx.arc(screenPos.x,screenPos.y,seedRadius,0,2 * Math.PI);
            ctx.stroke();
            ctx.fill();
        }
    });
    if ((typeof moduleData.selectedSeed != "undefined") && (moduleData.selectedSeed != -1) && ((module === "brachytherapy applicators") || (moduleData.selectedGraph === name))){
        ctx.fillStyle = "rgb(169, 255, 103)";
        let screenPos = graphToScreenPos(graph.perspective(graph.seeds[moduleData.selectedSeed].pos),graph,bound);
        ctx.beginPath();
        ctx.arc(screenPos.x,screenPos.y,seedRadius,0,2 * Math.PI);
        ctx.fill();
    }
}
function adjustApplicatorGraphFormat(graph,model,{refPoint: refPoint,drawFunction: drawFunction,boundingBox: boundingBox, view: view}){
    let seedModel = (moduleData.graph1.seeds.length > 0) ? moduleData.graph1.seeds[0].model : GammaMedHDRPlus;
    let airKerma = airKermaSliderLimits.HDR.min;
    if (model.name === "Vaginal Cylinder"){
        let adjustedSeeds = [];
        for (let i = model.length - 0.7; i >= 0; i -= 1){
            adjustedSeeds.push(new Seed({x: 0, y: i, z: 0},{phi: Math.PI / 2, theta: 0},seedModel,airKerma,0.00833));
        }
        graph.seeds = adjustedSeeds;
        let xTick = [];
        for (let i = -model.diameter / 2 - 1; i <= model.diameter / 2 + 1; i += 0.125){xTick.push(i);}
        let yTick = [];
        for (let i = -2; i <= model.length + 2; i += 0.125){yTick.push(i);}
        graph.xTicks = xTick;
        graph.yTicks = yTick;
        moduleData[refPoint] = {x: model.diameter / 2 + 0.5, y: (model.length - 0.7) / 2, z: 0};
    }
    if (model.name === "Tandem/Ovoids"){
        let adjustedSeeds = [];
        for (let i = model.length - 0.7; i >= 0; i -= 1){
            adjustedSeeds.push(new Seed({x: 0, y: i, z: 0},{phi: Math.PI / 2, theta: 0},seedModel,airKerma,0.00833));
        }
        for (let i = -1; i <= 1; i += 0.5){
            adjustedSeeds.push(new Seed({x: -model.ovoidDiameter / 2, y: -model.ovoidDiameter / 2, z: i},{phi: 0, theta: Math.PI / 2},seedModel,airKerma,0.00833));
            adjustedSeeds.push(new Seed({x: model.ovoidDiameter / 2, y: -model.ovoidDiameter / 2, z: i},{phi: 0, theta: Math.PI / 2},seedModel,airKerma,0.00833));
        }
        graph.seeds = adjustedSeeds;
        let xTick = [];
        for (let i = -model.ovoidDiameter - 2; i <= model.ovoidDiameter + 2; i += 0.125){xTick.push(i);}
        let yTick = [];
        for (let i = -model.ovoidDiameter - 2; i <= model.length + 2; i += 0.125){yTick.push(i);}
        graph.xTicks = xTick;
        graph.yTicks = yTick;
        moduleData[refPoint] = {x: 2, y: 0, z: 0};
    }
    if (model.name === "Tandem/Ring"){
        let adjustedSeeds = [];
        for (let i = model.length - 0.7; i >= 0; i -= 1){
            adjustedSeeds.push(new Seed({x: 0, y: i, z: 0},{phi: Math.PI / 2, theta: 0},seedModel,airKerma,0.00833));
        }
        // add seeds in the ring (z coordinate is negated so that it aligns with the "tail")
        for (let i = (3 * Math.PI / 4); i <= (7 * Math.PI / 3); i += 1 / (model.ringDiameter / 2)){
            adjustedSeeds.push(new Seed({x: (model.ringDiameter / 2) * Math.cos(i), y: 0, z: (model.ringDiameter / 2) * Math.sin(i)},{phi: 0, theta: i + Math.PI / 2},seedModel,airKerma,0.00833));
        }
        graph.seeds = adjustedSeeds;
        let xTick = [];
        for (let i = -model.ringDiameter - 2.6; i <= model.ringDiameter + 2.6; i += 0.125){xTick.push(i);} //2mm of room is used of all graphs, and an extra 0.6 is given to account for the thickness of the ring
        let yTick = [];
        if (view === "top"){
            for (let i = -(model.ringDiameter / 2) - 2.6; i <= (model.ringDiameter / 2) + 2.6; i += 0.125){yTick.push(i);}
        }else{
            for (let i = -2; i <= model.length + 2; i += 0.125){yTick.push(i);}
        }
        graph.xTicks = xTick;
        graph.yTicks = yTick;
        moduleData[refPoint] = {x: 2, y: 0, z: 0};
    }
    if (view === "front"){
        graph.perspective = (point) => point;
    }
    if (view === "side"){
        graph.perspective = (point) => {
            return {
                x: point.z,
                y: point.y,
                z: point.x
            }
        }
    }
    if (view === "top"){
        graph.perspective = (point) => {
            return {
                x: point.x,
                y: point.z,
                z: point.y
            }
        }
    }
    adjustApplicatorRenderer(graph,model,{drawFunction: drawFunction,boundingBox: boundingBox, view: view});
}
function adjustApplicatorRenderer(graph,model,{drawFunction: drawFunction,boundingBox: boundingBox, view: view}){
    moduleData[drawFunction] = function () {
        let origin = graphToScreenPos({x: 0, y: 0},graph,boundingBox); // origin :)
        // draw the tandem bit without the curve
        ctx.strokeStyle = "black";
        ctx.lineWidth = Math.min(canvas.width,canvas.height * 0.9) * 0.005;
        if (model.name === "Vaginal Cylinder"){
            model.angle = 90;
            drawAngledTandem(model,graph,boundingBox,origin);
        }
        if (model.name === "Tandem/Ovoids"){
            if (view === "front"){
                //draw ovoids
                let ovoidRight = graphToScreenPos({x: model.ovoidDiameter / 2, y: -model.ovoidDiameter / 2},graph,boundingBox);
                let ovoidLeft = graphToScreenPos({x: -model.ovoidDiameter / 2, y: -model.ovoidDiameter / 2},graph,boundingBox);
                let startAngle = Math.atan2(Math.sqrt(((model.ovoidDiameter / 2) ** 2) - (((model.diameter - model.ovoidDiameter) / 2) ** 2)),(model.diameter - model.ovoidDiameter) / 2);
                ctx.beginPath();
                ctx.ellipse(ovoidRight.x,ovoidRight.y,Math.abs(origin.x - ovoidRight.x),Math.abs(origin.y - ovoidRight.y),0,startAngle,2 * Math.PI - startAngle,true);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(ovoidLeft.x,ovoidLeft.y,Math.abs(origin.x - ovoidLeft.x),Math.abs(origin.y - ovoidLeft.y),0,Math.PI - startAngle,startAngle + Math.PI,false);
                ctx.stroke();

                // draw tandem
                let frontModel = {...model};
                frontModel.angle = 90; //this makes the tandem straight from this perspective
                drawAngledTandem(frontModel,graph,boundingBox,origin);
            }
            if (view === "side"){
                // draw ovoid
                let pos5 = graphToScreenPos({x: -1.5, y: 0},graph,boundingBox);
                let pos6 = graphToScreenPos({x: 1.5, y: -model.ovoidDiameter},graph,boundingBox);
                ctx.beginPath();
                ctx.roundRect(pos5.x,pos5.y,pos6.x - pos5.x,pos6.y - pos5.y,Math.min((pos6.x - pos5.x) / 3, (pos6.y - pos5.y) / 3));
                ctx.stroke();
                // draw tandem
                drawAngledTandem(model,graph,boundingBox,origin);
            }
            if (view === "top"){
                let pos1 = graphToScreenPos({x: -model.diameter / 2, y: model.diameter / 2},graph,boundingBox); // top left of tandem, used to skew tandem when aspect ratio is incorrect
                ctx.fillStyle = "black";
                ctx.beginPath();
                ctx.ellipse(origin.x,origin.y,origin.x - pos1.x,origin.y - pos1.y,0,0,2 * Math.PI);
                ctx.fill();
                let pos2 = graphToScreenPos({x: -model.ovoidDiameter, y: 1.5},graph,boundingBox); // top left of left ovoid
                let fillet = graphToScreenPos({x: -1, y: 1},graph,boundingBox);
                ctx.beginPath();
                ctx.roundRect(pos2.x,pos2.y,origin.x - pos2.x, 2 * (origin.y - pos2.y), Math.min(origin.x - fillet.x, origin.x - fillet.y));
                ctx.stroke();
                ctx.beginPath();
                ctx.roundRect(origin.x,pos2.y,origin.x - pos2.x, 2 * (origin.y - pos2.y), Math.min(origin.x - fillet.x, origin.x - fillet.y));
                ctx.stroke();
            }else{
                // draw "lip" on the tandem
                ctx.lineWidth = Math.min(canvas.width,canvas.height * 0.9) * 0.005;
                let pos3 = graphToScreenPos({x: -0.8, y: 0.2},graph,boundingBox);
                let pos4 = graphToScreenPos({x: 0.8, y: 0},graph,boundingBox);
                ctx.beginPath();
                ctx.roundRect(pos3.x,pos3.y,pos4.x - pos3.x,pos4.y - pos3.y, (pos4.y - pos3.y) / 2);
                ctx.stroke();
            }
        }
        if (model.name === "Tandem/Ring"){
            if (view === "side"){
                let leftRingBoxLeftCorner = graphToScreenPos({x: - (model.ringDiameter / 2) - 0.6, y: 0},graph,boundingBox);
                let leftRingBoxRightCorner = graphToScreenPos({x: - (model.ringDiameter / 2) + 0.6, y: -0.75},graph,boundingBox);
                let rightRingBoxLeftCorner = graphToScreenPos({x: (model.ringDiameter / 2) - 0.6, y: 0},graph,boundingBox);
                let rightRingBoxRightCorner = graphToScreenPos({x: (model.ringDiameter / 2) + 0.6, y: -0.75},graph,boundingBox);
                let round = graphToScreenPos({x: 0.3, y: 0},graph,boundingBox).x - origin.x;
                ctx.beginPath();
                ctx.roundRect(leftRingBoxLeftCorner.x,leftRingBoxLeftCorner.y,leftRingBoxRightCorner.x - leftRingBoxLeftCorner.x,leftRingBoxRightCorner.y - leftRingBoxLeftCorner.y,[0,0,round,round]);
                ctx.roundRect(rightRingBoxLeftCorner.x,rightRingBoxLeftCorner.y,rightRingBoxRightCorner.x - rightRingBoxLeftCorner.x,rightRingBoxRightCorner.y - rightRingBoxLeftCorner.y,[0,0,round,round]);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc((leftRingBoxLeftCorner.x + leftRingBoxRightCorner.x) / 2,leftRingBoxLeftCorner.y,(leftRingBoxRightCorner.x - leftRingBoxLeftCorner.x) / 2,0,Math.PI,true);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc((rightRingBoxLeftCorner.x + rightRingBoxRightCorner.x) / 2,rightRingBoxLeftCorner.y,(rightRingBoxRightCorner.x - rightRingBoxLeftCorner.x) / 2,0,Math.PI,true);
                ctx.stroke();
                drawAngledTandem(model,graph,boundingBox,origin);
            }
            if (view === "top"){
                let xInnerRadius = graphToScreenPos({x: (model.ringDiameter / 2) - 0.6, y: 0},graph,boundingBox).x - origin.x;
                let yInnerRadius = origin.y - graphToScreenPos({x: 0, y: (model.ringDiameter / 2) - 0.6},graph,boundingBox).y;
                let xOuterRadius = graphToScreenPos({x: (model.ringDiameter / 2) + 0.6, y: 0},graph,boundingBox).x - origin.x;
                let yOuterRadius = origin.y - graphToScreenPos({x: 0, y: (model.ringDiameter / 2) + 0.6},graph,boundingBox).y;
                ctx.beginPath();
                ctx.ellipse(origin.x,origin.y,xInnerRadius,yInnerRadius,0,0,2 * Math.PI);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(origin.x,origin.y,xOuterRadius,yOuterRadius,0,0,2 * Math.PI);
                ctx.stroke();
            }
        }
    }
}
function drawAngledTandem(model,graph,boundingBox,origin){
    let pos1 = graphToScreenPos({x: -model.diameter / 2, y: model.length + ((model.name === "Tandem/Ovoids") ? 0.2: 0)},graph,boundingBox); // top left of tandem
    let pos2 = graphToScreenPos({x: model.diameter / 2, y: ((model.name === "Tandem/Ovoids") ? 0.2 : 0)},graph,boundingBox); // bottom right of tandem
    ctx.beginPath();
    ctx.roundRect(pos1.x,pos1.y,pos2.x - pos1.x, pos2.y - pos1.y, [(pos2.x - pos1.x) / 2,(pos2.x - pos1.x) / 2,0,0]);
    ctx.stroke();
    let radianAngle = ((270 + (90 - model.angle)) / 360) * 2 * Math.PI;
    let pos3;
    let pos4;
    if (model.name === "Tandem/Ovoids"){
        pos3 = graphToScreenPos({x: 0, y: -model.ovoidDiameter / 2},graph,boundingBox); // point centered between two ovoids
        pos4 = graphToScreenPos(
            {
                x: (model.ovoidDiameter / 2) * Math.cos(radianAngle),
                y: - (model.ovoidDiameter / 2) + (model.ovoidDiameter / 2) * Math.sin(radianAngle)
            },
            graph,boundingBox
        );
    }else{
        pos3 = graphToScreenPos({x: 0, y: -0.5},graph,boundingBox); // point centered between two ovoids
        pos4 = graphToScreenPos(
            {
                x:  Math.cos(radianAngle),
                y: -0.5 + Math.sin(radianAngle)
            },
            graph,boundingBox
        );
    }
    let endPos = graphToScreenPos({
        x: (getMin(graph.yTicks) / Math.sin(radianAngle)) * Math.cos(radianAngle),
        y: getMin(graph.yTicks)
    },graph,boundingBox);
    ctx.lineWidth = pos2.x - pos1.x;
    ctx.beginPath();
    ctx.moveTo(origin.x,origin.y);
    ctx.bezierCurveTo(pos3.x,pos3.y,pos4.x,pos4.y,endPos.x,endPos.y);
    ctx.stroke();
}
function formatApplicatorTypeDropdown(dropdown,depth){
    dropdown.options.forEach((opt,ind) => {
        if (opt.options){
            if (opt.showing){
                opt.button.bgColor = "black";
                opt.button.fontColor = "white";
            }else{
                opt.button.bgColor = "white";
                opt.button.fontColor = "black";
            }
            opt.button.x = moduleData.applicatorModelDropdown.button.x + depth * (moduleData.applicatorModelDropdown.button.width / 4);
            opt.button.y = moduleData.applicatorModelDropdown.button.y + moduleData.applicatorModelDropdown.button.height * (ind + 1);
            opt.button.width = moduleData.applicatorModelDropdown.button.width / 4;
            opt.button.height = moduleData.applicatorModelDropdown.button.height;
            formatApplicatorTypeDropdown(opt,depth + 1);
        }else{
            opt.x = moduleData.applicatorModelDropdown.button.x + depth * (moduleData.applicatorModelDropdown.button.width / 4);
            opt.y = moduleData.applicatorModelDropdown.button.y + moduleData.applicatorModelDropdown.button.height * (ind + 1);
            opt.width = moduleData.applicatorModelDropdown.button.width / 4;
            opt.height = moduleData.applicatorModelDropdown.button.height;
        }
    });

    let fontSizes = [];
    dropdown.options.forEach((child) => {
        if (child.button){
            fontSizes.push(getFontSize(child.button.width,child.button.height,child.button.label,(size) => `${size}px monospace`));
        }else{
            fontSizes.push(getFontSize(child.width,child.height,child.label,(size) => `${size}px monospace`));
        }
    });

    dropdown.options.forEach((child) => {
        if (child.button){
            child.button.font = getMin(fontSizes) * 0.8 + "px monospace";
        }else{
            child.font = getMin(fontSizes) * 0.8 + "px monospace";
        }
    });
}