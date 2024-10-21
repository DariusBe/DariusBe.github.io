import { GLContext } from './GLContext.js';
import { Shader } from './Shader.js';
import { Utils } from './Utils.js';

const slider = document.getElementById('conv_slider');
const checkbox = document.getElementById('cost_checkbox');
var hasSliderChanged = false;
var hasCheckboxChanged = false;
slider.oninput = function() {
    hasSliderChanged = true;
    var val = Number(this.value).toFixed(2);
    if (val == 0.0) {
        val = 'off';
    }
    document.getElementById('sliderlabel').innerHTML = val;
}
checkbox.onchange = function() {
    hasCheckboxChanged = true;

}

const glContext = new GLContext();
const gl = glContext.gl;
// glContext.listContextCapabilities();
const shaderList = glContext.shaderList;
var tick = 0.0;
var decayFactor = 0.95;
const mapFile = 'testmap6.xyz';
const kernelSize = 9;

// global uniforms
const globalUniforms = {
    uSampler: ['1i', 0],
    uResolution: ['2fv', [canvas.width, canvas.height]],
    uTime: ['1f', tick],
    uShowCursor: ['bool', false],
    uMouse: ['3fv', new Float32Array([0.0, 0.0, 0.0]) ],
    uSlider: ['1f', 0.5],
};
    

// Canvas Shader
const blurUniforms = Object.assign({}, globalUniforms, {
    uKernelSize: ['1i', kernelSize],
    uKernel: ['1fv', Utils.gaussKernel(9, slider.value)],
    uDecay: ['1f', 0.0],
    uShowCursor: ['bool', true],
});

const blurShader = new Shader(
    gl,
    name='BlurShader',
    await Utils.readShaderFile('js/src/blurShader/blur.vert'),
    await Utils.readShaderFile('js/src/blurShader/blur.frag'),
    // attributes
    {   'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], Utils.canvasPoints],
        'aTexCoord': [ 1, [2, 'FLOAT', false, 0, 0], Utils.quadTextCoords],
    },
    blurUniforms
);

// Topography Shader
const topoUniforms = Object.assign({}, globalUniforms, {
    uShowCursor: ['bool', false],
    uCheckbox: ['bool', checkbox.checked],
});

const topoShader = new Shader(
    gl,
    name='TopoShader',
    await Utils.readShaderFile('js/src/testShader/topo/topo.vert'),
    await Utils.readShaderFile('js/src/testShader/topo/topo.frag'),
    // attributes
    {   
        'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], Utils.canvasPoints],
        'aTexCoord': [ 1, [2, 'FLOAT', false, 0, 0], Utils.quadTextCoords],
    },
    topoUniforms
);
// load topo map
var topoMap = await Utils.readXYZMapToTexture('js/src/testShader/topo/maps/'+mapFile);
const size = topoMap[topoMap.length-1];
topoMap = topoMap.slice(0, topoMap.length-1);
topoMap = Utils.normalizePointCloud(topoMap);

// prepare topo texture
const topoTexture = topoShader.prepareImageTexture(
    "uSampler", 
    topoMap, 
    'TopoTexture', 
    size, size
);
// prepare canvas texture
const canvasTexture = blurShader.prepareImageTexture(
    "uSampler", 
    Utils.getRandomStartTexture(size, size),
    'CanvasTexture', 
    size, size
);
shaderList.push(blurShader);


// prepare topo FBO
topoShader.prepareFramebufferObject(
    gl.COLOR_ATTACHMENT0, 
    canvasTexture,
    canvas.width, 
    canvas.height, 
    gl.RGBA16F
);
shaderList.push(topoShader);

function updateUniforms() {
    tick += 0.01;
    for (const shader of shaderList) {
        gl.useProgram(shader.program);
        gl.uniform1f(gl.getUniformLocation(shader.program, 'uTime'), tick);
            // blurShader.updateUniform('uKernel','1fv', Utils.gaussKernel(9, Math.max(1, sigma)));
        if (hasSliderChanged) {
            blurShader.updateUniform('uKernel', '1fv', Utils.gaussKernel(9, slider.value));
            hasSliderChanged = false;
        }
    }
    if (hasCheckboxChanged) {
        topoShader.updateUniform('uCheckbox', 'bool', checkbox.checked);
        hasCheckboxChanged = false;
    }

    gl.useProgram(null);
}

const animate = () => {

    updateUniforms();
    gl.clearColor(0.0, 1.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT); 
    // gl.useProgram(topoShader.program);
    // gl.bindVertexArray(topoShader.vao);


    // use fbo to render into texture
    gl.useProgram(topoShader.program);
    gl.bindVertexArray(topoShader.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, topoShader.fbo[0]);
    gl.bindTexture(gl.TEXTURE_2D, topoTexture);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);


    // render canvas
    gl.useProgram(blurShader.program);
    gl.bindVertexArray(blurShader.vao);
    gl.bindTexture(gl.TEXTURE_2D, canvasTexture);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    requestAnimationFrame(animate);
}

animate();
