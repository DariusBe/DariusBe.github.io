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
const TIMESTEP = 0.01;

const glContext = new GLContext();
const gl = glContext.gl;
glContext.listContextStats();
const shaderList = glContext.shaderList;
var tick = 0.0;
var kernelSize = Math.abs(slider.value * 2 - 1);
var sigma = kernelSize / 4;
var uIsHorizontal = true;
var updateLandscape = false;

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
    updateLandscape = true;
}

// global uniforms and attributes
const globalUniforms = {
    uSampler: ['1i', 0],
    uSlider: ['1f', 0.5]
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
const topoShader = new Shader(gl, name = 'TopoShader',
    topoVertCode, topoFragCode,
    globalAttributes, topoUniforms
);

/* PHYSARUM */
const physarumUniforms = {
    uParticleSampler: ['1i', 0],
    uCostSampler: ['1i', 1],

    uParticleCount: ['1i', 250],
    uSensorAngle: ['1f', Math.PI],
    uSensorDistance: ['1f', 5]
};
const physarumShader = new Shader(gl, name = 'PhysarumShader',
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
const blurShader = new Shader(gl, name = 'BlurShader',
    blurVertCode, blurFragCode,
    globalAttributes, blurUniforms
);

/* CANVAS */
const canvasShader = new Shader(gl, name = 'CanvasShader',
    canvasVertCode, canvasFragCode,
    globalAttributes, globalUniforms
);

/* TOPO Textures and FBO */
const size = topoMap[topoMap.length - 1];
topoMap = Utils.normalizePointCloud(topoMap.slice(0, topoMap.length - 1));
const toposurfaceTex = topoShader.prepareImageTexture(
    "uSampler",
    topoMap,
    'TopoTexture',
    size, size,
    'LINEAR',
    'CLAMP_TO_EDGE'
);
const costsurfaceTex = physarumShader.prepareImageTexture(
    "uCostSampler",
    Utils.getRandomStartTexture(canvas.width, canvas.height),
    'costsurfaceTex',
    canvas.width, canvas.height,
    'LINEAR',
    'CLAMP_TO_EDGE',
    1  // texture unit 1
);
topoShader.prepareFramebufferObject(
    gl.COLOR_ATTACHMENT0,
    costsurfaceTex, // FBO will render into this texture
    'Topo_FBO',
    canvas.width, canvas.height
);

/* Physarum Textures and FBOs */;
const randomTexture = physarumShader.prepareImageTexture(
    "uParticleSampler",
    Utils.getRandomStartTexture(canvas.width, canvas.height),
    'randomTexture',
    canvas.width, canvas.height,
    'LINEAR',
    'CLAMP_TO_EDGE',
    0  // texture unit 0
);
const emptyTexture = physarumShader.prepareImageTexture(
    'uParticleSampler',
    Utils.getEmptyStartTexture(canvas.width, canvas.height),
    'emptyTexture',
    canvas.width, canvas.height,
    'LINEAR',
    'CLAMP_TO_EDGE',
    0  // texture unit 0
);
const fbo1 = physarumShader.prepareFramebufferObject(
    gl.COLOR_ATTACHMENT0,   // equals output location in fragment shader
    emptyTexture,          // FBO will render into this texture
    'Physarum_FBO_FULL',
    canvas.width, canvas.height
);
const fbo2 = physarumShader.prepareFramebufferObject(
    gl.COLOR_ATTACHMENT0,   // equals output location in fragment shader
    randomTexture,          // FBO will render into this texture
    'Physarum_FBO_EMPTY',
    canvas.width, canvas.height
);

/* Blur Textures and FBOs */
const verticalBlurTex = blurShader.prepareImageTexture(
    "uSampler",
    Utils.getRandomStartTexture(canvas.width, canvas.height),
    'verticalBlurTex',
    canvas.width, canvas.height,
);
const canvasTexture = canvasShader.prepareImageTexture(
    "uSampler",
    Utils.getRandomStartTexture(canvas.width, canvas.height),
    'canvasTex',
    canvas.width, canvas.height,
);
blurShader.prepareFramebufferObject(
    gl.COLOR_ATTACHMENT0,
    verticalBlurTex, // FBO will render into this texture
    'horizontalBlurFBO',
    canvas.width, canvas.height
);
blurShader.prepareFramebufferObject(
    gl.COLOR_ATTACHMENT0,
    canvasTexture, // FBO will render into this texture
    'verticalBlurFBO',
    canvas.width, canvas.height
);


/* SET ALL SHADERS GLOBAL */
glContext.setShaderGlobal(topoShader);
glContext.setShaderGlobal(physarumShader);
glContext.setShaderGlobal(blurShader);
glContext.setShaderGlobal(canvasShader);
for (const shader of shaderList) {
    shader.getShaderDetails();
}

/* RENDER UTILS */
var renderFrom = randomTexture;
var renderInto = emptyTexture;
var fbo = fbo1;
function swapFBOTextures() {
    renderFrom = renderFrom == randomTexture ? emptyTexture : randomTexture;
    renderInto = renderInto == randomTexture ? emptyTexture : randomTexture;
    fbo = fbo == fbo1 ? fbo2 : fbo1;
}
function swapBlurDirectionUniform() {
    // swap blur direction
    uIsHorizontal = !uIsHorizontal;
    blurShader.updateUniform('uIsHorizontal', '1i', uIsHorizontal);
    // swap textures
}
function updateUniforms() {
    tick += TIMESTEP;
    // glContext.cameraTransform();
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

/**
 * Render Canvas
 * @param {function} drawArrays An optional function passed as gl-render instruction (default is gl.drawArrays(gl.TRIANGLE_FAN, 0, 4))
 * @returns {void}
 * @example
 * renderCanvas(
 *     () => gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
 * );
*/
const renderCanvas = (drawArrays = () => gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)) => {
    // render canvas texture
    gl.useProgram(canvasShader.program);
    gl.bindVertexArray(canvasShader.vao);
    gl.bindTexture(gl.TEXTURE_2D, canvasTexture);
    // gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    drawArrays();
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

// fill topo texture exactly once
topoShader.renderWithFBO(toposurfaceTex);

const animate = () => {

    requestAnimationFrame(animate);
    updateUniforms();

    // update topo if checkbox is checked
    if (updateLandscape) {
        topoShader.renderWithFBO(toposurfaceTex);
        console.info('updating landscape');
        updateLandscape = false;
    }

    // render physarum shader
    physarumShader.renderWithFBO(renderFrom, fbo, 1, costsurfaceTex);
    swapFBOTextures();
    
    // render blur shader
    blurShader.renderWithFBO(renderInto, 0);
    swapBlurDirectionUniform();
    blurShader.renderWithFBO(verticalBlurTex, 1);
    
    // render canvas shader
    renderCanvas();
}

animate();