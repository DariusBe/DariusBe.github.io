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
// prepare random start texture
const randomMap = await Utils.getRandomStartTexture(canvas.width, canvas.height);
const randomTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, randomTexture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, randomMap);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
// clamp to edge
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.bindTexture(gl.TEXTURE_2D, null);
// var randomTexture = physarumShader.prepareImageTexture(
//     "uParticleSampler",
//     randomMap,
//     'randomTexture',
//     size, size,
//     'LINEAR',
//     'CLAMP_TO_EDGE',
//     0  // texture unit 0
// );
var emptyMap = await Utils.getRandomStartTexture(canvas.width, canvas.height);
const emptyTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, emptyTexture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, emptyMap);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
// clamp to edge
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.bindTexture(gl.TEXTURE_2D, null);
// var emptyTexture = physarumShader.prepareImageTexture(
//     "uParticleSampler",
//     emptyMap,
//     'emptyTexture',
//     size, size,
//     'LINEAR',
//     'CLAMP_TO_EDGE',
//     0  // texture unit 0
// );

/* New Physarum FBOS */
const fbo1 = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo1);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, emptyTexture, 0);
if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    console.error('Framebuffer 1 is not complete');
}
gl.bindFramebuffer(gl.FRAMEBUFFER, null);

const fbo2 = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo2);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, randomTexture, 0);
if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    console.error('Framebuffer 2 is not complete');
}
gl.bindFramebuffer(gl.FRAMEBUFFER, null);

const verticalBlurTex = blurShader.prepareImageTexture(
    "uSampler",
    Utils.getRandomStartTexture(128, 128),
    'verticalBlurTex',
    128, 128
);
const canvasTexture = canvasShader.prepareImageTexture(
    "uSampler",
    Utils.getRandomStartTexture(128, 128),
    'canvasTex',
    128, 128
);
// prepare empty cost surface texture (will be rendered into by topo shader)
const costsurfaceTex = physarumShader.prepareImageTexture(
    "uCostSampler",
    Utils.getRandomStartTexture(size, size),
    'costsurfaceTex',
    size, size,
    'LINEAR',
    'CLAMP_TO_EDGE',
    1  // texture unit 1
);

/* PREPARE FBOs */
// TopoShader FBO
topoShader.prepareFramebufferObject(
    gl.COLOR_ATTACHMENT0,
    costsurfaceTex, // FBO will render into this texture
    'Topo_FBO',
    canvas.width,
    canvas.height,
    gl.RGBA16F,
);
// PhysarumShader FBOs

// physarumShader.prepareFramebufferObject(
//     gl.COLOR_ATTACHMENT0,   // equals output location in fragment shader
//     emptyTexture,          // FBO will render into this texture
//     'Physarum_FBO_FULL',
//     canvas.width, canvas.height,
//     gl.RGBA16F
// );
// physarumShader.prepareFramebufferObject(
//     gl.COLOR_ATTACHMENT0,   // equals output location in fragment shader
//     randomTexture,          // FBO will render into this texture
//     'Physarum_FBO_EMPTY',
//     canvas.width, canvas.height,
//     gl.RGBA16F
// );
// BlurShader FBOs
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
/**
 * Render with Frame Buffer Object
 * @param {Shader} shader The Shader with a framebuffer object
 * @param {WebGLTexture} inputTexture The texture to render into the framebuffer
 * @param {number} fboIndex If multiple framebuffers are used, this index identifies the framebuffer in the list of FBOs (default is 0)
 * @param {number} overwriteTextureUnit If the shader uses multiple textures, this parameter can be used to set the texture unit (default is null)
 * @param {WebGLTexture} texture The texture to be associated with the above texture unit
 * @param {function} drawArrays An optional function passed as gl-render instruction (default is gl.drawArrays(gl.TRIANGLE_FAN, 0, 4))
 * @returns {void}
 * @example
 * renderWithFrameBuffer(
 *      shaderWithFBO, inputTexture, 0, 
 *      1, secondaryTexture, 
 *      () => gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
 * );
 * 
*/
const renderWithFrameBuffer = (shader, inputTexture, fboIndex = 0, overwriteTextureUnit = null, texture = null, drawArrays = () => gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)) => {
    gl.useProgram(shader.program);
    gl.bindVertexArray(shader.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, shader.fbo[fboIndex]);
    if (overwriteTextureUnit != null && texture != null) {
        gl.activeTexture(gl.TEXTURE0 + overwriteTextureUnit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture);

    drawArrays();

    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

/* RENDERING */
const renderLandscapes = () => {
    // render TOPOGRAPHY into texture; in: topoSurfaceTexture --> out: costSurfaceTex
    renderWithFrameBuffer(topoShader, toposurfaceTex);
}

// function updateSamplerUniform(program, canvasTexture, samplerName='uSampler') {
//     gl.useProgram(program);
//     gl.bindTexture(gl.TEXTURE_2D, canvasTexture);
//     gl.uniform1i(gl.getUniformLocation(program, samplerName), 0);
//     gl.bindTexture(gl.TEXTURE_2D, null);
//     gl.useProgram(null);
// }


const renderPhysarum = () => {
    gl.useProgram(physarumShader.program);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    
    gl.bindVertexArray(physarumShader.vao);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, costsurfaceTex);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderFrom);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    swapFBOTextures();
}

const renderBlur = () => {
    gl.useProgram(blurShader.program);
    gl.bindVertexArray(blurShader.vao);
    renderWithFrameBuffer(blurShader, renderInto, 0);
    swapBlurDirectionUniform();
    renderWithFrameBuffer(blurShader, verticalBlurTex, 1);
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

// renderLandscapes();

const animate = () => {
    requestAnimationFrame(animate);

    updateUniforms();

    if ((tick == TIMESTEP) || updateLandscape) {
        renderLandscapes();
        console.info('updating landscape');
        updateLandscape = false;
    }

    renderPhysarum();

    renderBlur();
    renderCanvas(
        () => gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
    );


}

animate();




//   function renderPingPong() {
//     let useFbo1 = true;

//     for (let i = 0; i < numIterations; i++) {
//       const fbo = useFbo1 ? fbo1 : fbo2;
//       const tex = useFbo1 ? tex1 : tex2;
//       const srcTex = useFbo1 ? tex2 : tex1;

//       // Bind the framebuffer
//       gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
//       gl.viewport(0, 0, width, height);
//       gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

//       // Bind the VAO
//       gl.bindVertexArray(vao);

//       // Bind textures to texture units
//       gl.activeTexture(gl.TEXTURE0);
//       gl.bindTexture(gl.TEXTURE_2D, srcTex);

//       gl.activeTexture(gl.TEXTURE1);
//       gl.bindTexture(gl.TEXTURE_2D, miscTex);

//       // Set the uniform samplers in the shader
//       gl.uniform1i(gl.getUniformLocation(shaderProgram, "u_srcTex"), 0);
//       gl.uniform1i(gl.getUniformLocation(shaderProgram, "u_miscTex"), 1);

//       // Draw your scene
//       gl.drawArrays(gl.TRIANGLES, 0, 6);

//       // Unbind the VAO and framebuffer
//       gl.bindVertexArray(null);
//       gl.bindFramebuffer(gl.FRAMEBUFFER, null);

//       // Toggle between FBOs
//       useFbo1 = !useFbo1;
//     }
//   }