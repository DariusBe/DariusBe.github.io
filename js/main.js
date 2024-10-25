import { GLContext } from './GLContext.js';
import { Shader } from './Shader.js';
import { Utils } from './Utils.js';

/* FILES */
const topoVertCode = await Utils.readShaderFile('js/src/testShader/topo/topo.vert');
const topoFragCode = await Utils.readShaderFile('js/src/testShader/topo/topo.frag');
const blurVertCode = await Utils.readShaderFile('js/src/blurShader/blur.vert');
const blurFragCode = await Utils.readShaderFile('js/src/blurShader/blur.frag');
const canvasVertCode = await Utils.readShaderFile('js/src/canvasShader/canvas.vert');
const canvasFragCode = await await Utils.readShaderFile('js/src/canvasShader/canvas.frag');

/* DOM Elements */
const slider = document.getElementById('conv_slider');
var sliderLabel = document.getElementById('sliderlabel');
const checkbox = document.getElementById('cost_checkbox');
var hasSliderChanged = false;
var hasCheckboxChanged = false;

/* Globals */
const glContext = new GLContext();
const gl = glContext.gl;
// glContext.listContextCapabilities();
const shaderList = glContext.shaderList;
var tick = 0.0;
var decayFactor = 0.95;
const mapFile = 'testmap6.xyz';
var kernelSize = Math.abs(slider.value*2-1);
var sigma = kernelSize/3;
var uIsHorizontal = true;

/* Event Listeners */
slider.oninput = function () {
    hasSliderChanged = true;
    const val = Math.abs(this.value*2-1);
    sliderLabel.innerHTML = val == 1 ? 'off' : val;
    kernelSize = val;
    sigma = val/3;
}
checkbox.onchange = function () {
    hasCheckboxChanged = true;
}


// global uniforms
const globalUniforms = {
    uSampler: ['1i', 0],
    uResolution: ['2fv', [canvas.width, canvas.height]],
    uTime: ['1f', tick],
    uShowCursor: ['bool', false],
    uMouse: ['3fv', new Float32Array([0.0, 0.0, 0.0])],
    uSlider: ['1f', 0.5],
};
const globalAttributes = {
    'aPosition': [0, [2, 'FLOAT', false, 0, 0], Utils.canvasPoints],
    'aTexCoord': [1, [2, 'FLOAT', false, 0, 0], Utils.quadTextCoords],
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
shaderList.push(topoShader);
shaderList.push(blurShader);
shaderList.push(canvasShader);

/* Prepare Textures */
// Prepare Topography Map from Point Cloud
var topoMap = await Utils.readXYZMapToTexture('js/src/testShader/topo/maps/' + mapFile);
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

function updateUniforms() {
    tick += 0.01;
    for (const shader of shaderList) {
        gl.useProgram(shader.program);
        gl.uniform1f(gl.getUniformLocation(shader.program, 'uTime'), tick);

        if (hasSliderChanged) {
            blurShader.updateUniform('uKernel', '1fv', Utils.gaussKernel1D(kernelSize, sigma, true));
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

const animate = () => {
    updateUniforms();
    gl.clearColor(0.0, 1.0, 0.0, 1.0);
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

    requestAnimationFrame(animate);
}

animate();
