import { GLContext } from './GLContext.js';
import { Shader } from './Shader.js';
import { Utils } from './Utils.js';
import '../gl-matrix-min.js';

/* FILES */
const basePath = 'js/src/';

const topoVertCode = await Utils.readShaderFile('js/src/topoShader/topo.vert');
const topoFragCode = await Utils.readShaderFile('js/src/topoShader/topo.frag');

const particleVertCode = await Utils.readShaderFile(basePath + 'testShader/tf/tf.vert');
const particleFragCode = await Utils.readShaderFile(basePath + 'testShader/tf/tf.frag');

const blurVertCode = await Utils.readShaderFile('js/src/blurShader/blur.vert');
const blurFragCode = await Utils.readShaderFile('js/src/blurShader/blur.frag');

const canvasVertCode = await Utils.readShaderFile(basePath + 'testShader/canvas/canvas.vert');
const canvasFragCode = await await Utils.readShaderFile(basePath + 'testShader/canvas/canvas.frag');

const mapFile = 'testmap6.xyz';
var topoMap = await Utils.readXYZMapToTexture('js/src/topoShader/maps/' + mapFile);
// const testImage = await Utils.loadImage(basePath+'testShader/tf/testmap.png');

/* DOM Elements */
const convSlider = document.getElementById('conv_slider');
var convSliderLabel = document.getElementById('conv_slider_label');
const slopeSlider = document.getElementById('slope_slider');
var slopeSliderLabel = document.getElementById('slope_slider_label');
const checkbox = document.getElementById('slope_checkbox');
var hasConvSliderChanged = false;
var hasSlopeSliderChanged = false;
var hasCheckboxChanged = checkbox.checked;

/* Globals */
const PARTICLE_COUNT = 150;
const BYTE = 4;
const BUFFSIZE = PARTICLE_COUNT * BYTE * 4;
const TIMESTEP = 0.01;

const glContext = new GLContext();
const gl = glContext.gl;
glContext.listContextStats();

var TICK = 0.0;
var kernelSize = Math.abs(convSlider.value * 2 - 1);
var sigma = kernelSize / 4;
var slopeFactor = slopeSlider.value;
var uIsHorizontal = true;
var updateLandscape = true;
const shaderList = glContext.shaderList;

/* Event Listeners */
convSlider.oninput = function () {
    hasConvSliderChanged = true;
    const val = Math.abs(this.value * 2 - 1);
    convSliderLabel.innerHTML = val == 1 ? 'off' : val;
    kernelSize = val;
    sigma = val / 4;
}
// on double click, resest slider to default value
convSlider.addEventListener('dblclick', (event) => {
    hasConvSliderChanged = true;
    convSlider.value = 2;
    const val = Math.abs(convSlider.value * 2 - 1);
    convSliderLabel.innerHTML = val == 1 ? 'off' : val;
    kernelSize = val;
    sigma = val / 4;
});
slopeSlider.oninput = function () {
    hasSlopeSliderChanged = true;
    const val = this.value;
    slopeSliderLabel.innerHTML = val;
    slopeFactor = val;
    updateLandscape = true;
}
slopeSlider.addEventListener('dblclick', (event) => {
    hasSlopeSliderChanged = true;
    slopeSlider.value = 4;
    slopeSliderLabel.innerHTML = slopeSlider.value;
    slopeFactor = slopeSlider.value;
    updateLandscape = true;
});
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

/* TOPO Shader */
const topoUniforms = Object.assign({}, globalUniforms, {
    uShowCursor: ['bool', false],
    uCheckbox: ['bool', checkbox.checked],
    uSlopeFactor: ['1f', slopeFactor],
});
const topoShader = new Shader(gl, name = 'TopoShader',
    topoVertCode, topoFragCode,
    globalAttributes, topoUniforms
);

/* PARTICLE Shader */
// Transform Feedback Buffers
var TF_BUFF_1 = gl.createBuffer();
var TF_DATA = Utils.populateParticleBuffer(PARTICLE_COUNT, -0.5, -0.5, 0.5, 0.5);
gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_1)
gl.bufferData(gl.ARRAY_BUFFER, TF_DATA, gl.STATIC_DRAW);
var TF_BUFF_2 = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_2)
gl.bufferData(gl.ARRAY_BUFFER, TF_DATA, gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

const particleUniforms = {
    uParticleSampler: ['1i', 0],
    uAdditionalSampler: ['1i', 2],
    uCostSampler: ['1i', 1],

    uParticleCount: ['1i', PARTICLE_COUNT],
    uSensorAngle: ['1f', Math.PI / 8], // 22.5 degrees
    uSensorDistance: ['1f', 8]         // 8 pixels
};
const particleShader = new Shader(gl, name = 'ParticleShader',
    particleVertCode, particleFragCode,
    globalAttributes, particleUniforms,
    {
        TF_attribute: { 'aParticle': [2, [4, 'FLOAT', false, 4 * BYTE, 0], TF_DATA] },
        TF_varyings: ['vParticle'],
        TF_mode: gl.SEPARATE_ATTRIBS,
        TF_buffer: TF_BUFF_1,
        TF_bufferSize: BUFFSIZE,
    }
);
const costsurfaceTex = particleShader.prepareImageTexture(
    "uCostSampler",
    topoMap,
    // Utils.getRandomStartTexture(canvas.width, canvas.height),
    'costsurfaceTex',
    canvas.width, canvas.height,
    'LINEAR',
    'CLAMP_TO_BORDER',
    1  // texture unit 1
);

/* BLUR Shader */
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

/* CANVAS Shader */
const canvasUniforms = {
    uCanvasSampler1: ['1i', 0],
    uCanvasSampler2: ['1i', 1],
    uCanvasSampler3: ['1i', 2],
}
const canvasShader = new Shader(gl, name = 'CanvasShader',
    canvasVertCode, canvasFragCode,
    globalAttributes, canvasUniforms,
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
    'CLAMP_TO_BORDER'
);
topoShader.prepareFramebufferObject(
    'Topo_FBO',
    {
        'COLOR_ATTACHMENT0': costsurfaceTex,
        // 'COLOR_ATTACHMENT1': sensorTexture,
    },
    canvas.width, canvas.height
);

/* Physarum Textures and FBOs */;
const randomTexture = particleShader.prepareImageTexture(
    "uParticleSampler",
    Utils.getEmptyStartTexture(canvas.width, canvas.height),
    'randomTexture',
    canvas.width, canvas.height,
    'LINEAR',
    'CLAMP_TO_EDGE',
    0  // texture unit 0
);
const emptyTexture = particleShader.prepareImageTexture(
    'uParticleSampler',
    Utils.getEmptyStartTexture(canvas.width, canvas.height),
    'emptyTexture',
    canvas.width, canvas.height,
    'LINEAR',
    'CLAMP_TO_EDGE',
    0  // texture unit 0
);
const fbo1 = particleShader.prepareFramebufferObject(
    'Physarum_FBO_FULL',
    // target texture location: Texture rendered into
    {
        'COLOR_ATTACHMENT0': emptyTexture,
        // 'COLOR_ATTACHMENT1': sensorTexture,
    },
    canvas.width, canvas.height
);
const fbo2 = particleShader.prepareFramebufferObject(
    'Physarum_FBO_EMPTY',
    // target texture location: Texture rendered into
    {
        'COLOR_ATTACHMENT0': randomTexture,
        // 'COLOR_ATTACHMENT1': sensorTexture,
    },
    canvas.width, canvas.height
);
/* Particle FBO render */
var renderFrom = randomTexture;
var renderInto = emptyTexture;
var fbo = fbo1;

// const canvasTexture = canvasShader.prepareImageTexture(
//     "uCanvasSampler2",
//     testImage,
//     // Utils.getRandomStartTexture(canvas.width, canvas.height),
//     'canvasTex',
//     canvas.width, canvas.height,
//     'LINEAR',
//     'CLAMP_TO_EDGE',
//     1  // texture unit 0
// );

/* Blur Textures and FBOs */
const verticalBlurTex = blurShader.prepareImageTexture(
    "uSampler",
    Utils.getRandomStartTexture(canvas.width, canvas.height),
    'verticalBlurTex',
    canvas.width, canvas.height,
);
blurShader.prepareFramebufferObject(
    'horizontalBlurFBO',
    // target texture location: Texture rendered into
    { 'COLOR_ATTACHMENT0': verticalBlurTex },
    canvas.width, canvas.height
);
blurShader.prepareFramebufferObject(
    'verticalBlurFBO_Target_RenderInto',
    { 'COLOR_ATTACHMENT0': renderFrom },
    canvas.width, canvas.height
);
blurShader.prepareFramebufferObject(
    'verticalBlurFBO_Target_RenderInto',
    { 'COLOR_ATTACHMENT0': renderInto },
    canvas.width, canvas.height
);

/* SET ALL SHADERS GLOBAL */
glContext.setShaderGlobal(topoShader);
glContext.setShaderGlobal(particleShader);
glContext.setShaderGlobal(canvasShader);
for (const shader of shaderList) {
    shader.getShaderDetails();
}

/* Render Cycle functions */
function swapBlurDirectionUniform() {
    // swap blur direction
    uIsHorizontal = !uIsHorizontal;
    blurShader.updateUniform('uIsHorizontal', '1i', uIsHorizontal);
    // swap textures
}
function swapTFBuffers() {
    const temp = TF_BUFF_1;
    TF_BUFF_1 = TF_BUFF_2;
    TF_BUFF_2 = temp;
}
function swapFBOTextures() {
    renderFrom = renderFrom == randomTexture ? emptyTexture : randomTexture;
    renderInto = renderInto == randomTexture ? emptyTexture : randomTexture;
    fbo = fbo == fbo1 ? fbo2 : fbo1;
}
function updateUniforms() {
    TICK += TIMESTEP;
    TICK = Math.round(TICK * 100) / 100;
    // glContext.cameraTransform();
    gl.bindBuffer(gl.UNIFORM_BUFFER, glContext.globalUniformBuffer);
    glContext.updateGlobalUniform('uTime', TICK);
    glContext.updateGlobalUniform('uModel', glContext.uModel);
    glContext.updateGlobalUniform('uView', glContext.uView);
    glContext.updateGlobalUniform('uProjection', glContext.uProjection);

    for (const shader of shaderList) {
        // glContext.updateGlobalUniform('uTime', tick);
        if (hasConvSliderChanged) {
            const kernel = Utils.gaussKernel1D(kernelSize, sigma, true);
            blurShader.updateUniform('uKernel', '1fv', kernel);
            blurShader.updateUniform('uKernelSize', '1i', kernelSize);
            hasConvSliderChanged = false;
        }
        if (hasSlopeSliderChanged) {
            topoShader.updateUniform('uSlopeFactor', '1f', slopeFactor);
            hasSlopeSliderChanged = false;
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
    gl.useProgram(canvasShader.program);
    gl.bindVertexArray(canvasShader.vao);

    // gl.activeTexture(gl.TEXTURE2);
    // gl.bindTexture(gl.TEXTURE_2D, sensorTexture);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, costsurfaceTex);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbo == fbo1 ? emptyTexture : randomTexture);

    drawArrays();
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

const renderParticle = () => {
    gl.useProgram(particleShader.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_2)
    gl.bindVertexArray(particleShader.vaoList[1]);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND); // means that the color of the fragment is blended with the color already in the framebuffer
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


    /* rendering with fbos */
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, TF_BUFF_1);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    // gl.viewport(0, 0, canvas.width, canvas.height);
    // gl.clearColor(0.0, 0.0, 0.0, 0.0);
    // gl.clear(gl.COLOR_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, costsurfaceTex);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderFrom);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT); // args: mode, first, count

    gl.disable(gl.BLEND);
    gl.endTransformFeedback();
    gl.bindVertexArray(null);
    gl.useProgram(null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    swapTFBuffers();
    swapFBOTextures();
}

const renderCycle = () => {
    requestAnimationFrame(renderCycle);

    updateUniforms();
    // update topo if checkbox is checked
    if (updateLandscape) {
        topoShader.renderWithFBO(toposurfaceTex);
        console.info('updating landscape');
        updateLandscape = false;
    }

    // render blur shader
    blurShader.renderWithFBO(renderFrom, 0);
    swapBlurDirectionUniform();
    blurShader.renderWithFBO(verticalBlurTex, fbo == fbo2 ? 1 : 2);

    // render physarum shader
    renderParticle();

    // render canvas shader
    renderCanvas();
}

renderCycle();