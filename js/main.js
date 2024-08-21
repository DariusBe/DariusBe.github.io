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
var tick = 0.0;
const rootPath = 'js/src/';
var programList = [];

// set canvas size to window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
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
const rulesVAO_1 = Utils.prepareAttributes(gl, rulesProgram, rulesAttributes);
const rulesVAO_2 = Utils.prepareAttributes(gl, rulesProgram, rulesAttributes);

// RULES UNIFORMS
var rulesUniforms = {uSampler: [0, '1i']};
Utils.prepareUniform(gl, rulesProgram, rulesUniforms);

// RULES TEXTURE
// random texture from image using Utils.loadImage
// before continuing, wait for image to load
var randMap = await Utils.loadImage("../src/misc/testmap.png");
var randTexture = Utils.prepareImageTextureForProgram(gl, rulesProgram, rulesVAO_1, 'uSampler', randMap, 'randMap');
// empty texture
var emptyMap = Utils.getEmptyStartTexture(canvas.width, canvas.height);
var emptyTexture = Utils.prepareImageTextureForProgram(gl, rulesProgram, rulesVAO_2, 'uSampler', emptyMap, 'emptyMap');

// RULES FRAMEBUFFER
const rulesFBO_full = Utils.prepareFramebufferObject(gl, rulesProgram, gl.COLOR_ATTACHMENT0, randTexture, canvas.width, canvas.height, gl.RGBA16F);
const rulesFBO_empty = Utils.prepareFramebufferObject(gl, rulesProgram, gl.COLOR_ATTACHMENT0, emptyTexture, canvas.width, canvas.height, gl.RGBA16F);

// PREPARING TEXTURES AND SAMPLERS
var canvasMap = Utils.getRandomStartTexture(canvas.width, canvas.height);

console.debug(canvasMap);
var canvasTexture = Utils.prepareImageTextureForProgram(gl, canvasProgram, canvasVAO, 'uSampler', canvasMap, 'canvasMap');
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

var FBO = rulesFBO_full;
var tex = emptyTexture;
var rulesVAO = rulesVAO_1;

// bind tex to canvasVAO
gl.useProgram(canvasProgram);
gl.bindVertexArray(canvasVAO);
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, randTexture);
gl.uniform1i(gl.getUniformLocation(canvasProgram, 'uSampler'), 0);
gl.bindTexture(gl.TEXTURE_2D, null);
gl.bindVertexArray(null);

function updateUniforms() {
    tick += 1.0;
    gl.useProgram(canvasProgram);
    gl.uniform1f(gl.getUniformLocation(canvasProgram, 'uTime'), tick);
    gl.useProgram(rulesProgram);
    gl.uniform1f(gl.getUniformLocation(rulesProgram, 'uTime'), tick);
}

function renderToTexture() {
    gl.useProgram(rulesProgram);
    gl.bindVertexArray(rulesVAO);
    // update sampler uniform
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, canvasTexture);
    gl.uniform1i(gl.getUniformLocation(rulesProgram, 'uSampler'), 0);
    // bind framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.useProgram(null);
}

function renderToScreen() {
    gl.useProgram(canvasProgram);
    gl.bindVertexArray(canvasVAO);
    // update sampler uniform
    gl.bindTexture(gl.TEXTURE_2D, canvasTexture);
    gl.uniform1i(gl.getUniformLocation(canvasProgram, 'uSampler'), 0);
    // draw to screen
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);
    canvasTexture = tex;
}

function swapFBOsAndTextures() {
    FBO = (FBO === rulesFBO_empty) ? rulesFBO_full : rulesFBO_empty;
    tex = (tex === randTexture) ? emptyTexture : randTexture;
    rulesVAO = (rulesVAO === rulesVAO_1) ? rulesVAO_2 : rulesVAO_1;
}

function updateSamplerUniform(program, canvasTexture, samplerName='uSampler') {
    gl.useProgram(program);
    gl.bindTexture(gl.TEXTURE_2D, canvasTexture);
    gl.uniform1i(gl.getUniformLocation(program, samplerName), 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.useProgram(null);
}

function renderLoop() {
    requestAnimationFrame(renderLoop);

    updateUniforms();
    renderToTexture();
    
    gl.useProgram(canvasProgram);
        // if (tick % 15 == 0) {
        swapFBOsAndTextures();
        updateSamplerUniform(canvasProgram, canvasTexture);
        console.debug(FBO.name, 'rendering into', canvasTexture.name);
        renderToScreen();
        // }    
}

// Start the rendering loop
renderLoop();

// renderToTexture();
// swapFBOsAndTextures();
// renderToScreen();

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

// render();