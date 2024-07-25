import { PhysarumManager } from './physarum.js';
//import { WebGLRenderer } from './webgl.js';
import { WebGLRenderer } from './webGL.js';
import { Utils } from './Utils.js';

// main
// const physarumManager = new PhysarumManager();
// const webGLRenderer = new WebGLRenderer('webgl-canvas');
const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl2');
const rootPath = 'js/src/';
const canvasProgramPaths = [ rootPath+'testShader/testVertSh.glsl', rootPath+'testShader/testFragSh.glsl' ]; 

const canvasProgram = await Utils.prepareShaderProgram(gl, canvasProgramPaths[0], canvasProgramPaths[1]);
canvasProgram.name = 'canvasProgram';

// CANVAS ATTRIBUTES
const attributes = {
    'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], Utils.canvasPoints],
    'aTexCoord': [ 1, [2, 'FLOAT', false, 0, 0], Utils.quadTextCoords],
};
const canvasVAO = Utils.prepareAttributes(gl, canvasProgram, attributes);

// CANVAS UNIFORMS
var uniforms = {
    uResolution: [[canvas.width, canvas.height], '2fv'],
    uMouse: [[0.0, 0.0, 0.0], '3fv'],
    uTime: [1.0, '1f'],
    uSampler: [0, '1i'], // texture unit
};
Utils.prepareUniform(gl, canvasProgram, uniforms);

// CANVAS TEXTURE
// load image 
const testMap = await Utils.loadImage('src/misc/testmap.png');
const texture = Utils.prepareImageTextureForProgram(gl, canvasProgram, canvasVAO, 'uSampler', testMap);

// EVENT HANDLERS
const onmousemove = (e) => {
    const pressedButton = e.buttons === 1 ? 1.0 : 0.0;
    const mouse = new Float32Array([e.clientX / canvas.width, 1-(e.clientY / canvas.height), pressedButton]);
    
    gl.useProgram(canvasProgram);
    gl.uniform3fv(gl.getUniformLocation(canvasProgram, 'uMouse'), mouse);
    // further programs here
};
const touchmove = (e) => {
    e.preventDefault(); // prevent scrolling
    var touch = e.touches[0];
    // update mouse uniform
    const pressedButton = 1.0;
    var mouse = new Float32Array([touch.clientX / canvas.width, 1-(touch.clientY / canvas.height), pressedButton]);
    gl.useProgram(canvasProgram);
    gl.uniform3fv(gl.getUniformLocation(canvasProgram, 'uMouse'), mouse);
}
const onresize = (e) => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    gl.useProgram(canvasProgram);
    gl.uniform2fv(gl.getUniformLocation(canvasProgram, 'uResolution'), new Float32Array([window.innerWidth, window.innerHeight]));
}
canvas.addEventListener('touchmove', touchmove);
canvas.addEventListener('mousemove', onmousemove);
window.addEventListener('resize', onresize);

// RENDER LOOP
const render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(canvasProgram);
    gl.bindVertexArray(canvasVAO);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    requestAnimationFrame(render);
};

render();