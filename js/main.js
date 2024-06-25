import { PhysarumManager } from './physarum.js';
//import { WebGLRenderer } from './webgl.js';
import { WebGLRenderer } from './WGL.js';

// main
const physarumManager = new PhysarumManager(1000);

const webGLRenderer = new WebGLRenderer('webgl-canvas', physarumManager);