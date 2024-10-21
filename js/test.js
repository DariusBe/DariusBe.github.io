import { Utils } from "./Utils.js";
import { Shader } from './Shader.js';

let canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl2');
// set to lowest quality
gl.hint(gl.FRAGMENT_SHADER_DERIVATIVE_HINT, gl.NICEST);

// define global variables
const PARTICLE_COUNT = 5000;
const BUFFSIZE = PARTICLE_COUNT * 4 * 2;
var programList = [];
var tick = 0.0;
const basePath = 'js/src/';
let canvas_vertSource = basePath+'testShader/canvas/canv.vert';
let canvas_fragSource = basePath+'testShader/canvas/canv.frag';

let tf_vertSource = basePath+'testShader/tf/tf.vert';
let tf_fragSource = basePath+'testShader/tf/tf.frag';

let topoVertSource = basePath+'testShader/topo/topo.vert';
let topoFragSource = basePath+'testShader/topo/topo.frag';

// global uniforms
const uniforms = {
    uSampler: [0, '1i'],
    uResolution: [new Float32Array([window.innerWidth, window.innerHeight]), '2fv'],
    uTime: [tick, '1f'],
    uMouse: [new Float32Array([0.0, 0.0, 0.0]), '3fv'],
};

// // Transform Feedback Shader
// var TF_BUFF_1 = gl.createBuffer();
// var TF_DATA_1 = Utils.randomCoords(PARTICLE_COUNT);
// gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_1)
// gl.bufferData(gl.ARRAY_BUFFER, TF_DATA_1, gl.DYNAMIC_COPY);
// var TF_BUFF_2 = gl.createBuffer();
// var TF_DATA_2 =  Utils.randomCoords(PARTICLE_COUNT);
// gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_2)
// gl.bufferData(gl.ARRAY_BUFFER, TF_DATA_2, gl.DYNAMIC_COPY);
// gl.bindBuffer(gl.ARRAY_BUFFER, null);

// const tf_Shader = new Shader(
//     gl, 
//     name='TF_Shader', 
//     await Utils.readShaderFile(tf_vertSource), 
//     await Utils.readShaderFile(tf_fragSource), 
//     {'aPoints': [ 0, [2, 'FLOAT', false, 0, 0], Utils.randomCoords(PARTICLE_COUNT)],},
//     uniforms,
//     {
//         TF_varyings: ['vPoints'],
//         TF_mode: gl.SEPARATE_ATTRIBS,
//         TF_buffer: TF_BUFF_1,
//         TF_bufferSize: BUFFSIZE,
//     }
// );
// programList.push(tf_Shader.program);


// // Canvas Shader
// const canvas_Shader = new Shader(
//     gl,
//     name='Canvas_Shader',
//     await Utils.readShaderFile(canvas_vertSource),
//     await Utils.readShaderFile(canvas_fragSource),
//     { 'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], Utils.canvasPoints] },
//     uniforms
// );
// programList.push(canvas_Shader.program);

// XYZ Texture Shader
// const topoShader = new Shader(
//     gl,
//     name='TopoShader',
//     await Utils.readShaderFile(topoVertSource),
//     await Utils.readShaderFile(topoFragSource),
//     {   'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], Utils.canvasPoints],
//         'aTexCoord': [ 1, [2, 'FLOAT', false, 0, 0], Utils.quadTextCoords],
//     },
//     uniforms
// );

// const start = performance.now();
var topoMap = await Utils.readXYZMapToTexture(basePath+'testShader/topo/testmap6.xyz');
// // print time difference
// const end = performance.now();

const size = topoMap[topoMap.length-1];
topoMap = topoMap.slice(0, topoMap.length-1);
topoMap = Utils.normalizePointCloud(topoMap);

const topoShader = new Shader(
    gl,
    name='TopoShader',
    await Utils.readShaderFile(topoVertSource),
    await Utils.readShaderFile(topoFragSource),
    {   'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], Utils.canvasPoints],
        'aTexCoord': [ 1, [2, 'FLOAT', false, 0, 0], Utils.quadTextCoords],
    },
    uniforms
);

// save to file
//Utils.saveArrayToImageFile(topoMap, 'topoMap.png', size, size);

//console.info('Read and parsed map in', end - start, 'ms');
// save image file to local storage
topoShader.prepareImageTexture("uSampler", topoMap, 'TopoTexture', size, size);

programList.push(topoShader.program);

function updateUniforms() {
    tick += 0.01;
    for (const program of programList) {
        gl.useProgram(program);
        gl.uniform1f(gl.getUniformLocation(program, 'uTime'), tick);
    }
    gl.useProgram(null);
}

// function swapTFBuffers() {
//     const T = TF_DATA_1;
//     TF_DATA_1 = TF_DATA_2;
//     TF_DATA_2 = T;
// }



// animate
const animate = () => {
    updateUniforms();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // gl.useProgram(tf_Shader.program);
    // gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_1)
    // gl.bindVertexArray(tf_Shader.vao);
    // gl.enable(gl.RASTERIZER_DISCARD);
    // if (tf_Shader.tfBuffer !== null) {
    //     gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, TF_BUFF_2);
    // }
    // gl.beginTransformFeedback(gl.POINTS);
    // gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
    // gl.endTransformFeedback();
    // gl.bindVertexArray(null);
    // gl.useProgram(null);
    // gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

    // gl.disable(gl.RASTERIZER_DISCARD);


    // // fill canvas buffer with transformed points
    // gl.useProgram(canvas_Shader.program);
    // gl.bindVertexArray(canvas_Shader.vao);
    // gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_2);
    // gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    // gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
    // gl.bindVertexArray(null);
    // gl.useProgram(null);


    // swapTFBuffers();

    // render XYZ texture
    
    gl.useProgram(topoShader.program);
    gl.bindVertexArray(topoShader.vao);

    gl.bindTexture(gl.TEXTURE_2D, topoShader.textureList[0]);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.bindVertexArray(null);
    gl.useProgram(null);
    
    requestAnimationFrame(animate);
}

animate();



/* EVENT HANDLERS*/
const onmousemove = (e) => {
    const pressedButton = e.buttons === 1 ? 1.0 : 0.0;
    const mouse = new Float32Array([e.clientX / canvas.width, 1-(e.clientY / canvas.height), pressedButton]);
    
    for (const program of programList) {
        gl.useProgram(program);
        gl.uniform3fv(gl.getUniformLocation(program, 'uMouse'), mouse);
    }
};
const touchmove = (e) => {
    e.preventDefault(); // prevent scrolling
    var touch = e.touches[0];
    // update mouse uniform
    const pressedButton = 1.0;
    var mouse = new Float32Array([touch.clientX / canvas.width, 1-(touch.clientY / canvas.height), pressedButton]);
    for (const program of programList) {
        gl.useProgram(program);
        gl.uniform3fv(gl.getUniformLocation(program, 'uMouse'), mouse);
    }
}
const onresize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    for (const program of programList) {
        gl.useProgram(program);
        gl.uniform2fv(gl.getUniformLocation(program, 'uResolution'), new Float32Array([window.innerWidth, window.innerHeight]));
    }
}
canvas.addEventListener('touchmove', touchmove);
canvas.addEventListener('mousemove', onmousemove);
window.addEventListener('resize', onresize);