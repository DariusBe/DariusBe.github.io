import { GLContext } from './GLContext.js';
import { Shader } from './Shader.js';
import { Utils } from './Utils.js';
import '../gl-matrix-min.js';

/* FILES */
const basePath = 'js/src/';
const particleVertCode = await Utils.readShaderFile(basePath + 'testShader/tf/tf.vert');
const particleFragCode = await Utils.readShaderFile(basePath + 'testShader/tf/tf.frag');
const canvasVertCode = await Utils.readShaderFile(basePath + 'testShader/canvas/canvas.vert');
const canvasFragCode = await await Utils.readShaderFile(basePath + 'testShader/canvas/canvas.frag');
const testImage = await Utils.loadImage(basePath+'testShader/tf/testmap.png');

/* DOM Elements */
const slider = document.getElementById('conv_slider');
var sliderLabel = document.getElementById('sliderlabel');
const checkbox = document.getElementById('cost_checkbox');
var hasSliderChanged = false;
var hasCheckboxChanged = false;

/* Globals */
const PARTICLE_COUNT = canvas.width * canvas.height;
const BYTE = 4;
const BUFFSIZE = PARTICLE_COUNT * BYTE * 4;
const TIMESTEP = 0.01;

const glContext = new GLContext();
const gl = glContext.gl;
glContext.listContextStats();
const shaderList = glContext.shaderList;
var tick = 0.0;

/* Event Listeners */
slider.oninput = function () {
}
checkbox.onchange = function () {

}

// global uniforms and attributes
// const globalUniforms = {
//     // uSampler: ['1i', 0],
//     uSlider: ['1f', 0.5]
// };
const globalAttributes = {
    'aPosition': [0, [3, 'FLOAT', false, 5 * BYTE, 0], Utils.canvasAttribs],
    'aTexCoord': [1, [2, 'FLOAT', false, 5 * BYTE, 3 * BYTE], Utils.canvasAttribs],
};

/* PARTICLE */
const particleUniforms = {
    uParticleSampler: ['1i', 0],
    uCostSampler: ['1i', 1],
    uAdditionalSampler: ['1i', 2],

    uParticleCount: ['1i', PARTICLE_COUNT],
    uSensorAngle: ['1f', Math.PI / 8], // 22.5 degrees
    uSensorDistance: ['1f', 8]         // 8 pixels
};

console.log(particleUniforms);

// Transform Feedback Buffers
var TF_BUFF_1 = gl.createBuffer();
var TF_DATA = Utils.populateParticleBuffer(PARTICLE_COUNT, canvas.width, canvas.height, 0, 0);
// console.log(TF_DATA);
gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_1)
gl.bufferData(gl.ARRAY_BUFFER, TF_DATA, gl.STATIC_DRAW);
var TF_BUFF_2 = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_2)
gl.bufferData(gl.ARRAY_BUFFER, TF_DATA, gl.STATIC_DRAW);

gl.bindBuffer(gl.ARRAY_BUFFER, null);

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
    Utils.getRandomStartTexture(canvas.width, canvas.height),
    'costsurfaceTex',
    canvas.width, canvas.height,
    'LINEAR',
    'CLAMP_TO_BORDER',
    1  // texture unit 1
);

/* CANVAS */
const canvasUniforms = {
    uCanvasSampler1: ['1i', 0],
    uCanvasSampler2: ['1i', 1],
}
const canvasShader = new Shader(gl, name = 'CanvasShader',
    canvasVertCode, canvasFragCode,
    globalAttributes, canvasUniforms,
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
    gl.COLOR_ATTACHMENT0,   // equals output location in fragment shader
    emptyTexture,          // FBO will render into this texture
    'Physarum_FBO_FULL',
    canvas.width, canvas.height
);
const fbo2 = particleShader.prepareFramebufferObject(
    gl.COLOR_ATTACHMENT0,   // equals output location in fragment shader
    randomTexture,          // FBO will render into this texture
    'Physarum_FBO_EMPTY',
    canvas.width, canvas.height
);
const canvasTexture = canvasShader.prepareImageTexture(
    "uCanvasSampler2",
    testImage,
    // Utils.getRandomStartTexture(canvas.width, canvas.height),
    'canvasTex',
    canvas.width, canvas.height,
    'LINEAR',
    'CLAMP_TO_EDGE',
    1  // texture unit 0
);


/* SET ALL SHADERS GLOBAL */
glContext.setShaderGlobal(particleShader);
glContext.setShaderGlobal(canvasShader);
for (const shader of shaderList) {
    shader.getShaderDetails();
}

/* RENDER UTILS */
var renderFrom = randomTexture;
var renderInto = emptyTexture;
var fbo = fbo1;

function updateUniforms() {
    tick += TIMESTEP;
    tick = Math.round(tick * 100) / 100;
    // glContext.cameraTransform();
    gl.bindBuffer(gl.UNIFORM_BUFFER, glContext.globalUniformBuffer);
    glContext.updateGlobalUniform('uTime', tick);
    glContext.updateGlobalUniform('uModel', glContext.uModel);
    glContext.updateGlobalUniform('uView', glContext.uView);
    glContext.updateGlobalUniform('uProjection', glContext.uProjection);

    for (const shader of shaderList) {
        // glContext.updateGlobalUniform('uTime', tick);
        if (hasSliderChanged) {
        }
    }
    if (hasCheckboxChanged) {

    }
    gl.useProgram(null);
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
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, canvasTexture);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbo == fbo1 ? emptyTexture : randomTexture);

    // gl.activeTexture(gl.TEXTURE2);
    // gl.bindTexture(gl.TEXTURE_2D, canvasTexture);
    // gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    // bind result of TF to canvas shader
    // gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_2);
    // gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawArrays();
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

// console.error(particleShader.vaoList[1]);

const renderParticle = () => {
    gl.useProgram(particleShader.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_2)
    gl.bindVertexArray(particleShader.vaoList[1]);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
    gl.enable(gl.RASTERIZER_DISCARD);
    // if (particleShader.tfBuffer !== null) {
    // bindBufferBase args: target, index, buffer
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, TF_BUFF_1);
    // }
    /* rendering with fbos */
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    // gl.viewport(0, 0, canvas.width, canvas.height);
    // gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // gl.clear(gl.COLOR_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, canvasTexture);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderFrom);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT); // args: mode, first, count
    gl.disable(gl.RASTERIZER_DISCARD);   
    gl.endTransformFeedback();
    gl.bindVertexArray(null);
    gl.useProgram(null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Bind PBO and transfer data to texture
    // gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, TF_BUFF_2);
    // gl.bindTexture(gl.TEXTURE_2D, renderFrom);
    // gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, canvas.width, canvas.height, gl.RGBA, gl.FLOAT, 0);
    // // args: target, level, xoffset, yoffset, width, height, format, type, offset
    // gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);

    // 1. Bind the PBO to transfer data from the buffer to the texture
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, TF_BUFF_2);
    // 2. Bind the texture where the data will go
    gl.bindTexture(gl.TEXTURE_2D, renderFrom);

    gl.texSubImage2D(
        gl.TEXTURE_2D,                  // Target
        0,                              // Mipmap level (0 for base level)
        0, 0,                           // X and Y offsets (top-left corner)
        canvas.width,                   // Width of the area to be updated
        canvas.height,                  // Height of the area to be updated
        gl.RGBA,                        // Format of the data
        gl.FLOAT,                        // Type of the data (FLOAT, as TF data is floating-point)
        0                               // Data pointer (use 0 since it's stored in the PBO)
    );

    // 4. Unbind the PBO and the texture
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);



    // if (Math.round(tick * 100) % 100 == 0) {
    //     Utils.getBufferContents(gl, TF_BUFF_2, PARTICLE_COUNT, 4, 3);
    // }
    swapTFBuffers();
    swapFBOTextures();


    // // fill canvas buffer with transformed points
    // gl.useProgram(canvas_Shader.program);
    // gl.bindVertexArray(canvas_Shader.vao);
    // gl.bindBuffer(gl.ARRAY_BUFFER, TF_BUFF_2);
    // gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    // gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
    // gl.bindVertexArray(null);
    // gl.useProgram(null);
    // physarumShader.renderWithFBO(renderFrom, fbo, 1, costsurfaceTex);
    // swapFBOTextures();
}

const animate = () => {
    requestAnimationFrame(animate);

    // render physarum shader
    renderParticle();

    // render canvas shader
    renderCanvas();
    updateUniforms();
}

animate();