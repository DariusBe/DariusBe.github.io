import { Utils } from './Utils.js';
import { PhysarumManager } from './physarum.js';

/* Prepare Shader Sources */
const canvasVertexShaderSource = await Utils.readShaderFile('js/src/canvasShader/canvasVertexShader.glsl');
const canvasFragmentShaderSource = await Utils.readShaderFile('js/src/canvasShader/canvasFragmentShader.glsl');
const particleVertexShaderSource = await Utils.readShaderFile('js/src/particleShader/particleVertexShader.glsl');
const particleFragmentShaderSource = await Utils.readShaderFile('js/src/particleShader/particleFragmentShader.glsl');

export class WebGLRenderer {
    constructor(canvasId, physarumManager) {
        this.canvas = document.getElementById(canvasId);
        this.gl = this.canvas.getContext('webgl2');

        // Physarum Management
        this.particleCount = 15;
        this.physarumManager = physarumManager || new PhysarumManager(this.particleCount);

        // Canvas program
        this.canvasProgram = this.gl.createProgram();
        this.canvasFragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.canvasVertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);

        this.canvasVAO = this.gl.createVertexArray();
        this.aCanvasBuffer = this.gl.createBuffer();
        this.canvasBorder;

        // Canvas Texture
        this.canvasTexture = this.gl.createTexture(); 
        
        // Particle program
        this.particleProgram = this.gl.createProgram();
        this.particleFragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.particleVertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);

        this.vao_1 = this.gl.createVertexArray();
        this.buffer_1 = this.gl.createBuffer();

        // Uniforms
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onResize = this.onResize.bind(this);
        this.uPointSize = 1.5;
        this.uTime = 0.0;

        // TFO
        this.vao_2 = this.gl.createVertexArray();
        this.tfoBufferSize = this.particleCount*3;
        this.buffer_2 = this.gl.createBuffer();

        this.createCanvasShaders();
        this.createParticlesShaders();

        this.vao = this.vao_1;
        this.buffer = this.buffer_2;
        this.animate();
    }

    createCanvasShaders() {
        // Vertex shader
        this.gl.shaderSource(this.canvasVertexShader, canvasVertexShaderSource);
        this.gl.compileShader(this.canvasVertexShader);
        this.gl.attachShader(this.canvasProgram, this.canvasVertexShader);
        if (!this.gl.getShaderParameter(this.canvasVertexShader, this.gl.COMPILE_STATUS)) {
            console.log('%cVertex shader compile error:\n', 'color: red', this.gl.getShaderInfoLog(this.canvasVertexShader));
        }

        // Fragment shader
        this.gl.shaderSource(this.canvasFragmentShader, canvasFragmentShaderSource);
        this.gl.compileShader(this.canvasFragmentShader);
        this.gl.attachShader(this.canvasProgram, this.canvasFragmentShader);
        if (!this.gl.getShaderParameter(this.canvasFragmentShader, this.gl.COMPILE_STATUS)) {
            console.log('%cFragment shader compile error:\n', 'color: red', this.gl.getShaderInfoLog(this.canvasFragmentShader));
        }

        // Link the canvasProgram
        this.gl.linkProgram(this.canvasProgram);
        this.gl.useProgram(this.canvasProgram); // -1 if not linked
        if (!this.gl.getProgramParameter(this.canvasProgram, this.gl.LINK_STATUS)) {
            // getProgramInfoLog() returns a string containing info about the last link error
            // use %c to apply css to the log
            const str = this.gl.getProgramInfoLog(this.canvasProgram);
            console.log('%c ↓ Error linking canvasProgram:\n', 'color: purple', str); 
            //console.log('%cError linking canvasProgram:\n', 'color: red', this.gl.getProgramInfoLog(this.canvasProgram));
        }
        this.prepareCanvasAttributes();
        this.prepareUniforms(this.canvasProgram);
    }

    createParticlesShaders() {
        this.gl.shaderSource(this.particleVertexShader, particleVertexShaderSource);
        this.gl.compileShader(this.particleVertexShader);

        this.gl.attachShader(this.particleProgram, this.particleVertexShader);
        if (!this.gl.getShaderParameter(this.particleVertexShader, this.gl.COMPILE_STATUS)) {
            console.log('%cVertex shader compile error:\n', 'color: red', this.gl.getShaderInfoLog(this.particleVertexShader));
        }

        // Fragment shader
        this.gl.shaderSource(this.particleFragmentShader, particleFragmentShaderSource);
        this.gl.compileShader(this.particleFragmentShader);
        this.gl.attachShader(this.particleProgram, this.particleFragmentShader);
        if (!this.gl.getShaderParameter(this.particleFragmentShader, this.gl.COMPILE_STATUS)) {
            console.log('%cFragment shader compile error:\n', 'color: red', this.gl.getShaderInfoLog(this.particleFragmentShader));
        }

        // TFO for transform feedback here
        this.gl.transformFeedbackVaryings(this.particleProgram, ['position'], this.gl.INTERLEAVED_ATTRIBS);

        // Link the particleProgram
        this.gl.linkProgram(this.particleProgram);

        this.gl.useProgram(this.particleProgram); // -1 if not linked
        if (!this.gl.getProgramParameter(this.particleProgram, this.gl.LINK_STATUS)) {
            // getProgramInfoLog() returns a string containing info about the last link error
            // use %c to apply css to the log
            const str = this.gl.getProgramInfoLog(this.particleProgram);
            console.log('%c ↓ Error linking particleProgram:\n', 'color: purple', str); 
        }

        this.prepareParticleTransformFeedback();
        this.prepareParticleAttributes();
        this.prepareUniforms(this.particleProgram);
        
    }


    prepareUniforms(program) {
        // set to use program and get attached program name
        this.gl.useProgram(program);
        const programName = program === this.canvasProgram ? 'canvasProgram ' : 'particleProgram ';

        // canvasProgram uniforms
        if (program === this.canvasProgram) {
            // uTime
            var uTime = this.gl.getUniformLocation(program, 'uTime');
            this.gl.uniform1f(uTime, this.uTime);
            if (uTime === null) {
                console.log('%c' + programName + 'uTime uniform was not found or used', 'color: yellow');
            }
            // uResolution
            const uResolution = this.gl.getUniformLocation(program, 'uResolution');
            this.gl.uniform2fv(uResolution, new Float32Array([window.innerWidth, window.innerHeight]));
            if (uResolution === null) {
                console.log('%c'+ programName +'uResolution uniform was not found or used', 'color: yellow');
            }
            // uMouse
            const uMouse = this.gl.getUniformLocation(program, 'uMouse');
            this.gl.uniform3fv(uMouse, new Float32Array([0.0, 0.0, 0.0]));
            if (uMouse === null) {
                console.log('%c' + programName + 'uMouse uniform was not found or used', 'color: yellow');
            }
            // uSampler
            const textureUnit = 0;
            const uSampler = this.gl.getUniformLocation(program, 'uSampler');
            this.gl.uniform1i(uSampler, textureUnit); // texture unit 1
            if (uSampler === null) {
                console.log('%c' + programName + 'uSampler uniform was not found or used', 'color: yellow');
            } 
        }

        // particleProgram uniforms
        if (program === this.particleProgram) {
            // uPointSize
            const uPointSize = this.gl.getUniformLocation(program, 'uPointSize');
            this.gl.uniform1f(uPointSize, this.uPointSize);
            if (uPointSize === null) {
                console.log('%c' + programName + 'uPointSize uniform was not found or used', 'color: yellow');
            }
        }
    }

    prepareCanvasAttributes() {
        // set to use program and get attached program name
        this.gl.useProgram(this.canvasProgram);

        this.gl.bindVertexArray(this.canvasVAO);
        // aCanvas
        const aCanvasLoc = this.gl.getAttribLocation(this.canvasProgram, 'aCanvas');        
        this.canvasBorder = new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            1.0, 1.0,
            -1.0, 1.0
        ]);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.aCanvasBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.canvasBorder, this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(aCanvasLoc);
        this.gl.vertexAttribPointer(aCanvasLoc, 2, this.gl.FLOAT, false, 0, 0);
        if (aCanvasLoc === -1) {
            console.log('%c aCanvas attribute was not found or used', 'color: yellow');
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        // Texture aTextureCoord
        const aTextureCoordLoc = this.gl.getAttribLocation(this.canvasProgram, 'aTextureCoord');
        const texCoordBufferData = new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ]);
        const texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoordBufferData, this.gl.STATIC_DRAW);
        this.gl.vertexAttribPointer(aTextureCoordLoc, 2, this.gl.FLOAT, false, 0, 0); // 1 is the location of aTextureCoord
        this.gl.enableVertexAttribArray(aTextureCoordLoc); // 1 is the location of aTextureCoord

        // async code block in using async Utils.loadImages
        const prepareTextureBuffer = async () => {
            const pixelMap = await Utils.loadImage('src/img/labyrinth_1_penalty.png');
            const imageWidth = pixelMap.width;
            const imageHeight = pixelMap.height;
            
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true); // flip image vertically
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.canvasTexture);
            // where width and height describe the size of the texture in pixels
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, imageWidth, imageHeight, 0, this.gl.RGB, this.gl.UNSIGNED_BYTE, pixelMap);
            
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        }

        prepareTextureBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindVertexArray(null);
    }

    prepareParticleAttributes() {
        // set to use program and get attached program name
        this.gl.useProgram(this.particleProgram);
        const initialData = new Float32Array(
            this.physarumManager.population.map(p => [p.position.x, p.position.y, 0.0]).flat()
        );

        this.gl.bindVertexArray(this.vao_1);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer_1);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, 3 * 4 * this.particleCount, this.gl.DYNAMIC_DRAW);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, initialData);
        this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 3*4, 0);
        this.gl.enableVertexAttribArray(0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindVertexArray(null);
    }

    // TFOs
    prepareParticleTransformFeedback() {
        // set to use program and get attached program name
        this.gl.useProgram(this.particleProgram);

        this.gl.bindVertexArray(this.vao_2);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer_2);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, 3 * 4 * this.particleCount, this.gl.DYNAMIC_DRAW);
        this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 3*4, 0);
        this.gl.enableVertexAttribArray(0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindVertexArray(null);
    }

    onMouseMove(e) {
        // get mouse position
        var button = 0.0;
        if (e.buttons === 1) {
            // left mouse button
            button = 1.0;
        } else if (e.buttons === 2) {
            // right mouse button
            button = 2.0;
        }

        this.gl.useProgram(this.canvasProgram);
        this.gl.uniform3fv(this.gl.getUniformLocation(this.canvasProgram, 'uMouse'), new Float32Array([e.clientX / this.canvas.width,  1-(e.clientY / this.canvas.height), button]));

        this.gl.useProgram(this.particleProgram);
        this.gl.uniform3fv(this.gl.getUniformLocation(this.particleProgram, 'uMouse'), new Float32Array([e.clientX / this.canvas.width,  1-(e.clientY / this.canvas.height), button]));
        
    }
    onResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, window.innerWidth, window.innerHeight);
        // correct aspect ratio
        this.gl.useProgram(this.canvasProgram);
        this.gl.uniform2fv(this.gl.getUniformLocation(this.canvasProgram, 'uResolution'), new Float32Array([window.innerWidth, window.innerHeight]));
        this.gl.useProgram(this.particleProgram);
        this.gl.uniform2fv(this.gl.getUniformLocation(this.particleProgram, 'uResolution'), new Float32Array([window.innerWidth, window.innerHeight]));
    }

    updatePopulation() {
        this.physarumManager.update();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this)); // bind this to the animate function
        // to set fps, use setTimeout or requestAnimationFrame
        //this.prepareParticleAttributes();

        // update time for both programs
        this.uTime += 1;
        this.gl.useProgram(this.canvasProgram);
        this.gl.uniform1f(this.gl.getUniformLocation(this.canvasProgram, 'uTime'), this.uTime);
        this.gl.useProgram(this.particleProgram);
        this.gl.uniform1f(this.gl.getUniformLocation(this.particleProgram, 'uTime'), this.uTime);


        // update after window resize
        window.addEventListener('resize', this.onResize.bind(this));
        // update mouse uniform
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));            
       
        const view = new Float32Array(this.tfoBufferSize);
        this.gl.bindBuffer(this.gl.TRANSFORM_FEEDBACK_BUFFER, this.tfoBuffer);
        this.gl.getBufferSubData(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, view);
        this.gl.bindBuffer(this.gl.TRANSFORM_FEEDBACK_BUFFER, null);
        console.log(view);
        this.drawPoints();
    }

    drawPoints() {
        // canvas VAO and program
        // this.gl.useProgram(this.canvasProgram);
        // this.gl.bindVertexArray(this.canvasVAO);
        // this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);
        // this.gl.bindVertexArray(null);

        this.gl.useProgram(this.particleProgram);
        
        // switch between particle and TFO loop
        this.gl.bindVertexArray(this.vao);
        // vertexAttribPointer args are (index, size, type, normalized, stride, offset)
        // this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 3*4, 0);
        this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.buffer);
        this.gl.beginTransformFeedback(this.gl.POINTS);
        this.gl.drawArrays(this.gl.POINTS, 0, this.particleCount);
        this.gl.endTransformFeedback();
        this.gl.bindVertexArray(null);
        this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

        if (this.vao === this.vao_1) {
            this.vao = this.vao_2;
            this.buffer = this.buffer_1;
            console.log('Switching to vao_1');
        } else {
            this.vao = this.vao_1;
            this.buffer = this.buffer_2;
            console.log('Switching to vao_2');
        }

        // this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);


        // this.gl.bindVertexArray(this.vao_1);
        
        // // TFO
        // this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.buffer_2); // for interleaved attribs, index is 0
        // this.gl.beginTransformFeedback(this.gl.POINTS);

        // this.gl.drawArrays(this.gl.POINTS, 0, this.physarumManager.count);
        // // TFO
        // this.gl.endTransformFeedback();

        // this.gl.bindVertexArray(null);
        // // TFO
        // this.gl.bindBufferBase(this.gl.TRANSFORM_FEEDBACK_BUFFER, 0, null); // unbind TFO buffer
    }

    getBufferContents = (buffer) => {
        const sync = this.gl.fenceSync(this.gl.SYNC_GPU_COMMANDS_COMPLETE,0);
        
        const checkStatus = () => {
            const status = this.gl.clientWaitSync(sync, this.gl.SYNC_FLUSH_COMMANDS_BIT, 0);
            if (status === this.gl.TIMEOUT_EXPIRED) {
                console.log("GPU is still busy. Let's wait some more.");
            } else if (status === this.gl.WAIT_FAILED) {
                console.error("GPU is done goofed");
            } else { 
                const view = new Float32Array (COUNT);
                gl.bindBuffer(this.gl.TRANSFORM_FEEDBACK_BUFFER, buffer);
                gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, view);
                gl.bindBuffer(this.gl.TRANSFORM_FEEDBACK_BUFFER, null);
                console.log(view);
            }
            setTimeout (checkStatus);
        };
    };
}

/*
ORDER OF OPERATIONS:

CONTEXT:
get canvas, get context

SHADER PROGRAMS:
create shader, use shaderSource(shader, src), compile(shader), attach(canvasProgram, shader)
link & use canvasProgram

ATTRIBUTES:
const attributeLocation var from getAttribLocation(canvasProgram, 'attribute_name')
const bufferData = Float32Array([])
const buffer = createBuffer()
bindBuffer(ARRAY_BUFFER, buffer)
bufferData(ARRAY_BUFFER, bufferData, STATIC_DRAW) // if not changing
enableVertexAttribArray(attributeLocation) // only once after binding to buffer
define buffer layout: 
vertexAttribPointer(attributeLocation, nr_of_chunks, FLOAT, normalized=false, chunk_size_in_bytes, offset_in_bytes)
    EXAMPLE:
    vertexAttribPointer(attributeLocation, 2, this.gl.FLOAT, false, 3*4, 0);
    would mean we have an array of 3 floats (= 4 bytes) per vertex, and we want to use the first 2 floats as x,y coordinates
    vertexAttribPointer(attributeLocation, 1, this.gl.FLOAT, false, 3*4, 2*4);
    to get the third float from the array

UNIFORMS:
const uniformLocation = getUniformLocation(canvasProgram, 'uniform_name')
const bufferData = Float32Array([]), etc.
uniform1f(uniformLocation, bufferData) for float, uniform2fv(location, bufferData) for vec2, etc.
    EXAMPLE:
    uniform1f(uniformLocation, 0.5);
    uniform2fv(uniformLocation, new Float32Array([0.5, 0.5]));

TEXTURES:
- necessary in fragment shader are uniform sampler2D uSampler 
    and an attribute in vec2 vTextureCoord that is passed from vertex shader:
        VERTEX SHADER:
            #version 300 es

            layout(location=0) in vec2 aCanvas;
            layout(location=1) in vec2 aTextureCoord;   --> incoming texture coordinates

            void main() {
                vTextureCoord = aTextureCoord;          --> pass texture coordinates to fragment shader
                gl_Position = vec4(aCanvas, 0.0, 1.0);
            }

        FRAGMENT SHADER:
            #version 300 es
            precision mediump float;

            // texture data
            in vec2 vTextureCoord;                      --> incoming texture coordinates from vertex shader
            uniform sampler2D uSampler; //textureunit 0 --> necessary uniform for texture
            out vec4 fragColor;

            void main() {
                fragColor = texture(uSampler, vTextureCoord);
            }

given that vertices already exist, are bound to buffer and have been defined with vertexAttribPointer
    EXAMPLE:
        plane = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        1.0, 1.0,
        -1.0, 1.0
    ]);
provide texture coordinates as attribute:
const texCoordBufferData = Float32Array([0.0, 0.0, ...]), with texture coordinates for each vertex matching order of vertices
    EXAMPLE: Cube Unwrapping
        "1.0, 1.0, 1.0,  0.0, 0.0"
        X    Y    Z                                   U    V
        -1.0, -1.0, (1.0) (top right (front)) lies at 0.0, 0.0 (bottom left of texture)
        ...
const texCoordBuffer = createBuffer()
bindBuffer(ARRAY_BUFFER, texCoordBuffer)
bufferData(ARRAY_BUFFER, texCoordBufferData, STATIC_DRAW)
vertexAttribPointer(texCoordLocation, 2, FLOAT, false, 0, 0)
enableVertexAttribArray(texCoordLocation)
provide texture image from file (async) or array 'pixels':
    EXAMPLE:
        const loadImage = () =>  new Promise(resolve => {
            const img = new Image();
            image.addEventListener('load', () => resolve(img));
            img.src = './image.jpg';
        });
        const run = async () => {
            const img = loadImage('image.jpg');
            // all later texture code must be in the async function
            [ const texture = createTexture();
                ... ]
            };
    or
        const pixels = new Uint8Array([
            255, 0, 0, 255,  // red
            0, 255, 0, 255,  // green
            0, 0, 255, 255,  // blue
            255, 255, 0, 255 // yellow
        ]);
- either way, image will be flipped vertically due to openGL coordinate system, so lets flip storage strategy before creating texture
    pixelStorei(UNPACK_FLIP_Y_WEBGL, true)
const texture = createTexture()
bindTexture(TEXTURE_2D, texture)
texImage2D(TEXTURE_2D, 0, RGBA, 4, 4, 0, RGBA, gl.UNSIGNED_BYTE, pixels) // target, mipmap_level, internalFormat, (opt. width, height, border=always_zero,) format, type, data_source
- WebGL by default requires mipmaps (either create ad-hoc (1) or change default config (2))
    1) generateMipmap(TEXTURE_2D)
    2) texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, NEAREST) and texParameteri(TEXTURE_2D, TEXTURE_MAG_FILTER, NEAREST)



DRAW:
gl.useProgram( shader1 );
gl.bindBuffer(cubeVbo )
gl.vertexAttribPointer() ...
gl.drawArrays()
gl.useProgram( shader2 );
gl.bindBuffer(cubeNormalVbo )
gl.vertexAttribPointer() ...
gl.drawArrays()
drawArrays(mode, first, count)

TRANSFORM FEEDBACK:
- allows to capture output of vertex shader in buffer object
        VERTEX SHADER:
            #version 300 es

            out vec4 outValue; // e.g. position
            out float outValue2; // e.g. velocity
            out vec2 vTexCoords; // e.g. not relevant --> not in transformFeedback array

            void main() {
                vTextureCoord = aTextureCoord;
                gl_Position = vec4(aCanvas, 0.0, 1.0);
            }
- in js call 
transformFeedbackVaryings(program, ['outValue', 'outValue2'], SEPARATE_ATTRIBS)
    then link program and use it.. order of outValues in array must match order of attributes in buffer
- SEPARETE_ATTRIBS for one buffer per outVal, INTERLEAVED_ATTRIBS would put all outputs in one buffer
optional: 
    const tfo = createTransformFeedback()           // manage TF operations, keep track in case of multiple TFOs
    bindTransformFeedback(TRANSFORM_FEEDBACK, tfo)  // to then bind it
bindBufferBase(TRANSFORM_FEEDBACK_BUFFER, 0, buffer) // to bind buffer to TFO
- here, index is 0/1/2 ... for each of the outValues with SEPARATE_ATTRIBS, or 0 for INTERLEAVED_ATTRIBS
beginTransformFeedback(GL_PRIMITIVES) // PRIMITIVES are either POINTS, LINES, TRIANGLES and must be sane as in draw-call
endTransformFeedback() // end the feedback
- TF can also be paused and resumed, e.g. to continue writing to the same buffer with other shaders
- most common sources of error are wrongly bound buffers:
    - after initialization all array buffers always unbind with bindBuffer(ARRAY_BUFFER, null)
    - after every animation frame and the completion of a TFO, unbind both ARRAY_BUFFER and TRANSFORM_FEEDBACK_BUFFER:
    gl.bindBuffer(ARRAY_BUFFER, null)
    gl.bindBuffer(TRANSFORM_FEEDBACK_BUFFER, null)
*/


// let runs = 1000;
// const start = performance.now();
// for (let i = 0; i < runs; i++) {

// }
// const end = performance.now();
// console.log('Time to draw', runs,'times: ' + (end - start) + ' ms');
// prepareAttributes() {
    //     const aPosition = this.gl.getAttribLocation(this.canvasProgram, 'aPosition');
    //     const aRotation = this.gl.getAttribLocation(this.canvasProgram, 'aRotation');
        

    //     const aPosition = 0;
    //     const aRotation = 1;

        
    //     this.gl.enableVertexAttribArray(aPosition);
    //     this.gl.enableVertexAttribArray(aRotation);

    //     const posBuffer = this.gl.createBuffer();
    //     this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuffer);
    //     this.gl.bufferData(this.gl.ARRAY_BUFFER, this.positionBuffer, this.gl.STATIC_DRAW);

    //     const rotBuffer = this.gl.createBuffer();
    //     this.gl.bindBuffer(this.gl.ARRAY_BUFFER, rotBuffer);
    //     this.gl.bufferData(this.gl.ARRAY_BUFFER, this.rotationBuffer, this.gl.STATIC_DRAW);

    //     this.gl.bindBuffer(this.gl.ARRAY_BUFFER, posBuffer);
    //     this.gl.vertexAttribPointer(aPosition, 2, this.gl.FLOAT, false, 0, 0);

    //     this.gl.bindBuffer(this.gl.ARRAY_BUFFER, rotBuffer);
    //     this.gl.vertexAttribPointer(aRotation, 1, this.gl.FLOAT, false, 0, 0);

    //     this.gl.enableVertexAttribArray(aPosition);
    //     this.gl.enableVertexAttribArray(aRotation);


    //     tell gl how to unravel the buffer data types
    //     of buffer, use 2 floats for x,y. Stride is 3*4 bytes (3 floats per vertex), start at 0 bytes (location)
    //     this.gl.vertexAttribPointer(aPosition, 2, this.gl.FLOAT, false, 2*4, 0);
    //     of buffer, use 1 float for point size. Stride is 3*4 bytes (3 floats per vertex), start with offset 2*4 bytes
    //     this.gl.vertexAttribPointer(aPointSize, 1, this.gl.FLOAT, false, 3*4, 2*4);

    // }

