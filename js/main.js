import { GLContext } from './GLContext.js';
import { Shader } from './Shader.js';
import { Utils } from './Utils.js';
import { ModelOBJ } from './ModelOBJ.js';
import '../gl-matrix-min.js';

/* FILES */
const basePath = 'js/src/';
const particleVertCode = await Utils.readShaderFile(basePath + 'testShader/tf/tf.vert');
const particleFragCode = await Utils.readShaderFile(basePath + 'testShader/tf/tf.frag');
const trailVertCode = await Utils.readShaderFile(basePath + 'testShader/tf/particle_trail/trail.vert');
const trailFragCode = await Utils.readShaderFile(basePath + 'testShader/tf/particle_trail/trail.frag');
const topoVertCode = await Utils.readShaderFile('js/src/topoShader/topo.vert');
const topoFragCode = await Utils.readShaderFile('js/src/topoShader/topo.frag');
const physarumVertCode = await Utils.readShaderFile('js/src/rulesShader/rules.vert');
const physarumfragCode = await Utils.readShaderFile('js/src/rulesShader/rules.frag');
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
const PARTICLE_COUNT = 20_000;
const BYTE = 4;
const TIMESTEP = 0.01;
const BUFFSIZE = PARTICLE_COUNT * BYTE * 4;

const glContext = new GLContext();
const gl = glContext.gl;
glContext.listContextStats();
const shaderList = glContext.shaderList;
var tick = 0.0;
var kernelSize = Math.abs(slider.value * 2 - 1);
var sigma = kernelSize / 4;
var uIsHorizontal = true;
var updateLandscape = false;
// glContext.canvas.width = 400;
// glContext.canvas.height = 400;

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

    uParticleCount: ['1i', PARTICLE_COUNT],
    uSensorAngle: ['1f', Math.PI / 4.0],
    uSensorDistance: ['1f', 8]
};


// Transform Feedback Buffers
var TF_BUFF_1 = gl.createBuffer();
var TF_DATA = Utils.populateParticleBuffer(PARTICLE_COUNT, canvas.width, canvas.height);
gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_1)
gl.bufferData(gl.ARRAY_BUFFER, TF_DATA, gl.DYNAMIC_COPY);
var TF_BUFF_2 = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_2)
gl.bufferData(gl.ARRAY_BUFFER, TF_DATA, gl.DYNAMIC_COPY);
gl.bindBuffer(gl.ARRAY_BUFFER, null);

const physarumShader = new Shader(gl, name = 'PhysarumShader',
    particleVertCode, particleFragCode,
    globalAttributes, physarumUniforms,
    {
        TF_attribute: { 'aParticle': [2, [4, 'FLOAT', false, 4 * BYTE, 0], TF_DATA] },
        TF_varyings: ['vParticle'],
        TF_mode: gl.SEPARATE_ATTRIBS,
        TF_buffer: TF_BUFF_1,
        TF_bufferSize: BUFFSIZE,
    }
);

/* TRAIL */
const quadBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
gl.bufferData(gl.ARRAY_BUFFER, Utils.canvasAttribs, gl.STATIC_DRAW);

const trailUniforms = Object.assign({}, globalUniforms, {
    uShowCursor: ['bool', true],
});

// [B][B][B]    3 * BYTE -> STRIDE = 9 * BYTE, OFFSET = 0
// [B][B]       2 * BYTE -> STRIDE = 9 * BYTE, OFFSET = 3 * BYTE
// [B][B][B][B] 4 * BYTE -> STRIDE = 9 * BYTE, OFFSET = 5 * BYTE
// ============ 9 * BYTE
const trailAttributes = {
    'aPosition': [0, [3, 'FLOAT', false, 5 * BYTE, 0], Utils.canvasAttribs],
    'aTexCoord': [1, [2, 'FLOAT', false, 5 * BYTE, 3 * BYTE], Utils.canvasAttribs],
    // 'aParticle': [2, [4, 'FLOAT', false, 9 * BYTE, 5 * BYTE], TF_DATA],
};

const trailShader = new Shader(gl, name = 'TrailShader',
    trailVertCode, trailFragCode,
    trailAttributes, trailUniforms,
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
const canvasUniforms = Object.assign({}, globalUniforms, {
    uTopoSampler: ['1i', 1]
});
const canvasShader = new Shader(gl, name = 'CanvasShader',
    canvasVertCode, canvasFragCode,
    globalAttributes, canvasUniforms
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
const costsurfaceTex = physarumShader.prepareImageTexture(
    "uCostSampler",
    Utils.getRandomStartTexture(canvas.width, canvas.height),
    'costsurfaceTex',
    canvas.width, canvas.height,
    'LINEAR',
    'CLAMP_TO_BORDER',
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
    'CLAMP_TO_BORDER',
    0  // texture unit 0
);
const emptyTexture = physarumShader.prepareImageTexture(
    'uParticleSampler',
    Utils.getEmptyStartTexture(canvas.width, canvas.height),
    'emptyTexture',
    canvas.width, canvas.height,
    'LINEAR',
    'CLAMP_TO_BORDER',
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

/* Trail Texture FBO */
const trailTexture = trailShader.prepareImageTexture(
    "uSampler",
    Utils.getRandomStartTexture(canvas.width, canvas.height),
    'trailTexture',
    canvas.width, canvas.height,
    'LINEAR',
    'CLAMP_TO_EDGE',
    0  // texture unit 0
);
const trailFBO = trailShader.prepareFramebufferObject(
    gl.COLOR_ATTACHMENT0,
    trailTexture, // FBO will render into this texture
    'TrailFBO',
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
const topoTexture = canvasShader.prepareImageTexture(
    "uTopoSampler",
    Utils.getRandomStartTexture(canvas.width, canvas.height),
    'topoTex',
    canvas.width, canvas.height,
    'LINEAR',
    'CLAMP_TO_BORDER',
    1  // texture unit 0
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
glContext.setShaderGlobal(trailShader);
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
    if (Math.round(tick * 100) % 1 == 0) {
        renderFrom = renderFrom == randomTexture ? emptyTexture : randomTexture;
        renderInto = renderInto == randomTexture ? emptyTexture : randomTexture;
    }
    renderFrom = renderFrom == randomTexture ? emptyTexture : randomTexture;
    renderInto = renderInto == randomTexture ? emptyTexture : randomTexture;
    fbo = fbo == fbo1 ? fbo2 : fbo1;
}
function swapTFBuffers() {
    const temp = TF_BUFF_1;
    TF_BUFF_1 = TF_BUFF_2;
    TF_BUFF_2 = temp;
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

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, canvasTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, costsurfaceTex);

    // gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    drawArrays();
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

const renderParticle = () => {
    gl.useProgram(physarumShader.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_2)
    gl.bindVertexArray(physarumShader.vaoList[1]);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
    gl.enable(gl.RASTERIZER_DISCARD);
    // if (particleShader.tfBuffer !== null) {
    // bindBufferBase args: target, index, buffer
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, TF_BUFF_1);
    // }
    /* rendering with fbos */
    // gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    // gl.viewport(0, 0, canvas.width, canvas.height);
    // gl.clear(gl.COLOR_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, costsurfaceTex);
    // gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, renderFrom);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT); // args: mode, first, count
    gl.endTransformFeedback();
    gl.bindVertexArray(null);
    gl.useProgram(null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.RASTERIZER_DISCARD);

    // if (Math.round(tick * 100) % 100 == 0) {
    //     Utils.getBufferContents(gl, TF_BUFF_2, PARTICLE_COUNT, 4, 3);
    // }

    
    // Bind PBO and transfer data to texture
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, TF_BUFF_1);
    gl.bindTexture(gl.TEXTURE_2D, trailTexture);
    // 16.000 / 8  = 2000 sqrt = 50 
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 50, 50, gl.RGBA, gl.FLOAT, 0);
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);


    swapTFBuffers();
    // swapFBOTextures();
}

const renderTrail = () => {
    gl.useProgram(trailShader.program);

    // Bind the canvas (quad) buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * BYTE, 0);
    gl.enableVertexAttribArray(0);

    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * BYTE, 3 * BYTE);
    gl.enableVertexAttribArray(1);

    gl.bindVertexArray(trailShader.vao);
    // Bind the transform feedback buffer containing the particle positions
    gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(2);



    // FBO will render into this texture
    gl.useProgram(trailShader.program);
    gl.bindVertexArray(trailShader.vao);

    // bind TF BUFFER
    gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
    // args: index, size, type, normalized, stride, offset


    gl.bindFramebuffer(gl.FRAMEBUFFER, trailFBO);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, costsurfaceTex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, trailTexture);


    // gl.viewport(0, 0, canvas.width, canvas.height);
    // gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // gl.clear(gl.COLOR_BUFFER_BIT);

    // gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); // Draw the quad
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    //GLenum for mode: gl.POINTS, gl.LINE_STRIP, gl.LINE_LOOP, gl.LINES, gl.TRIANGLE_STRIP, gl.TRIANGLE_FAN, gl.TRIANGLES

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.useProgram(null);
    // gl.disable(gl.DEPTH_TEST);
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
    // physarumShader.renderWithFBO(renderFrom, fbo, 1, costsurfaceTex);
    renderParticle();
    // swapFBOTextures();
    renderTrail();

    // render blur shader
    blurShader.renderWithFBO(trailTexture, 0);
    swapBlurDirectionUniform();
    blurShader.renderWithFBO(verticalBlurTex, 1);

    // render canvas shader
    renderCanvas();
}

animate();