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
gl.getExtension('EXT_color_buffer_float');
var tick = performance.now() / 1000;
const rootPath = 'js/src/';
var programList = [];

//* CANVAS PROGRAM *//
const canvasProgramPaths = [ rootPath+'testShader/testVertSh.glsl', rootPath+'testShader/testFragSh.glsl' ]; 
const canvasProgram = await Utils.prepareShaderProgram(gl, canvasProgramPaths[0], canvasProgramPaths[1]);
canvasProgram.name = 'canvasProgram';
programList.push(canvasProgram);

// CANVAS ATTRIBUTES
const canvasAttributes = {
    // location, [size, type, normalized, stride, offset], data
    'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], Utils.canvasPoints],
    'aTexCoord': [ 1, [2, 'FLOAT', false, 0, 0], Utils.quadTextCoords],
};
const canvasVAO = Utils.prepareAttributes(gl, canvasProgram, canvasAttributes);

// CANVAS UNIFORMS
var canvasUniforms = {uSampler: [0, '1i']};
Utils.prepareUniform(gl, canvasProgram, canvasUniforms);

// CANVAS TEXTURE
//const testMap = await Utils.loadImage('src/misc/random_grid.png');
var testMap = Utils.getRandomStartTexture(canvas.width, canvas.height, 0.5);
var randTexture = Utils.prepareImageTextureForProgram(gl, canvasProgram, canvasVAO, 'uSampler', testMap);

//* RULES PROGRAM *//
const rulesProgramPaths = [ rootPath+'rulesShader/rulesVertSh.glsl', rootPath+'rulesShader/rulesFragSh.glsl' ];
const rulesProgram = await Utils.prepareShaderProgram(gl, rulesProgramPaths[0], rulesProgramPaths[1]);
rulesProgram.name = 'rulesProgram';
programList.push(rulesProgram);

// RULES ATTRIBUTES
const rulesAttributes = {
    'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], Utils.canvasPoints],
    'aTexCoord': [ 1, [2, 'FLOAT', false, 0, 0], Utils.quadTextCoords],
};
const rulesVAO = Utils.prepareAttributes(gl, rulesProgram, rulesAttributes);

// RULES UNIFORMS
var rulesUniforms = {uSampler: [0, '1i']};
Utils.prepareUniform(gl, rulesProgram, rulesUniforms);

// RULES TEXTURE
// empty texture
var testMap2 = Utils.getEmptyStartTexture(canvas.width, canvas.height);
var emptyTexture = Utils.prepareImageTextureForProgram(gl, rulesProgram, rulesVAO, 'uSampler', testMap2);

// RULES FRAMEBUFFER
// const rulesFBO_full = Utils.prepareFramebufferObject(gl, rulesProgram, gl.COLOR_ATTACHMENT0, randTexture, canvas.width, canvas.height, gl.RGBA16F);
const rulesFBO_empty = Utils.prepareFramebufferObject(gl, rulesProgram, gl.COLOR_ATTACHMENT0, emptyTexture, canvas.width, canvas.height, gl.RGBA16F);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);

// UPDATE GLOBAL UNIFORMS FOR ALL PROGRAMS
var globalUniforms = {
    uResolution: [[canvas.width, canvas.height], '2fv'],
    uMouse: [[-0.5, -0.5, 0.0], '3fv'],
    uTime: [tick, '1f'],
};
for (const program of programList) {
    gl.useProgram(program);
    Utils.prepareUniform(gl, program, globalUniforms);
    gl.useProgram(null);
}

// var FBO_full = rulesFBO_full;
var FBO_empty = rulesFBO_empty;

// RENDER LOOP
const render = () => {
    requestAnimationFrame(render);

    // update time uniform
    tick += 0.01;
    gl.useProgram(canvasProgram);
    gl.uniform1f(gl.getUniformLocation(canvasProgram, 'uTime'), tick);
    gl.useProgram(rulesProgram);
    gl.uniform1f(gl.getUniformLocation(rulesProgram, 'uTime'), tick);

    // use framebuffer object to render into empty texture
    gl.useProgram(rulesProgram);
    gl.bindVertexArray(rulesVAO);
    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO_empty);
    gl.bindTexture(gl.TEXTURE_2D, randTexture);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);


    // // update rules program
    // gl.useProgram(rulesProgram);
    // gl.bindVertexArray(rulesVAO);
    // gl.bindFramebuffer(gl.FRAMEBUFFER, currentFBO);
    // gl.bindTexture(gl.TEXTURE_2D, nextFBO.texture);
    // gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // gl.bindVertexArray(null);


    // render canvas
    gl.useProgram(canvasProgram);
    gl.bindVertexArray(canvasVAO);
    gl.bindTexture(gl.TEXTURE_2D, emptyTexture);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);



    // // update rules program
    // gl.useProgram(rulesProgram);
    // gl.bindVertexArray(rulesVAO);
    // gl.bindFramebuffer(gl.FRAMEBUFFER, rulesFBO_1);
    // gl.bindTexture(gl.TEXTURE_2D, nextTexture);
    // gl.viewport(0,0, canvas.width, canvas.height);
    // gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // gl.bindVertexArray(null);
    // gl.bindTexture(gl.TEXTURE_2D, null);

    // // render canvas program
    // gl.useProgram(canvasProgram);
    // gl.bindVertexArray(canvasVAO);
    // gl.bindTexture(gl.TEXTURE_2D, currentTexture);
    // gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    // gl.bindTexture(gl.TEXTURE_2D, null);
    // gl.bindVertexArray(null);

};


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
    testMap = Utils.getRandomStartTexture(canvas.width, canvas.height, 0.5);
    randTexture = Utils.prepareImageTextureForProgram(gl, canvasProgram, canvasVAO, 'uSampler', testMap);
}
canvas.addEventListener('touchmove', touchmove);
canvas.addEventListener('mousemove', onmousemove);
window.addEventListener('resize', onresize);

render();