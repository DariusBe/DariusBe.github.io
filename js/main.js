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
const canvasProgramPaths = [ rootPath+'canvasShader/canvasVertexShader.glsl', rootPath+'canvasShader/canvasFragmentShader.glsl' ]; 
const canvasProgram = await Utils.prepareShaderProgram(gl, canvasProgramPaths[0], canvasProgramPaths[1]);

