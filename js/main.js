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
// update mouse
var mouse = [0.0, 0.0, 0.0];
const onmousemove = (e) => {
    const pressedButton = e.buttons === 1 ? 1.0 : 0.0;
    var mouse = new Float32Array([e.clientX / canvas.width, 1-(e.clientY / canvas.height), pressedButton]);
    gl.useProgram(canvasProgram);
    gl.uniform3fv(gl.getUniformLocation(canvasProgram, 'uMouse'), mouse);
};
const touchstart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    mouse = new Float32Array([x / canvas.width, 1-(y / canvas.height), 1.0]);
    gl.uniform3fv(gl.getUniformLocation(canvasProgram, 'uMouse'), mouse);
}
canvas.addEventListener('touchstart', touchstart);
canvas.addEventListener('mousemove', onmousemove);


const canvasProgram = await Utils.prepareShaderProgram(gl, canvasProgramPaths[0], canvasProgramPaths[1]);
canvasProgram.name = 'canvasProgram';

const attributes = {
    'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], Utils.canvasPoints],
};
const canvasVAO = Utils.prepareAttributes(gl, canvasProgram, attributes);

var uniforms = {
    uResolution: [[canvas.width, canvas.height], '2fv'],
    uMouse: [mouse, '3fv'],
    uTime: [1.0, '1f'],
};
Utils.prepareUniform(gl, canvasProgram, uniforms);

gl.clearColor(0.0, 0.0, 0.0, 1.0);

// requestAnimationFrame
const render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(canvasProgram);
    gl.bindVertexArray(canvasVAO);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    requestAnimationFrame(render);
};

render();
