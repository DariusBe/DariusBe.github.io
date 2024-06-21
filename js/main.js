import { WebGLRenderer } from './webgl.js';
import { PhysarumManager } from './physarum.js';


// main
const physarumManager = new PhysarumManager(100);
const webGLRenderer = new WebGLRenderer('webgl-canvas', physarumManager);