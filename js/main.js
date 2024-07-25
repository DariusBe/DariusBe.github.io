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

const attributes = {
    'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], Utils.canvasPoints],
};
const canvasVAO = Utils.prepareAttributes(gl, canvasProgram, attributes);

var uniforms = {
    uResolution: [[canvas.width, canvas.height], '2fv'],
    uMouse: [[15.0, 15.0, 2.0], '3fv'],
    uTime: [1.0, '1f'],
};
Utils.prepareUniform(gl, canvasProgram, uniforms);

gl.useProgram(canvasProgram);
gl.bindVertexArray(canvasVAO);
gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
