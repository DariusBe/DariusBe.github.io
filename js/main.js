import { PhysarumManager } from './physarum.js';
//import { WebGLRenderer } from './webgl.js';
import { WebGLRenderer } from './webGL.js';
import { Utils } from './Utils.js';

// main
// const physarumManager = new PhysarumManager();
// const webGLRenderer = new WebGLRenderer('webgl-canvas');

/* GLOBALS */
const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl2');
var tick = performance.now() / 1000;
const rootPath = 'js/src/';
var programList = [];

// CANVAS PROGRAM
const canvasProgramPaths = [ rootPath+'testShader/testVertSh.glsl', rootPath+'testShader/testFragSh.glsl' ]; 
const canvasProgram = await Utils.prepareShaderProgram(gl, canvasProgramPaths[0], canvasProgramPaths[1]);
canvasProgram.name = 'canvasProgram';
programList.push(canvasProgram);

// CANVAS ATTRIBUTES
const canvasAttributes = {
    'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], Utils.canvasPoints],
    'aTexCoord': [ 1, [2, 'FLOAT', false, 0, 0], Utils.quadTextCoords],
};
const canvasVAO = Utils.prepareAttributes(gl, canvasProgram, canvasAttributes);

// CANVAS UNIFORMS
var canvasUniforms = {uSampler: [0, '1i']};
Utils.prepareUniform(gl, canvasProgram, canvasUniforms);

// CANVAS TEXTURE
const testMap = await Utils.loadImage('src/misc/testmap.png');
const texture = Utils.prepareImageTextureForProgram(gl, canvasProgram, canvasVAO, 'uSampler', testMap);

// EVENT HANDLERS
const onmousemove = (e) => {
    const pressedButton = e.buttons === 1 ? 1.0 : 0.0;
    const mouse = new Float32Array([e.clientX / canvas.width, 1-(e.clientY / canvas.height), pressedButton]);
    
    for (const program of programList) {
        gl.useProgram(program);
        gl.uniform3fv(gl.getUniformLocation(program, 'uMouse'), mouse);
    }
    // further programs here
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

const onresize = (e) => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    gl.useProgram(canvasProgram);
    for (const program of programList) {
        gl.useProgram(program);
        gl.uniform2fv(gl.getUniformLocation(program, 'uResolution'), new Float32Array([window.innerWidth, window.innerHeight]));
    }
}
canvas.addEventListener('touchmove', touchmove);
canvas.addEventListener('mousemove', onmousemove);
window.addEventListener('resize', onresize);

// UPDATE GLOBAL UNIFORMS FOR ALL PROGRAMS
var globalUniforms = {
    uResolution: [[canvas.width, canvas.height], '2fv'],
    uMouse: [[0.0, 0.0, 0.0], '3fv'],
    uTime: [tick, '1f'],
};
for (const program of programList) {
    gl.useProgram(program);
    Utils.prepareUniform(gl, program, globalUniforms);
}

// RENDER LOOP
const render = () => {
    // update time uniform
    tick += 0.01;
    gl.useProgram(canvasProgram);
    gl.uniform1f(gl.getUniformLocation(canvasProgram, 'uTime'), tick);
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(canvasProgram);
    gl.bindVertexArray(canvasVAO);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    requestAnimationFrame(render);
};

render();