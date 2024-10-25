import { PhysarumManager } from '../../js/physarum.js';
//import { WebGLRenderer } from './webgl.js';
import { WebGLRenderer } from './webGL.js';
import { Utils } from '../../js/Utils.js';

// main
// const physarumManager = new PhysarumManager();
// const webGLRenderer = new WebGLRenderer('webgl-canvas');

/* GLOBALS */
const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl2');
gl.getExtension('EXT_color_buffer_float');
var tick = 0.0;
const rootPath = 'js/src/';
var programList = [];

/* Physarum Simulation Values */
const particleCount = 1000;
const distance = 12.0;
const angle = 22.5;
const decayFactor = 0.85;

// set canvas size to window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

//* CANVAS PROGRAM *//
const canvasProgramPaths = [ rootPath+'canvasShader/canvasVertSh.glsl', rootPath+'canvasShader/canvasFragSh.glsl' ]; 
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


//* RULES PROGRAM *//
const rulesProgramPaths = [ rootPath+'rulesShader/rulesVertSh.glsl', rootPath+'rulesShader/rulesFragSh.glsl' ];
const rulesProgram = await Utils.prepareShaderProgram(gl, rulesProgramPaths[0], rulesProgramPaths[1]);
rulesProgram.name = 'rulesProgram';
programList.push(rulesProgram);
// RULES ATTRIBUTES
const rulesAttributes = {
    'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], Utils.canvasPoints],
    'aTexCoord': [ 1, [2, 'FLOAT', false, 0, 0], Utils.quadTextCoords]
};
const rulesVAO = Utils.prepareAttributes(gl, rulesProgram, rulesAttributes);
// RULES UNIFORMS
var rulesUniforms = {
    uSampler: [0, '1i'],
    uParticleCount: [particleCount, '1f'],
    uDistance: [distance, '1f'],
    uAngle: [angle, '1f']
};
Utils.prepareUniform(gl, rulesProgram, rulesUniforms);
// RULES TEXTURE
var randMap = await Utils.loadImage("./src/misc/testmap2.png");
var randTexture = Utils.prepareImageTextureForProgram(gl, rulesProgram, rulesVAO, 'uSampler', randMap, 'randMap');
// empty texture
var emptyMap = Utils.getEmptyStartTexture(canvas.width, canvas.height);
var emptyTexture = Utils.prepareImageTextureForProgram(gl, rulesProgram, rulesVAO, 'uSampler', emptyMap, 'emptyMap');
// RULES FRAMEBUFFERS
const rulesFBO_full = Utils.prepareFramebufferObject(gl, rulesProgram, gl.COLOR_ATTACHMENT0, randTexture, canvas.width, canvas.height, gl.RGBA16F);
const rulesFBO_empty = Utils.prepareFramebufferObject(gl, rulesProgram, gl.COLOR_ATTACHMENT0, emptyTexture, canvas.width, canvas.height, gl.RGBA16F);


//* CONVOLUTION PROGRAM *//
const blurProgramPaths = [ rootPath+'blurShader/blurVertSh.glsl', rootPath+'blurShader/blurFragSh.glsl' ];
const blurProgram = await Utils.prepareShaderProgram(gl, blurProgramPaths[0], blurProgramPaths[1]);
blurProgram.name = 'blurProgram';
programList.push(blurProgram);
// CONVOLUTION ATTRIBUTES
const blurAttributes = {
    'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], Utils.canvasPoints],
    'aTexCoord': [ 1, [2, 'FLOAT', false, 0, 0], Utils.quadTextCoords]
};
const blurVAO = Utils.prepareAttributes(gl, blurProgram, blurAttributes);
// CONVOLUTION UNIFORMS
var blurUniforms = {
    uSampler: [0, '1i'],
    uResolution: [[canvas.width, canvas.height], '2fv'],
    uKernel: [Utils.gaussKernel1D(5, 1), '1fv'],
    uDecay: [decayFactor, '1f'],
};
Utils.prepareUniform(gl, blurProgram, blurUniforms);
// CONVOLUTION TEXTURE
var blurMap = Utils.getEmptyStartTexture(canvas.width, canvas.height);
var blurTexture = Utils.prepareImageTextureForProgram(gl, blurProgram, blurVAO, 'uSampler', blurMap, 'blurMap');
// CONVOLUTION FRAMEBUFFERS
const blurFBO = Utils.prepareFramebufferObject(gl, blurProgram, gl.COLOR_ATTACHMENT0, blurTexture, canvas.width, canvas.height, gl.RGBA16F);

/* PREPARING TEXTURES AND SAMPLERS */
var FBO = rulesFBO_full;
var tex = Utils.prepareImageTextureForProgram(gl, canvasProgram, canvasVAO, 'uSampler', randMap, 'canvasMap');

/* UPDATE GLOBAL UNIFORMS FOR ALL PROGRAMS */
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

/* Bind Tex to canvasVAO */
// gl.useProgram(canvasProgram);
// gl.bindVertexArray(canvasVAO);
// gl.activeTexture(gl.TEXTURE0);
// gl.bindTexture(gl.TEXTURE_2D, randTexture);
// gl.uniform1i(gl.getUniformLocation(canvasProgram, 'uSampler'), 0);
// gl.bindTexture(gl.TEXTURE_2D, null);
// gl.bindVertexArray(null);

function updateUniforms() {
    tick += 1.0;
    for (const program of programList) {
        gl.useProgram(program);
        gl.uniform1f(gl.getUniformLocation(program, 'uTime'), tick);
    }
    gl.useProgram(null);
}

function swapFBOsAndTextures() {
    // @TODO for better performance, remove conditional
    FBO = (FBO === rulesFBO_empty) ? rulesFBO_full : rulesFBO_empty;
    tex = (tex === randTexture) ? emptyTexture : randTexture;
}

function renderToTexture() {
    gl.useProgram(rulesProgram);
    gl.bindVertexArray(rulesVAO);
    // update sampler uniform
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(rulesProgram, 'uSampler'), 0);
    // bind framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.useProgram(null);
}

function applyBlur() {
    gl.useProgram(blurProgram);
    gl.bindVertexArray(blurVAO);
    // update sampler uniform
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(blurProgram, 'uSampler'), 0);
    // bind framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, blurFBO);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    // unbind
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.useProgram(null);
    // swap textures
    tex = blurTexture;
}

function renderToScreen() {
    gl.useProgram(canvasProgram);
    gl.bindVertexArray(canvasVAO);
    // update sampler uniform
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(canvasProgram, 'uSampler'), 0);
    // draw to screen
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);
}



function renderLoop() {
    requestAnimationFrame(renderLoop);
    updateUniforms();
    renderToTexture();
    if (tick % 100 === 0) {
        Utils.readTextureData(gl, tex, canvas.width, canvas.height);
    }
    swapFBOsAndTextures();
    renderToScreen();
    applyBlur();
}
renderLoop();

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
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    for (const program of programList) {
        gl.useProgram(program);
        gl.uniform2fv(gl.getUniformLocation(program, 'uResolution'), new Float32Array([window.innerWidth, window.innerHeight]));
    }
    randMap = Utils.getRandomStartTexture(canvas.width, canvas.height, 0.5);
    gl.useProgram(canvasProgram);
    gl.bindVertexArray(canvasVAO);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, window.innerWidth, window.innerHeight, 0, gl.RGBA, gl.FLOAT, textureData);    gl.uniform1i(gl.getUniformLocation(canvasProgram, 'uSampler'), 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
}
canvas.addEventListener('touchmove', touchmove);
canvas.addEventListener('mousemove', onmousemove);
window.addEventListener('resize', onresize);