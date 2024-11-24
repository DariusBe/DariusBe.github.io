import { GLContext } from './GLContext.js';
import { Shader } from './Shader.js';
import { Utils } from './Utils.js';
import { ModelOBJ } from './ModelOBJ.js';
import '../gl-matrix-min.js';

/* FILES */
const topoVertCode = await Utils.readShaderFile('js/src/topoShader/topo.vert');
const topoFragCode = await Utils.readShaderFile('js/src/topoShader/topo.frag');
const physarumVertCode = await Utils.readShaderFile('js/src/physarumShader/physarum.vert');
const physarumfragCode = await Utils.readShaderFile('js/src/physarumShader/physarum.frag');
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
const PARTICLE_COUNT = 100;
const BYTE = 4;

const glContext = new GLContext();
const gl = glContext.gl;
glContext.listContextStats();
const shaderList = glContext.shaderList;
var tick = 0.0;
var kernelSize = Math.abs(slider.value * 2 - 1);
var sigma = kernelSize / 4;
var uIsHorizontal = true;


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

// global uniforms and attributes
const globalUniforms = {
    uSampler: ['1i', 0],
    uSlider: ['1f', 0.5],
};
const globalAttributes = {
    'aPosition': [0, [3, 'FLOAT', false, 5 * BYTE, 0], Utils.canvasAttribs],
    'aTexCoord': [1, [2, 'FLOAT', false, 5 * BYTE, 3 * BYTE], Utils.canvasAttribs],
};

/* TOPO */
const topoUniforms = Object.assign({}, globalUniforms, {
    uShowCursor: ['bool', false],
    uCheckbox: ['bool', checkbox.checked],
});
const topoShader = new Shader(gl,
    name = 'TopoShader',
    topoVertCode, topoFragCode,
    globalAttributes, topoUniforms
);

/* PHYSARUM */
const physarumUniforms = Object.assign({}, globalUniforms, {
    uParticleCount: ['1i', 250],
    uSensorAngle: ['1f', Math.PI],
    uSensorDistance: ['1f', 5],
    uParticleSampler: ['1i', 0],
});
const physarumShader = new Shader(gl,
    name = 'PhysarumShader',
    physarumVertCode, physarumfragCode,
    globalAttributes, physarumUniforms
);

/* BLUR */
const blurUniforms = Object.assign({}, globalUniforms, {
    uKernelSize: ['1i', kernelSize],
    uKernel: ['1fv', Utils.gaussKernel1D(kernelSize, sigma, false)],
    uIsHorizontal: ['1i', uIsHorizontal], // whether to blur horizontally or vertically in current pass
    uDecay: ['1f', 0.0],
    uShowCursor: ['bool', true],
});
const blurShader = new Shader(gl,
    name = 'BlurShader',
    blurVertCode, blurFragCode,
    globalAttributes, blurUniforms
);

/* CANVAS */
const canvasShader = new Shader(gl,
    name = 'CanvasShader',
    canvasVertCode, canvasFragCode,
    globalAttributes, globalUniforms
);

glContext.setShaderGlobal(topoShader);
glContext.setShaderGlobal(physarumShader);
glContext.setShaderGlobal(blurShader);
glContext.setShaderGlobal(canvasShader);

/* PREPARE TEXTURES */
// Prepare Topography Map from Point Cloud
const size = topoMap[topoMap.length - 1];
topoMap = topoMap.slice(0, topoMap.length - 1);
topoMap = Utils.normalizePointCloud(topoMap);
// prepare topo texture
var toposurfaceTex = topoShader.prepareImageTexture(
    "uSampler",
    topoMap,
    'TopoTexture',
    size, size,
    'LINEAR',
    'CLAMP_TO_EDGE'
);
// prepare empty cost surface texture (will be rendered into by topo shader)
var costsurfaceTex = physarumShader.prepareImageTexture(
    "uSampler",
    Utils.getRandomStartTexture(size, size),
    'costsurfaceTex',
    size, size,
    'LINEAR',
    'CLAMP_TO_EDGE'
);
// prepare empty particle texture
var particleTex = physarumShader.prepareImageTexture(
    "uParticleSampler",
    Utils.getRandomStartTexture(size, size),
    'ParticleTexture',
    size, size,
    'LINEAR',
    'CLAMP_TO_EDGE',
    'TEXTURE1'
);
// prepare empty cost surface texture (will be rendered into by physarum shader)
var horizontalBlurTex = blurShader.prepareImageTexture(
    "uSampler",
    Utils.getRandomStartTexture(size, size),
    'horizontalBlurTex',
    size, size,
    'LINEAR',
    'CLAMP_TO_EDGE'
);
// prepare empty blur texture (will be rendered into by blur shader)
var verticalBlurTex = blurShader.prepareImageTexture(
    "uSampler",
    Utils.getRandomStartTexture(size, size),
    'verticalBlurTex',
    size, size
);
// prepare final canvas texture (will be rendered into by blur shader)
var canvasTexture = canvasShader.prepareImageTexture(
    "uSampler",
    Utils.getEmptyStartTexture(size, size),
    'canvasTex',
    size, size
);

/* PREPARE FBOs */
topoShader.prepareFramebufferObject(
    gl.COLOR_ATTACHMENT0,
    costsurfaceTex, // FBO will render into this texture
    'Topo_FBO',
    canvas.width,
    canvas.height,
    gl.RGBA16F,
);
physarumShader.prepareFramebufferObject(
    gl.COLOR_ATTACHMENT0,
    horizontalBlurTex, // FBO will render into this texture
    'Physarum_FBO',
    canvas.width,
    canvas.height,
    gl.RGBA16F,
);
blurShader.prepareFramebufferObject(
    gl.COLOR_ATTACHMENT0,
    verticalBlurTex, // FBO will render into this texture
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

function updateUniforms() {
    tick += 0.01;
    // glContext.cameraTransform();

    glContext.updateGlobalUniform('uTime', tick);
    gl.bindBuffer(gl.UNIFORM_BUFFER, glContext.globalUniformBuffer);
    glContext.updateGlobalUniform('uTime', tick);
    glContext.updateGlobalUniform('uModel', glContext.uModel);
    glContext.updateGlobalUniform('uView', glContext.uView);
    glContext.updateGlobalUniform('uProjection', glContext.uProjection);

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
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // render TOPOGRAPHY into texture; in: topoSurfaceTexture --> out: costSurfaceTex
    gl.useProgram(topoShader.program);
    gl.bindVertexArray(topoShader.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, topoShader.fbo[0]);
    gl.bindTexture(gl.TEXTURE_2D, toposurfaceTex);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // render PHYSARUM into texture; in: costSurfaceTex, particleTex --> out: horizontalBlurTex
    gl.useProgram(physarumShader.program);
    gl.bindVertexArray(physarumShader.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, physarumShader.fbo[0]);
    // set particle texture for physarum shader
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, particleTex);
    // set cost surface texture for physarum shader
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, costsurfaceTex);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // render horizontal BLUR with fbo_0; in costSurfaceTex --> out: intermediateBlurTex
    gl.useProgram(blurShader.program);
    gl.bindVertexArray(blurShader.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, blurShader.fbo[0]);
    gl.bindTexture(gl.TEXTURE_2D, horizontalBlurTex);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    // render vertical BLUR with fbo_1; in intermediateBlurTex --> out: canvasTexture
    swapBlurDirectionUniform();
    gl.bindFramebuffer(gl.FRAMEBUFFER, blurShader.fbo[1]);
    gl.bindTexture(gl.TEXTURE_2D, verticalBlurTex);
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