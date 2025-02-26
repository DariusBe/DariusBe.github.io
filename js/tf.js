import { GLContext } from './GLContext.js';
import { Shader } from './Shader.js';
import { Utils } from './Utils.js';
import '../gl-matrix-min.js';

/* WebGL Context */
const glContext = new GLContext();
const gl = glContext.gl;
glContext.listContextStats();

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
var topoMap = Utils.getEmptyStartTexture(canvas.width, canvas.height);

/* DOM Elements */
// Sensor Sliders
var raSlider = document.getElementById("RA_slider");
var raSlider_label = document.getElementById("RA_slider_label");
var saSlider = document.getElementById("SA_slider");
var saSlider_label = document.getElementById("SA_slider_label");
var sdSlider = document.getElementById("SD_slider");
var sdSlider_label = document.getElementById("SD_slider_label");
// Blur Slider
const convSlider = document.getElementById('conv_slider');
var convSliderLabel = document.getElementById('conv_slider_label');
// Attenuation Slider
var attenuationSlider = document.getElementById("attenuation_slider");
var attenuation_slider_label = document.getElementById("attenuation_slider_label");
attenuation_slider_label.innerHTML = attenuationSlider.value;
// Slope Slider
const slopeSlider = document.getElementById('slope_slider');
var slopeSliderLabel = document.getElementById('slope_slider_label');
// Checkbox
const checkbox = document.getElementById('slope_checkbox');
// Iteration Label
const iterationLabel = document.getElementById('iteration');
// change flags
var hasRAChanged = false;
var hasSAChanged = false;
var hasSDChanged = false;
var hasConvSliderChanged = false;
var hasSlopeSliderChanged = false;
var hasAttenuationSliderChanged = false;
var hasCheckboxChanged = checkbox.checked;

/* Globals */
const BOUNDS = 0.01;
const FILL_PERCENTAGE = 0.02;
const SENSOR_ANGLE = Math.PI / 4;
const ROTATION_ANGLE = Math.PI / 4;
const SENSOR_DISTANCE = 30;
const ATTENUATION = 0.1;
const KERNEL_SIZE = 9; // has to be odd

const PARTICLE_COUNT = Math.round(canvas.width * canvas.height * FILL_PERCENTAGE); // 3% of the total number of pixels
console.info('Particle count:', PARTICLE_COUNT);
const BYTE = 4;
const BUFFSIZE = PARTICLE_COUNT * BYTE * 4;
const TIMESTEP = 1;
var TICK = 0.0;
const SKIP_TOPO = true;
if (!SKIP_TOPO) {
    topoMap = await Utils.readXYZMapToTexture('js/src/topoShader/maps/' + mapFile);
}

// Sensing Uniforms to sliders
var uRotationAngle = ROTATION_ANGLE;
var uSensorAngle = SENSOR_ANGLE;
var uSensorDistance = SENSOR_DISTANCE;
raSlider.value = (ROTATION_ANGLE * 180.0) / Math.PI;
raSlider_label.innerHTML = raSlider.value;
saSlider.value = (SENSOR_ANGLE * 180.0) / Math.PI;
saSlider_label.innerHTML = saSlider.value;
sdSlider.value = uSensorDistance;
sdSlider_label.innerHTML = sdSlider.value;


// Blur
var uKernelSize = KERNEL_SIZE;
console.info('kernel size:', uKernelSize);
var sigma = (uKernelSize-1) / 4;
convSlider.value = Math.abs(2 * uKernelSize - 1);
convSliderLabel.innerHTML = uKernelSize;
attenuationSlider.value = Math.log10(1/ATTENUATION);
attenuation_slider_label.innerHTML = (ATTENUATION).toFixed(3);
var uAttenuation = ATTENUATION;
// Topo
var slopeFactor = slopeSlider.value;
var uIsHorizontal = true;
var updateLandscape = true;
const shaderList = glContext.shaderList;

/* Event Listeners */
convSlider.oninput = function () {
    hasConvSliderChanged = true;
    const val = Math.abs(this.value * 2 - 1);
    convSliderLabel.innerHTML = val == 1 ? 'off' : val;
    uKernelSize = val;
    sigma = (uKernelSize-1) / 4;
    console.log(this.value, val, sigma);
}
convSlider.addEventListener('dblclick', (event) => {
    hasConvSliderChanged = true;
    convSlider.value = Math.abs(2 * 2 - 1);
    uKernelSize = Math.abs(2 * 2 - 1);
    convSliderLabel.innerHTML = Math.abs(2 * 2 - 1);
    sigma = 3 / 4;
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
attenuationSlider.oninput = function () {
    hasAttenuationSliderChanged = true;
    attenuation_slider_label.innerHTML = (1/(Math.pow(10, this.value))).toFixed(3);
    uAttenuation = 1/(Math.pow(10, this.value));
}
attenuationSlider.addEventListener('dblclick', (event) => {
    hasAttenuationSliderChanged = true;
    attenuationSlider.value = 1;
    attenuation_slider_label.innerHTML = (1/Math.pow(10, attenuationSlider.value)).toFixed(3);
    uAttenuation = 1/(Math.pow(10, attenuationSlider.value));
});
raSlider.addEventListener('dblclick', (event) => {
    hasRAChanged = true;
    raSlider.value = (Math.PI / 4.0 * 180.0) / Math.PI;
    raSlider_label.innerHTML = raSlider.value;
    uRotationAngle = raSlider.value * Math.PI / 180.0;
});
raSlider.oninput = function () {
    hasRAChanged = true;
    raSlider_label.innerHTML = this.value;
    uRotationAngle = this.value * Math.PI / 180.0;
}
saSlider.oninput = function () {
    hasSAChanged = true;
    saSlider_label.innerHTML = this.value;
    uSensorAngle = this.value * Math.PI / 180.0;
}
saSlider.addEventListener('dblclick', (event) => {
    hasSAChanged = true;
    saSlider.value = (Math.PI / 8.0 * 180.0) / Math.PI;
    saSlider_label.innerHTML = saSlider.value;
    uSensorAngle = saSlider.value * Math.PI / 180.0;
});
sdSlider.oninput = function () {
    hasSDChanged = true;
    sdSlider_label.innerHTML = this.value;
    uSensorDistance = this.value;
}
sdSlider.addEventListener('dblclick', (event) => {
    hasSDChanged = true;
    sdSlider.value = 8;
    sdSlider_label.innerHTML = sdSlider.value;
    uSensorDistance = sdSlider.value;
});
checkbox.onchange = function () {
    hasCheckboxChanged = true;
    updateLandscape = true;
}

// Global uniforms and attributes
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

/* PARTICLE Transform Feedback */
var TF_BUFF_1 = gl.createBuffer();
var TF_DATA = Utils.populateParticleBuffer(PARTICLE_COUNT, -BOUNDS, -BOUNDS, BOUNDS, BOUNDS);
gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_1)
gl.bufferData(gl.ARRAY_BUFFER, TF_DATA, gl.STATIC_DRAW);
var TF_BUFF_2 = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_2)
gl.bufferData(gl.ARRAY_BUFFER, TF_DATA, gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

/* PARTICLE Shader */
const particleUniforms = Object.assign({}, globalUniforms, {
    uParticleSampler: ['1i', 0],
    uCostSampler: ['1i', 1],
    uAdditionalSampler: ['1i', 2],
    uParticleCount: ['1i', PARTICLE_COUNT],
    uSensorAngle: ['1f', uSensorAngle],         // 22.5 degrees
    uRotationAngle: ['1f', uRotationAngle],
    uSensorDistance: ['1f', uSensorDistance]    // 8 pixels
});
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
    'NEAREST',
    'CLAMP_TO_BORDER',
    1  // texture unit 1
);

/* BLUR Shader */
const blurUniforms = Object.assign({}, globalUniforms, {
    uKernelSize: ['1i', uKernelSize],
    uKernel: ['1fv', Utils.gaussKernel1D(uKernelSize, sigma, true)],
    uIsHorizontal: ['1i', uIsHorizontal], // whether to blur horizontally or vertically in current pass
    uDecay: ['1f', 0.0],
    uShowCursor: ['bool', true],
    uAttenuation: ['1f', uAttenuation],
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
    'NEAREST',
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
    'NEAREST',
    'CLAMP_TO_BORDER',
    0  // texture unit 0
);
const emptyTexture = particleShader.prepareImageTexture(
    'uParticleSampler',
    Utils.getEmptyStartTexture(canvas.width, canvas.height),
    'emptyTexture',
    canvas.width, canvas.height,
    'NEAREST',
    'CLAMP_TO_BORDER',
    0  // texture unit 0
);
const sensorTexture = particleShader.prepareImageTexture(
    'uParticleSampler',
    Utils.getEmptyStartTexture(canvas.width, canvas.height),
    'emptyTexture',
    canvas.width, canvas.height,
    'NEAREST',
    'CLAMP_TO_BORDER',
    0  // texture unit 0
);
const fbo1 = particleShader.prepareFramebufferObject(
    'Physarum_FBO_FULL',
    // target texture location: Texture rendered into
    {
        'COLOR_ATTACHMENT0': emptyTexture,
        'COLOR_ATTACHMENT1': sensorTexture,
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

/* Blur Textures and FBOs */
const verticalBlurTex = blurShader.prepareImageTexture(
    "uSampler",
    Utils.getRandomStartTexture(canvas.width, canvas.height),
    'verticalBlurTex',
    canvas.width, canvas.height,
    'NEAREST',
    'CLAMP_TO_BORDER',
);
blurShader.prepareFramebufferObject(
    'horizontalBlurFBO',
    // target texture location: Texture rendered into
    { 'COLOR_ATTACHMENT0': verticalBlurTex },
    canvas.width, canvas.height
);
blurShader.prepareFramebufferObject(
    'verticalBlurFBO_Target_RenderInto',
    // target texture location: Texture to rendered into
    { 'COLOR_ATTACHMENT0': renderFrom },
    canvas.width, canvas.height
);
blurShader.prepareFramebufferObject(
    'verticalBlurFBO_Target_RenderInto',
    // target texture location: Texture to rendered into
    { 'COLOR_ATTACHMENT0': renderInto },
    canvas.width, canvas.height
);

/* SET ALL SHADERS GLOBAL */
glContext.setShaderGlobal(topoShader);
glContext.setShaderGlobal(particleShader);
glContext.setShaderGlobal(canvasShader);
glContext.setShaderGlobal(blurShader);
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
    // TICK = Math.round(TICK * 100) / 100;
    iterationLabel.innerHTML = TICK;
    // glContext.cameraTransform();
    gl.bindBuffer(gl.UNIFORM_BUFFER, glContext.globalUniformBuffer);
    glContext.updateGlobalUniform('uTime', TICK);
    glContext.updateGlobalUniform('uModel', glContext.uModel);
    glContext.updateGlobalUniform('uView', glContext.uView);
    glContext.updateGlobalUniform('uProjection', glContext.uProjection);

    for (const shader of shaderList) {
        // glContext.updateGlobalUniform('uTime', tick);
        if (hasConvSliderChanged) {
            const kernel = Utils.gaussKernel1D(uKernelSize, sigma, true);
            blurShader.updateUniform('uKernel', '1fv', kernel);
            blurShader.updateUniform('uKernelSize', '1i', uKernelSize);
            hasConvSliderChanged = false;
        }
        if (hasAttenuationSliderChanged) {
            blurShader.updateUniform('uAttenuation', '1f', uAttenuation);
            hasAttenuationSliderChanged = false;
            console.info("updated attenuation: ", uAttenuation);
        }
        if (hasSlopeSliderChanged) {
            topoShader.updateUniform('uSlopeFactor', '1f', slopeFactor);
            hasSlopeSliderChanged = false;
            console.info("updated slope factor: ", slopeFactor);
        }
        if (hasRAChanged) {
            particleShader.updateUniform('uRotationAngle', '1f', uRotationAngle);
            hasRAChanged = false;
            console.info("updated rotation angle: ", uRotationAngle);
        }
        if (hasSAChanged) {
            particleShader.updateUniform('uSensorAngle', '1f', uSensorAngle);
            hasSAChanged = false;
            console.info("updated sensor angle: ", uSensorAngle);
        }
        if (hasSDChanged) {
            particleShader.updateUniform('uSensorDistance', '1f', uSensorDistance);
            hasSDChanged = false;
            console.info("updated sensor distance: ", uSensorDistance);
        }
    }
    if (hasCheckboxChanged) {
        topoShader.updateUniform('uCheckbox', 'bool', checkbox.checked);
        hasCheckboxChanged = false;
    }
    gl.useProgram(null);
}

/* Render Functions */
const renderCanvas = (drawArrays = () => gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)) => {
    gl.useProgram(canvasShader.program);
    gl.bindVertexArray(canvasShader.vao);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, sensorTexture);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, costsurfaceTex);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbo == fbo1 ? emptyTexture : randomTexture);

    drawArrays();
    gl.bindVertexArray(null);
}
const renderParticles = () => {
    gl.useProgram(particleShader.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_2)
    gl.bindVertexArray(particleShader.vaoList[1]);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND); // means that the color of the fragment is blended with the color already in the framebuffer
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendEquation(gl.FUNC_ADD);


    /* rendering with fbos */
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, TF_BUFF_1);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    // gl.viewport(0, 0, canvas.width, canvas.height);
    // gl.clearColor(1.0, 1.0, 1.0, 1.0);
    // gl.clear(gl.COLOR_BUFFER_BIT);

    // clear sensor texture for new cycle
    gl.clearBufferfv(gl.COLOR, 1, new Float32Array([0, 0, 0, 1])); // Clears to black (RGBA)

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, costsurfaceTex);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderFrom);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);

    gl.disable(gl.BLEND);
    gl.endTransformFeedback();
    gl.bindVertexArray(null);
    gl.useProgram(null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // print buffer contents
    // if (TICK % 100 == 0) {
    //     Utils.getBufferContents(gl, TF_BUFF_1, PARTICLE_COUNT, 4);
    // }
    swapTFBuffers();
    swapFBOTextures();
}
const renderCycle = () => {
    requestAnimationFrame(renderCycle);

    updateUniforms();
    // update topo if checkbox is checked
    if (!SKIP_TOPO && updateLandscape) {
        topoShader.renderWithFBO(toposurfaceTex);
        console.info('updating landscape');
        updateLandscape = false;
    }
    // render physarum shader
    renderParticles();

    // render blur shader
    blurShader.renderWithFBO(renderFrom, 0);
    swapBlurDirectionUniform();
    blurShader.renderWithFBO(verticalBlurTex, fbo == fbo2 ? 1 : 2);


    // render canvas shader
    renderCanvas();
}

/* Start rendering */
renderCycle();