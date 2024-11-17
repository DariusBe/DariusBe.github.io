import { GLContext } from './GLContext.js';
import { Shader } from './Shader.js';
import { Utils } from './Utils.js';
import { ModelOBJ } from './ModelOBJ.js';
import '../gl-matrix-min.js';

/* FILES */
const topoVertCode = await Utils.readShaderFile('js/src/topoShader/topo.vert');
const topoFragCode = await Utils.readShaderFile('js/src/topoShader/topo.frag');
const blurVertCode = await Utils.readShaderFile('js/src/blurShader/blur.vert');
const blurFragCode = await Utils.readShaderFile('js/src/blurShader/blur.frag');
const canvasVertCode = await Utils.readShaderFile('js/src/canvasShader/canvas.vert');
const canvasFragCode = await await Utils.readShaderFile('js/src/canvasShader/canvas.frag');
const mapFile = 'testmap6.xyz';
var topoMap = await Utils.readXYZMapToTexture('js/src/topoShader/maps/' + mapFile);

/* DOM Elements */
const slider = document.getElementById('conv_slider');
var sliderLabel = document.getElementById('sliderlabel');
const checkbox = document.getElementById('cost_checkbox');
var hasSliderChanged = false;
var hasCheckboxChanged = false;

/* Globals */
const glContext = new GLContext();
const gl = glContext.gl;
glContext.listContextStats();
const shaderList = glContext.shaderList;
var tick = 0.0;
var decayFactor = 0.95;
var kernelSize = Math.abs(slider.value * 2 - 1);
var sigma = kernelSize / 4;
var uIsHorizontal = true;
const BYTE = 4;

/* Event Listeners */
slider.oninput = function () {
    hasSliderChanged = true;
    const val = Math.abs(this.value * 2 - 1);
    sliderLabel.innerHTML = val == 1 ? 'off' : val;
    kernelSize = val;
    sigma = val / 4;
}
checkbox.onchange = function () {
    hasCheckboxChanged = true;
}

// global uniforms
const globalUniforms = {
    uSampler: ['1i', 0],
    uSlider: ['1f', 0.5],
};

// console.error();

const globalAttributes = {
    'aPosition': [0, [3, 'FLOAT', false, 5 * BYTE, 0], Utils.canvasAttribs],
    'aTexCoord': [1, [2, 'FLOAT', false, 5 * BYTE, 3 * BYTE], Utils.canvasAttribs],
};

/* Topography Shader Definition */
const topoUniforms = Object.assign({}, globalUniforms, {
    uShowCursor: ['bool', false],
    uCheckbox: ['bool', checkbox.checked],
});
const topoShader = new Shader(
    gl,
    name = 'TopoShader',
    topoVertCode,
    topoFragCode,
    globalAttributes,
    topoUniforms
);

/* Blur Shader Definition */
const blurUniforms = Object.assign({}, globalUniforms, {
    uKernelSize: ['1i', kernelSize],
    uKernel: ['1fv', Utils.gaussKernel1D(kernelSize, sigma, false)],
    uIsHorizontal: ['1i', uIsHorizontal], // whether to blur horizontally or vertically in current pass
    uDecay: ['1f', 0.0],
    uShowCursor: ['bool', true],
});
const blurShader = new Shader(
    gl,
    name = 'BlurShader',
    blurVertCode,
    blurFragCode,
    globalAttributes,
    blurUniforms
);

/* Canvas Shader Definition */
const canvasShader = new Shader(
    gl,
    name = 'CanvasShader',
    canvasVertCode,
    canvasFragCode,
    globalAttributes,
    globalUniforms
);
glContext.setShaderGlobal(canvasShader);
glContext.setShaderGlobal(topoShader);
glContext.setShaderGlobal(blurShader);

/* Prepare Textures */
// Prepare Topography Map from Point Cloud
const size = topoMap[topoMap.length - 1];
topoMap = topoMap.slice(0, topoMap.length - 1);
topoMap = Utils.normalizePointCloud(topoMap);
// prepare topo texture
var toposurfaceTexture = topoShader.prepareImageTexture(
    "uSampler",
    topoMap,
    'TopoTexture',
    size, size,
    'LINEAR',
    'CLAMP_TO_EDGE'
);
// prepare empty cost surface texture (will be rendered into by topo shader)
var costsurfaceTex = blurShader.prepareImageTexture(
    "uSampler",
    Utils.getRandomStartTexture(size, size),
    'costsurfaceTex',
    size, size,
    'LINEAR',
    'CLAMP_TO_EDGE'
);
// prepare empty blur texture (will be rendered into by blur shader)
var intermediateBlurTex = blurShader.prepareImageTexture(
    "uSampler",
    Utils.getRandomStartTexture(size, size),
    'intermediateBlurTex',
    size, size
);
// prepare final canvas texture (will be rendered into by blur shader)
var canvasTexture = canvasShader.prepareImageTexture(
    "uSampler",
    Utils.getEmptyStartTexture(size, size),
    'canvasTex',
    size, size
);

/* Prepare FBOs */
topoShader.prepareFramebufferObject(
    gl.COLOR_ATTACHMENT0,
    costsurfaceTex, // FBO will render into this texture
    'Topo_FBO',
    canvas.width,
    canvas.height,
    gl.RGBA16F,
);
blurShader.prepareFramebufferObject(
    gl.COLOR_ATTACHMENT0,
    intermediateBlurTex, // FBO will render into this texture
    'horizontalBlurFBO',
    canvas.width,
    canvas.height,
    gl.RGBA16F,
);
blurShader.prepareFramebufferObject(
    gl.COLOR_ATTACHMENT0,
    canvasTexture, // FBO will render into this texture
    'verticalBlurFBO',
    canvas.width,
    canvas.height,
    gl.RGBA16F,
);
for (const shader of shaderList) {
    shader.getShaderDetails();
}

/* Prepare Matrix */

var uModel = glMatrix.mat4.create();
var uView = glMatrix.mat4.create();
var uProjection = glMatrix.mat4.create();

// populate uView matrix
glMatrix.mat4.lookAt(
    uView,
    [0, 0, 4],  // viewer's position (4 units away from center)
    [0, 0, 0],  // position viewer is looking at
    [0, 1, 0],  // up-axis
);

// populate uProjection matrix
const aspectRatio = gl.canvas.width / gl.canvas.height;
// args: in_matrix, fovy (vertical FoV in rad, smaller --> 'tele'), aspect_ratio, near, far (resp. distances of camera to near/far planes)
// glMatrix.mat4.perspective(
//     uProjection,
//     Math.PI / 6, // 90 degrees --> PI = 180, PI/1.5 = 120, PI/2 = 90 deg...
//     aspectRatio,
//     0.01,
//     8
// );
glMatrix.mat4.ortho(
    uProjection,
    // perspective defined as a bounding box
    // distance to.. left, right, bottom, top, near, far plane
    -1, 1, -1, 1,   0, 5 // bounding box as a unit cube that is stretched by factor 5 along z axis
);

function cameraTransform() {
    // populate uModel
    // glMatrix.mat4.rotate(uModel, uModel, 0.01, [0, 0.53, 0.25]);
    // glMatrix.mat4.scale(uModel, uModel, [.999, .999, .999]);
}

function updateUniforms() {
    tick += 0.01;
    cameraTransform();
    glContext.updateGlobalUniform('uTime', tick);
    gl.bindBuffer(gl.UNIFORM_BUFFER, glContext.globalUniformBuffer);
    glContext.updateGlobalUniform('uTime', tick);
    glContext.updateGlobalUniform('uModel', uModel);
    glContext.updateGlobalUniform('uView', uView);
    glContext.updateGlobalUniform('uProjection', uProjection);

    for (const shader of shaderList) {
        // glContext.updateGlobalUniform('uTime', tick);
        if (hasSliderChanged) {
            const kernel = Utils.gaussKernel1D(kernelSize, sigma, true);
            blurShader.updateUniform('uKernel', '1fv', kernel);
            blurShader.updateUniform('uKernelSize', '1i', kernelSize);
            hasSliderChanged = false;
        }
    }
    if (hasCheckboxChanged) {
        topoShader.updateUniform('uCheckbox', 'bool', checkbox.checked);
        hasCheckboxChanged = false;
    }

    gl.useProgram(null);
}
function swapBlurDirectionUniform() {
    // swap blur direction
    uIsHorizontal = !uIsHorizontal;
    blurShader.updateUniform('uIsHorizontal', '1i', uIsHorizontal);
    // swap textures
}
const renderLandscapes = () => {
    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // render TOPOGRAPHY into texture; in: topoSurfaceTexture --> out: costSurfaceTex
    gl.useProgram(topoShader.program);
    gl.bindVertexArray(topoShader.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, topoShader.fbo[0]);
    gl.bindTexture(gl.TEXTURE_2D, toposurfaceTexture);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // render horizontal BLUR with fbo_0; in costSurfaceTex --> out: intermediateBlurTex
    gl.useProgram(blurShader.program);
    gl.bindVertexArray(blurShader.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, blurShader.fbo[0]);
    gl.bindTexture(gl.TEXTURE_2D, costsurfaceTex);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    // render vertical BLUR with fbo_1; in intermediateBlurTex --> out: canvasTexture
    swapBlurDirectionUniform();
    gl.bindFramebuffer(gl.FRAMEBUFFER, blurShader.fbo[1]);
    gl.bindTexture(gl.TEXTURE_2D, intermediateBlurTex);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // render canvas texture
    gl.useProgram(canvasShader.program);
    gl.bindVertexArray(canvasShader.vao);
    gl.bindTexture(gl.TEXTURE_2D, canvasTexture);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
}
const animate = () => {
    updateUniforms();
    renderLandscapes();
    requestAnimationFrame(animate);
}

animate();
