var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

let mouse = {x: 0, y: 0, down: false};
let mouseGraphPos = {x: 0, y: 0};
let scrollPos = {x: 0, y: 0};
let render = true; // used to indicate if the graphs should be re-drawn
let module = "single seed";
let moduleData = {};

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

class Seed {
    constructor (pos, rot, model, airKerma, dwellTime){
        this.model = model;
        this.pos = pos; // measured in cm
        this.rot = rot; // measured in radians
        this.airKerma = airKerma; // measured in U
        this.dwellTime = dwellTime; // Measured in hours
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
            transformedTheta = Math.atan2(Math.abs(pos.y - this.pos.y),pos.x - this.pos.x);
        }else{
            transformedTheta = Math.atan2(Math.abs(pos.y - this.pos.y),Math.abs(pos.x - this.pos.x));
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
        let geometry;
        if (this.pointSource){
            geometry = 1/(pos.r ** 2);
        }else{
            if ((pos.theta == 0) || (pos.theta == Math.PI)){
                geometry = 1 / ((pos.r ** 2) - ((this.model.sourceLength ** 2) / 4)); // case for if theta == 0, since that would lead to a divide by 0 error
            }else{
                let vec1 = {
                    x: (this.pos.x + (this.model.sourceLength / 2 * Math.cos(this.rot.yaw)) - pos.x),
                    y: (this.pos.y + (this.model.sourceLength / 2 * Math.sin(this.rot.yaw)) - pos.y)
                }; //calculates vector from one end of the seed to the given pos
                let vec2 = {
                    x: (this.pos.x - (this.model.sourceLength / 2 * Math.cos(this.rot.yaw)) - pos.x),
                    y: (this.pos.y - (this.model.sourceLength / 2 * Math.sin(this.rot.yaw)) - pos.y)
                }; //calculates vector from the opposite end of the seed to the given pos
                let beta = Math.acos((vec1.x / magnitude(vec1)) * (vec2.x / magnitude(vec2)) + (vec1.y / magnitude(vec1)) * (vec2.y / magnitude(vec2))) //finds the angle between vec1 and vec2 using dot product
                geometry = beta / (this.model.sourceLength * pos.r * Math.abs(Math.sin(pos.theta)));
            }
        }
        return geometry;
    }
    calculateDose(pos){ //this all assumes the camera is looking such that further away is positive z, so none of these calcs include z
        pos.x = this.pos.x + pos.r * Math.cos(pos.theta);
        pos.y = this.pos.y + pos.r * Math.sin(pos.theta);
        let doseRate = this.airKerma * this.model.doseRateConstant * (this.geometryFactor(pos)/this.geometryFactor({r: 1, theta: Math.PI / 2, x:this.pos.x, y:this.pos.y + 1})) * this.g(pos.r) * this.F(pos);
        return doseRate * 1.44 * this.model.halfLife * (this.model.HDRsource ? (1 - Math.exp(-this.dwellTime / (1.44 * this.model.halfLife))) : 1) / 100; // this is divided by 100 to convert to Gy
    }
}
class Graph {
    constructor({x, y, width, height, seeds, xTicks, yTicks}){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.seeds = seeds;
        this.xTicks = xTicks;
        this.yTicks = yTicks;
    }
    getPointDose(pos){
        return this.seeds.reduce((z,seed) => {
            return z + seed.calculateDose({
                r: Math.sqrt((pos.y - seed.pos.y)**2 + (pos.x - seed.pos.x)**2),
                theta: Math.atan2((pos.y - seed.pos.y),(pos.x - seed.pos.x))
            });
        },0)
    }
    getIsodose(refPoint){
        let z = [];
        let dy = this.yTicks[1] - this.yTicks[0];
        let dx = this.xTicks[1] - this.xTicks[0];
        for (let i = getMin(this.yTicks); i <= getMax(this.yTicks); i+= dy){
            let sliceZ = [];
            for (let j = getMin(this.xTicks); j <= getMax(this.xTicks); j+= dx){
                sliceZ.push(100 * this.getPointDose({x: j, y: i}) / this.getPointDose(refPoint));
            }
            z.push(sliceZ);
        }
        return z;
    }
    drawGraph(div,refPoint){
        let data = [];
        for (let i = 1; i < 64; i *= 2){
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
                        value: 100 * i / 2,
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
                    name: 100 * (i / 2) + "%",
                },
            );
        };
        div.style.width = this.width + "px";
        div.style.height = this.height + "px";
        div.style.left = this.x + "px";
        div.style.top = this.y + "px";
        Plotly.newPlot(div.id, data); //does not update after window rescaling
        return div.children[0].children[0].children[0].children[4].children[0].children[2].getBoundingClientRect();
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
            ctx.font = getFontSize(this.width,this.height,this.label) + "px monospace";
        }else{
            ctx.font = this.font;
        }
        let textDimensions = ctx.measureText(this.label);
        let textHeight = textDimensions.actualBoundingBoxAscent + textDimensions.actualBoundingBoxDescent;
        ctx.strokeStyle = this.outlineColor;
        ctx.lineWidth = this.outlineThickness;
        ctx.beginPath();
        ctx.rect(this.x,this.y,this.width,this.height);
        ctx.stroke();
        ctx.fillStyle = this.bgColor;
        ctx.beginPath();
        ctx.fillRect(this.x,this.y,this.width,this.height);
        ctx.fillStyle = this.fontColor;
        ctx.fillText(this.label, this.x + (this.width - textDimensions.width) / 2, this.y + textHeight + (this.height - textHeight) * 0.4);
    }
    checkClicked(){
        if (mouse.down && (mouse.x >= this.x) && (mouse.x <= this.x + this.width)
            && (mouse.y >= this.y) && (mouse.y <= this.y + this.height)){
            this.onClick();
            return true;
        }
        return false;
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
            this.options.forEach((opt) => {opt.draw();});
        }else{
            this.button.draw();
        }
    }
    checkDropdownClicked(){
        this.button.checkClicked();
        if (this.showing){
            this.options.forEach((button) => {
                if (button.checkClicked()){
                    this.showing = false;
                }
            });
        }
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
            let unclampedVal = ((mouse.x - this.x) * Math.cos(this.angle) + (mouse.y - this.y) + Math.sin(this.angle)) / this.length; // this projects the mouse position onto the slider's direction vector, gets the magnitude, and divides byh the slider gangle to get the new value
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
initModule(module);
setInterval(tick,50);

function tick(){
    if (module === "single seed"){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        //dose label
        if ((mouse.x > moduleData.divBoundGraph2.x) && (mouse.x < moduleData.divBoundGraph2.x + moduleData.divBoundGraph2.width)
            && (mouse.y > moduleData.divBoundGraph2.y) && (mouse.y < moduleData.divBoundGraph2.y + moduleData.divBoundGraph2.height)){
            mouseGraphPos = {
                x: (((mouse.x - moduleData.divBoundGraph2.x) / moduleData.divBoundGraph2.width)*
                    (getMax(moduleData.graph2.xTicks) - getMin(moduleData.graph2.xTicks)) + getMin(moduleData.graph2.xTicks)),
                y: (((mouse.y - moduleData.divBoundGraph2.y) / moduleData.divBoundGraph2.height)*
                    (getMin(moduleData.graph2.yTicks) - getMax(moduleData.graph2.yTicks)) + getMax(moduleData.graph2.yTicks))
            }
            ctx.beginPath();
            ctx.font = "14px serif";
            let dose = moduleData.graph2.getPointDose(mouseGraphPos).toFixed(2);
            let textDimensions = ctx.measureText(dose);
            let textHeight = textDimensions.actualBoundingBoxAscent + textDimensions.actualBoundingBoxDescent;
            ctx.fillStyle = "white";
            ctx.fillRect(mouse.x,mouse.y - textHeight,textDimensions.width,textHeight);
            ctx.fillStyle = "black";
            ctx.fillText(dose,mouse.x,mouse.y);
        }

        //draw graph 2 reference point
        ctx.fillStyle = "black";
        ctx.font = "16px serif";
        ctx.beginPath();
        refPos = graphToScreenPos(moduleData.graph2refPoint,moduleData.graph2,moduleData.divBoundGraph2);
        ctx.arc(refPos.x,refPos.y,moduleData.divBoundGraph2.width * 0.01, 0, 7);
        ctx.fill();
        ctx.fillText(moduleData.graph2.getPointDose(moduleData.graph2refPoint).toFixed(2),refPos.x + moduleData.divBoundGraph2.width * 0.02,refPos.y);

        //update seed air kerma based on slider values
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
        let AirKermaLabel = "Air Kerma: " + moduleData.graph1.seeds[0].airKerma.toFixed(2) + "U";
        ctx.font = getFontSize(moduleData.graph1ModelDropdown.button.width,moduleData.graph1ModelDropdown.button.height,AirKermaLabel) + "px monospace";
        ctx.fillText(
            AirKermaLabel,
            moduleData.graph1ModelDropdown.button.width * 0.1,
            moduleData.graph1ModelDropdown.button.y + 2 * moduleData.graph1ModelDropdown.button.height
        );
        AirKermaLabel = "Air Kerma: " + moduleData.graph2.seeds[0].airKerma.toFixed(2) + "U";
        ctx.font = getFontSize(moduleData.graph2ModelDropdown.button.width,moduleData.graph2ModelDropdown.button.height,AirKermaLabel) + "px monospace";
        ctx.fillText(
            AirKermaLabel,
            moduleData.graph2ModelDropdown.button.x + moduleData.graph2ModelDropdown.button.width * 0.1,
            moduleData.graph2ModelDropdown.button.y + 2 * moduleData.graph2ModelDropdown.button.height
        );

        // draw and update graph1 dwell time
        if (moduleData.graph1.seeds[0].model.HDRsource){
            moduleData.graph1DwellTimeSlider.checkClicked();
            moduleData.graph1DwellTimeSlider.draw();
            if (moduleData.graph1.seeds[0].dwellTime != getDwellTimeFromSlider(moduleData.graph1DwellTimeSlider)){
                moduleData.graph1.seeds[0].dwellTime = getDwellTimeFromSlider(moduleData.graph1DwellTimeSlider);
                render = true;
            }
            let text = "Dwell Time: " + (moduleData.graph1.seeds[0].dwellTime * 60).toFixed(2) + " min(s)";
            ctx.font = getFontSize(moduleData.graph1ModelDropdown.button.width,moduleData.graph1ModelDropdown.button.height,text) + "px monospace";
            ctx.fillText(
                text,
                moduleData.graph1ModelDropdown.button.x + moduleData.graph1ModelDropdown.button.width * 0.1,
                moduleData.graph1ModelDropdown.button.y + 4 * moduleData.graph1ModelDropdown.button.height
            );
        }
        // draw and update graph2 dwell time
        if (moduleData.graph2.seeds[0].model.HDRsource){
            moduleData.graph2DwellTimeSlider.checkClicked();
            moduleData.graph2DwellTimeSlider.draw();
            if (moduleData.graph2.seeds[0].dwellTime != getDwellTimeFromSlider(moduleData.graph2DwellTimeSlider)){
                moduleData.graph2.seeds[0].dwellTime = getDwellTimeFromSlider(moduleData.graph2DwellTimeSlider);
                render = true;
            }
            let text = "Dwell Time: " + (moduleData.graph2.seeds[0].dwellTime * 60).toFixed(2) + " min(s)";
            ctx.font = getFontSize(moduleData.graph2ModelDropdown.button.width,moduleData.graph2ModelDropdown.button.height,text) + "px monospace";
            ctx.fillText(
                text,
                moduleData.graph2ModelDropdown.button.x + moduleData.graph2ModelDropdown.button.width * 0.1,
                moduleData.graph2ModelDropdown.button.y + 4 * moduleData.graph2ModelDropdown.button.height
            );
        }

        //draw dropdowns
        moduleData.graph1ModelDropdown.drawDropdown();
        moduleData.graph2ModelDropdown.drawDropdown();
    }
    if (module === "string of seeds"){
        ctx.clearRect(0,0,canvas.width,canvas.height);

        // update and draw spacing slider + update add seed button
        moduleData.seedSpacingSlider.checkClicked();
        if (moduleData.seedSpacing != (moduleData.seedSpacingSlider.value + 0.5)){
            moduleData.seedSpacing = (moduleData.seedSpacingSlider.value + 0.5);
            adjustFormatting();
        }
        //draw delete seed button
        if (moduleData.selectedSeed != -1){
            moduleData.airKermaSlider.checkClicked();
            let airKerma = getAirKermaFromSlider(moduleData.airKermaSlider,moduleData.graph1.seeds[moduleData.selectedSeed])
            if (moduleData.graph1.seeds[moduleData.selectedSeed].airKerma != airKerma){
                moduleData.graph1.seeds[moduleData.selectedSeed].airKerma = airKerma;
                render = true;
            }
            let text = "Air Kerma: " + moduleData.graph1.seeds[moduleData.selectedSeed].airKerma.toFixed(2) + "U";
            ctx.font = getFontSize(moduleData.addSeed.width,moduleData.addSeed.height,text) + "px monospace";
            ctx.fillText(
                text,
                moduleData.deleteSeed.x,
                moduleData.deleteSeed.y + 2 * moduleData.deleteSeed.height
            );
            moduleData.deleteSeed.draw();
            moduleData.airKermaSlider.draw();

            if (moduleData.graph1.seeds[moduleData.selectedSeed].model.HDRsource){
                moduleData.dwellTimeSlider.checkClicked();
                let dwellTime = getDwellTimeFromSlider(moduleData.dwellTimeSlider);
                if (moduleData.graph1.seeds[moduleData.selectedSeed].dwellTime != dwellTime){
                    moduleData.graph1.seeds[moduleData.selectedSeed].dwellTime = dwellTime;
                    render = true;
                }
                text = "Dwell Time: " + (moduleData.graph1.seeds[moduleData.selectedSeed].dwellTime * 60).toFixed(2) + " min(s)";
                ctx.font = getFontSize(moduleData.deleteSeed.width,moduleData.deleteSeed.height,text) + "px monospace";
                ctx.fillText(
                    text,
                    moduleData.dwellTimeSlider.x,
                    canvas.height * 0.175
                );
                moduleData.dwellTimeSlider.draw();
            }
        }
        moduleData.graph1ModelDropdown.drawDropdown();
        moduleData.addSeed.draw();
        moduleData.seedSpacingSlider.draw();

        //draw "Source Spacing" text
        let text = "Source Spacing: " + moduleData.seedSpacing.toFixed(2) + " cm";
        ctx.font = getFontSize(moduleData.addSeed.width,moduleData.addSeed.height,text) + "px monospace";
        ctx.fillText(
            text,
            moduleData.addSeed.x + moduleData.addSeed.width * 0.1,
            moduleData.addSeed.y + 2 * moduleData.addSeed.height
        );

        //draw "dwell positions of seeds"
        ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
        ctx.lineWidth = Math.min(canvas.width,canvas.height) * 0.005;
        moduleData.graph1.seeds.forEach((seed,ind) => {
            if ((seed.pos.x <= getMax(moduleData.graph1.xTicks)) && (seed.pos.x >= getMin(moduleData.graph1.xTicks))){
                if (moduleData.selectedSeed == ind){
                    ctx.strokeStyle = "rgb(169, 255, 103)";
                }else{
                    ctx.strokeStyle = "rgb(0,0,0)";
                }
                let screenPos = graphToScreenPos({x: seed.pos.x,y: seed.pos.y},moduleData.graph1,moduleData.divBoundGraph1);
                ctx.beginPath();
                ctx.arc(screenPos.x,screenPos.y,0.2 * (moduleData.graph1.width / (getMax(moduleData.graph1.xTicks) - getMin(moduleData.graph1.xTicks))),0,2 * Math.PI);
                ctx.fill();
                ctx.stroke();
            }
        });
    }
    if ((module === "single seed") || (module === "string of seeds")){
        // label dose at cursor
        if ((mouse.x > moduleData.divBoundGraph1.x) && (mouse.x < moduleData.divBoundGraph1.x + moduleData.divBoundGraph1.width)
            && (mouse.y > moduleData.divBoundGraph1.y) && (mouse.y < moduleData.divBoundGraph1.y + moduleData.divBoundGraph1.height)){
            mouseGraphPos = {
                x: (((mouse.x - moduleData.divBoundGraph1.x) / moduleData.divBoundGraph1.width)*
                    (getMax(moduleData.graph1.xTicks) - getMin(moduleData.graph1.xTicks)) + getMin(moduleData.graph1.xTicks)),
                y: (((mouse.y - moduleData.divBoundGraph1.y) / moduleData.divBoundGraph1.height)*
                    (getMin(moduleData.graph1.yTicks) - getMax(moduleData.graph1.yTicks)) + getMax(moduleData.graph1.yTicks))
            }
            ctx.beginPath();
            ctx.font = "14px serif";
            let dose = moduleData.graph1.getPointDose(mouseGraphPos).toFixed(2);
            let textDimensions = ctx.measureText(dose);
            let textHeight = textDimensions.actualBoundingBoxAscent + textDimensions.actualBoundingBoxDescent;
            ctx.fillStyle = "white";
            ctx.fillRect(mouse.x,mouse.y - textHeight,textDimensions.width,textHeight);
            ctx.fillStyle = "black";
            ctx.fillText(dose,mouse.x,mouse.y);
        }

        //draw graph 1 reference point
        ctx.fillStyle = "black";
        ctx.font = "16px serif";
        ctx.beginPath();
        let refPos = graphToScreenPos(moduleData.graph1refPoint,moduleData.graph1,moduleData.divBoundGraph1);
        ctx.arc(refPos.x,refPos.y,Math.min(moduleData.divBoundGraph1.width,moduleData.divBoundGraph1.height) * 0.01, 0, 7);
        ctx.fill();
        ctx.fillText(moduleData.graph1.getPointDose(moduleData.graph1refPoint).toFixed(2),refPos.x + Math.min(moduleData.divBoundGraph1.width,moduleData.divBoundGraph1.height) * 0.02,refPos.y);
    }
    //draw module selection bar
    moduleData.moduleSelectBar.forEach((button) => {
        button.draw();
    });

    if ((canvas.width != window.innerWidth) || (canvas.height != window.innerHeight)){
        adjustFormatting();
    }else{
        if (render){
            if (moduleData.divBoundGraph1){
                moduleData.divBoundGraph1 = moduleData.graph1.drawGraph(document.getElementById("graph1"),moduleData.graph1refPoint);
            }
            if (moduleData.divBoundGraph2){
                moduleData.divBoundGraph2 = moduleData.graph2.drawGraph(document.getElementById("graph2"),moduleData.graph2refPoint);
            }
            render = false;
        }
    }
}

function initModule(mod){
    if (mod === "single seed"){
        let ticks = [];
        for (let j = -2; j <= 2; j+= 0.125){ticks.push(j);}
        moduleData = {
            graph1: (
                new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [new Seed({x:0, y:0, z:0},{pitch: 0, yaw: 0, roll: 0},TheraSeed200,airKermaSliderLimits.LDR.min,0.00833)], xTicks: ticks, yTicks: ticks}) //x,y,width, and height are all set to 0 since they will be later formatted with an adjustFormatting() call
            ),
            divBoundGraph1: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph2: (
                new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [new Seed({x:0, y:0, z:0},{pitch: 0, yaw: 0, roll: 0},GammaMedHDRPlus,airKermaSliderLimits.HDR.min,0.00833)], xTicks: ticks, yTicks: ticks}) //x,y,width, and height are all set to 0 since they will be later formatted with an adjustFormatting() call
            ),
            divBoundGraph2: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph1ModelDropdown: new Dropdown(
                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "black", onClick: () => {},label: {text: "", font: "default", color: "white"}, outline: {color: "black", thickness: 0}}),[]
            ),
            graph2ModelDropdown: new Dropdown(
                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "black", onClick: () => {},label: {text: "", font: "default", color: "white"}, outline: {color: "black", thickness: 0}}),[]
            ),
            graph1refPoint: {x: 0, y: 1},
            graph2refPoint: {x: 0, y: 1},
            graph1AirKermaSlider: new Slider(0,0,0,0,"black",0,0),
            graph2AirKermaSlider: new Slider(0,0,0,0,"black",0,0),
            graph1DwellTimeSlider: new Slider(0,0,0,0,"black",0,0),
            graph2DwellTimeSlider: new Slider(0,0,0,0,"black",0,0)
        };
        for (let i = 0; i < 4; i++){
            let seedModel = [TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21][i];
            moduleData.graph1ModelDropdown.options.push(new Button({
                x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: seedModel.name + " (" + seedModel.isotope + ")", font: "default", color: "black"}, outline: {color: "black", thickness: 0},
                onClick: () => {
                    moduleData.graph1.seeds[0].model = seedModel;
                    moduleData.graph1ModelDropdown.button.label = seedModel.name + " (" + seedModel.isotope + ")";
                    render = true;
                },
            }));
            moduleData.graph2ModelDropdown.options.push(new Button({
                x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: seedModel.name + " (" + seedModel.isotope + ")", font: "default", color: "black"}, outline: {color: "black", thickness: 0},
                onClick: () => {
                    moduleData.graph2.seeds[0].model = seedModel;
                    moduleData.graph2ModelDropdown.button.label = seedModel.name + " (" + seedModel.isotope + ")";
                    render = true;
                },
            }));
        }
    }
    if (mod === "string of seeds"){
        let div = document.getElementById("graph2");
        while (div.firstChild){
            div.removeChild(div.firstChild);
        }
        let xTicks = [];
        let yTicks = [];
        for (let j = -10; j <= 10; j+= 0.25){xTicks.push(j);}
        for (let j = -2; j <= 2; j += 0.125){yTicks.push(j);}
        moduleData = {
            graph1: new Graph({x: 0, y: 0, width: 0, height: 0, seeds: [new Seed({x: 0, y: 0, z: 0},{roll: 0, pitch: 0, yaw: 0},BEBIG_GK60M21,airKermaSliderLimits.HDR.min,0.00833)],xTicks: xTicks, yTicks: yTicks}),
            divBoundGraph1: {bottom: 1157, height: 1057, left: 80, right: 1115, top: 100, width: 1035, x: 80, y: 100},
            graph1refPoint: {x: 0, y: 1},
            addSeed: new Button({x: 0, y: 0, width: 0, height: 0, label: {text: "Add Source +",font: "default", color: "black"}, bgColor: "rgb(40, 197, 53)",
                onClick: () => {
                    if ((moduleData.graph1.seeds.length * moduleData.seedSpacing) <= (getMax(moduleData.graph1.xTicks) - getMin(moduleData.graph1.xTicks))){
                        moduleData.graph1.seeds.push(
                            new Seed(
                                {x: 0, y: 0},
                                {pitch: 0, yaw: 0, roll: 0},
                                moduleData.graph1.seeds[0].model,
                                (moduleData.graph1.seeds[0].model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min)
                                ,0.00833
                            )
                        );
                        adjustFormatting();
                        render = true;
                    }
                },outline: {color: "black",thickness: 0}
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
                },outline: {color: "black",thickness: 0}
            }),
            airKermaSlider: new Slider(0,0,0,0,"black",0,0.5),
            graph1ModelDropdown: new Dropdown(
                new Button({x: 0, y: 0, width: 0, height: 0, bgColor: "black", onClick: () => {},label: {text: "", font: "default", color: "white"}, outline: {color: "black", thickness: 0}}),[]
            ),
            dwellTimeSlider: new Slider(0,0,0,0,"black",0,0.5),
        };
        for (let i = 0; i < 4; i++){
            let seedModel = [TheraSeed200,Best2301,GammaMedHDRPlus,BEBIG_GK60M21][i];
            moduleData.graph1ModelDropdown.options.push(new Button({
                x: 0, y: 0, width: 0, height: 0, bgColor: "white",label: {text: seedModel.name + " (" + seedModel.isotope + ")", font: "default", color: "black"}, outline: {color: "black", thickness: 0},
                onClick: () => {
                    moduleData.graph1.seeds.forEach((seed) => {
                        seed.model = seedModel;
                        seed.airKerma = (seed.model.HDRsource ? airKermaSliderLimits.HDR.min : airKermaSliderLimits.LDR.min);
                        seed.dwellTime = 0.00833;
                    });
                    moduleData.airKermaSlider.value = 0;
                    moduleData.dwellTimeSlider.value = 0;
                    moduleData.graph1ModelDropdown.button.label = seedModel.name + " (" + seedModel.isotope + ")";
                    render = true;
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
                    text: ["Single Seed","String of Seeds","Planar Array of Seeds","Brachytherapy Appliactors"][i],
                    font: "default",
                    color: (mod === ["single seed","string of seeds","planar array of seeds","brachytherapy appliactors"][i]) ? "white" : "black"},
                bgColor: (mod === ["single seed","string of seeds","planar array of seeds","brachytherapy appliactors"][i]) ? "black" : "white",
                onClick: () => {
                    module = ["single seed","string of seeds","planar array of seeds","brachytherapy appliactors"][i];
                    initModule(module);
                },
                outline: {
                    color: "black",
                    thickness: 0.005 * Math.min(canvas.width,canvas.height)
                }
            })
        );
    }
    adjustFormatting();
    render = true;
}
function adjustFormatting(){
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

            moduleData.graph1ModelDropdown.options.forEach((opt,ind) => {
                opt.x = 0;
                opt.y = canvas.height * 0.15 + (canvas.height * 0.2 / (moduleData.graph1ModelDropdown.options.length + 1)) * (ind + 1);
                opt.width = splitX * 0.9;
                opt.height = canvas.height * 0.2 / (moduleData.graph1ModelDropdown.options.length + 1);
            });

            graph2ModelDropdown.x = 0;
            graph2ModelDropdown.y = canvas.height * 0.55;
            graph2ModelDropdown.width = splitX * 0.9;
            graph2ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph2ModelDropdown.options.length + 1);
            graph2ModelDropdown.label = graph2.seeds[0].model.name + " (" + graph2.seeds[0].model.isotope + ")";

            moduleData.graph2ModelDropdown.options.forEach((opt,ind) => {
                opt.x = 0;
                opt.y = canvas.height * 0.55 + (canvas.height * 0.2 / (moduleData.graph2ModelDropdown.options.length + 1)) * (ind + 1);
                opt.width = splitX * 0.9;
                opt.height = canvas.height * 0.2 / (moduleData.graph2ModelDropdown.options.length + 1);
            });

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

            moduleData.graph1ModelDropdown.options.forEach((opt,ind) => {
                opt.x = 0;
                opt.y = canvas.height * 0.3 + (canvas.height * 0.2 / (moduleData.graph1ModelDropdown.options.length + 1)) * (ind + 1);
                opt.width = canvas.width * 0.125;
                opt.height = canvas.height * 0.2 / (moduleData.graph1ModelDropdown.options.length + 1);
            });

            graph2ModelDropdown.x = canvas.width * 0.5;
            graph2ModelDropdown.y = canvas.height * 0.3;
            graph2ModelDropdown.width = canvas.width * 0.125;
            graph2ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph2ModelDropdown.options.length + 1);
            graph2ModelDropdown.label = graph2.seeds[0].model.name + " (" + graph2.seeds[0].model.isotope + ")";

            moduleData.graph2ModelDropdown.options.forEach((opt,ind) => {
                opt.x = canvas.width * 0.5;
                opt.y = canvas.height * 0.3 + (canvas.height * 0.2 / (moduleData.graph2ModelDropdown.options.length + 1)) * (ind + 1);
                opt.width = canvas.width * 0.125;
                opt.height = canvas.height * 0.2 / (moduleData.graph2ModelDropdown.options.length + 1);
            });

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
        let fontSizes = [];
        moduleData.graph1ModelDropdown.options.forEach((button) => fontSizes.push(getFontSize(button.width,button.height,button.label)));
        moduleData.graph1ModelDropdown.options.forEach((opt) => {
            opt.font = getMin(fontSizes) + "px monospace";
        });

        fontSizes = [];
        moduleData.graph2ModelDropdown.options.forEach((button) => fontSizes.push(getFontSize(button.width,button.height,button.label)));
        moduleData.graph2ModelDropdown.options.forEach((opt) => {
            opt.font = getMin(fontSizes) + "px monospace";
        });
    }
    if (module === "string of seeds"){
        let graph1 = moduleData.graph1;
        let addSeedButton = moduleData.addSeed;
        let deleteSeedButton = moduleData.deleteSeed;
        let seedSpacingSlider = moduleData.seedSpacingSlider;
        let airKermaSlider = moduleData.airKermaSlider;
        let graph1ModelDropdown = moduleData.graph1ModelDropdown.button
        let dwellTimeSlider = moduleData.dwellTimeSlider;

        graph1.width = Math.min(canvas.width,(canvas.height * 0.65) * 2.5);
        graph1.height = canvas.height * 0.65;
        graph1.x = (canvas.width - graph1.width) / 2;
        graph1.y = (canvas.height * 0.35) + (canvas.height * 0.65) - graph1.height;

        addSeedButton.x = 0;
        addSeedButton.y = canvas.height * 0.15;
        addSeedButton.width = canvas.width * 0.2;
        addSeedButton.height = canvas.height * 0.05;
        addSeedButton.outlineThickness = canvas.height * 0.008;

        seedSpacingSlider.x = canvas.width * 0.02;
        seedSpacingSlider.y = canvas.height * 0.3;
        seedSpacingSlider.thickness = canvas.height * 0.01;
        seedSpacingSlider.length = canvas.width * 0.18;

        deleteSeedButton.x = canvas.width * 0.5;
        deleteSeedButton.y = canvas.height * 0.15;
        deleteSeedButton.width = canvas.width * 0.2;
        deleteSeedButton.height = canvas.height * 0.05;
        deleteSeedButton.outlineThickness = canvas.height * 0.008;

        airKermaSlider.x = canvas.width * 0.5;
        airKermaSlider.y = canvas.height * 0.3;
        airKermaSlider.thickness = canvas.height * 0.01;
        airKermaSlider.length = deleteSeedButton.width;

        dwellTimeSlider.x = canvas.width * 0.75;
        dwellTimeSlider.y = canvas.height * 0.225;
        dwellTimeSlider.thickness = canvas.height * 0.01;
        dwellTimeSlider.length = deleteSeedButton.width;

        graph1ModelDropdown.x = canvas.width * 0.25;
        graph1ModelDropdown.y = canvas.height * 0.15;
        graph1ModelDropdown.width = canvas.width * 0.2;
        graph1ModelDropdown.height = canvas.height * 0.2 / (moduleData.graph1ModelDropdown.options.length + 1);
        graph1ModelDropdown.label = graph1.seeds[0].model.name + " (" + graph1.seeds[0].model.isotope + ")";

        moduleData.graph1ModelDropdown.options.forEach((opt,ind) => {
            opt.x = canvas.width * 0.25;
            opt.y = canvas.height * 0.15 + (canvas.height * 0.2 / (moduleData.graph1ModelDropdown.options.length + 1)) * (ind + 1);
            opt.width = canvas.width * 0.2;
            opt.height = canvas.height * 0.2 / (moduleData.graph1ModelDropdown.options.length + 1);
        });

        let fontSizes = [];
        moduleData.graph1ModelDropdown.options.forEach((button) => fontSizes.push(getFontSize(button.width,button.height,button.label)));
        moduleData.graph1ModelDropdown.options.forEach((opt) => {
            opt.font = getMin(fontSizes) + "px monospace";
        });

        graph1.seeds.forEach((seed,ind) => {
            seed.pos.x = (ind * moduleData.seedSpacing) - ((graph1.seeds.length - 1) * moduleData.seedSpacing / 2);
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
    moduleData.moduleSelectBar.forEach((button) => fontSizes.push(getFontSize(button.width,button.height,button.label)));
    moduleData.moduleSelectBar.forEach((opt) => {
        opt.font = getMin(fontSizes) + "px monospace";
    });
    render = true;
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
        moduleData.graph1ModelDropdown.checkDropdownClicked();
        moduleData.graph2ModelDropdown.checkDropdownClicked();
    }
    if (module === "string of seeds"){
        moduleData.graph1ModelDropdown.checkDropdownClicked();
        moduleData.addSeed.checkClicked();
        moduleData.deleteSeed.checkClicked();
        let seedRadius = 0.2 * (moduleData.graph1.width / (getMax(moduleData.graph1.xTicks) - getMin(moduleData.graph1.xTicks)));
        moduleData.graph1.seeds.forEach((seed,ind) => {
            let seedScreenPos = graphToScreenPos(seed.pos,moduleData.graph1,moduleData.divBoundGraph1)
            if (Math.sqrt((mouse.x - seedScreenPos.x)**2 + (mouse.y - seedScreenPos.y)**2) <= seedRadius){
                if (moduleData.selectedSeed == ind){
                    moduleData.selectedSeed = -1;
                }else{
                    moduleData.selectedSeed = ind;
                }
                moduleData.airKermaSlider.value = (
                    seed.model.HDRsource ?
                        ((seed.airKerma - airKermaSliderLimits.HDR.min) / (airKermaSliderLimits.HDR.max - airKermaSliderLimits.HDR.min))
                    : 
                        ((seed.airKerma - airKermaSliderLimits.LDR.min) / (airKermaSliderLimits.LDR.max - airKermaSliderLimits.LDR.min))
                );
                moduleData.dwellTimeSlider.value = (seed.dwellTime - 0.00833) / 0.15833;
            }
        });
    }
});
addEventListener("mouseup",function (e){
	updateMousePos(e);
	mouse.down = false;
});
function updateMousePos(e){
	mouse.x = e.clientX + scrollPos.x;
	mouse.y = e.clientY + scrollPos.y;
}

function magnitude(vec){
    return Math.sqrt(vec.x ** 2 + vec.y ** 2);
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
function getFontSize(width,height,label){
    return Math.min(1.5 * width / label.length,(height * 0.8));
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
    return 0.00833 + slider.value * 0.15833; // slider from 30 seconds to 10 minutes
}
function convertUnit(unit,newUnit){
    return parseFloat(unit.split(" ")[0]) * conversionFactors[newUnit][unit.split(" ")[1]];
}