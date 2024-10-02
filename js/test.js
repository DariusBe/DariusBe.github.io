import { Utils } from "./Utils.js";
import { Shader } from './Shader.js';

// main
// const webGLRenderer = new WebGLRenderer('webgl-canvas');
const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl2');
gl.getExtension('EXT_color_buffer_float');
if (!gl) {
    console.error('WebGL2 is not supported in your browser');
}

// define global variables
const PARTICLE_COUNT = 5000;
const BUFFSIZE = PARTICLE_COUNT * 4 * 2;
var programList = [];
var tick = 0.0;
const basePath = 'js/src/';
let canvas_vertSource = basePath+'testShader/canvas/canv_vert.glsl';
let canvas_fragSource = basePath+'testShader/canvas/canv_frag.glsl';
let tf_vertSource = basePath+'testShader/tf/tf_vert.glsl';
let tf_fragSource = basePath+'testShader/tf/tf_frag.glsl';

// global uniforms
const uniforms = {
    uResolution: [new Float32Array([window.innerWidth, window.innerHeight]), '2fv'],
    uTime: [tick, '1f'],
    uMouse: [new Float32Array([0.0, 0.0, 0.0]), '3fv'],
};

// Transform Feedback Shader
var TF_BUFF_1 = gl.createBuffer();
var TF_DATA_1 = Utils.randomCoords(PARTICLE_COUNT);
gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_1)
gl.bufferData(gl.ARRAY_BUFFER, TF_DATA_1, gl.DYNAMIC_COPY);
var TF_BUFF_2 = gl.createBuffer();
var TF_DATA_2 =  Utils.randomCoords(PARTICLE_COUNT);
gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_2)
gl.bufferData(gl.ARRAY_BUFFER, TF_DATA_2, gl.DYNAMIC_COPY);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

const tf_Shader = new Shader(
    gl, 
    name='TF_Shader', 
    await Utils.readShaderFile(tf_vertSource), 
    await Utils.readShaderFile(tf_fragSource), 
    {'aPoints': [ 0, [2, 'FLOAT', false, 0, 0], Utils.randomCoords(PARTICLE_COUNT)],},
    uniforms,
    {
        TF_varyings: ['vPoints'],
        TF_mode: gl.SEPARATE_ATTRIBS,
        TF_buffer: TF_BUFF_1,
        TF_bufferSize: BUFFSIZE,
    }
);
programList.push(tf_Shader.program);


// Canvas Shader
const canvas_Shader = new Shader(
    gl,
    name='Canvas_Shader',
    await Utils.readShaderFile(canvas_vertSource),
    await Utils.readShaderFile(canvas_fragSource),
    { 'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], Utils.canvasPoints] },
    uniforms
);
programList.push(canvas_Shader.program);

function updateUniforms() {
    tick += 0.01;
    for (const program of programList) {
        gl.useProgram(program);
        gl.uniform1f(gl.getUniformLocation(program, 'uTime'), tick);
    }
    gl.useProgram(null);
}

function swapTFBuffers() {
    const T = TF_DATA_1;
    TF_DATA_1 = TF_DATA_2;
    TF_DATA_2 = T;
}

// animate
const animate = () => {
    updateUniforms();

    // gl.clearColor(1.0, 1.0, 1.0, 1.0);
    // gl.clear(gl.COLOR_BUFFER_BIT);
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
// const onresize = (e) => {
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight;
//     gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
//     for (const program of programList) {
//         gl.useProgram(program);
//         gl.uniform2fv(gl.getUniformLocation(program, 'uResolution'), new Float32Array([window.innerWidth, window.innerHeight]));
//     }
//     randMap = Utils.getRandomStartTexture(canvas.width, canvas.height, 0.5);
//     gl.useProgram(canvasProgram);
//     gl.bindVertexArray(canvasVAO);
//     gl.activeTexture(gl.TEXTURE0);
//     gl.bindTexture(gl.TEXTURE_2D, tex);
//     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, window.innerWidth, window.innerHeight, 0, gl.RGBA, gl.FLOAT, textureData);    gl.uniform1i(gl.getUniformLocation(canvasProgram, 'uSampler'), 0);
//     gl.bindTexture(gl.TEXTURE_2D, null);
// }
canvas.addEventListener('touchmove', touchmove);
canvas.addEventListener('mousemove', onmousemove);
window.addEventListener('resize', onresize);