const canvasVertexShaderSource = `#version 300 es
#pragma vscode_glsllint_stage : vert

layout(location=0) in vec2 aCanvas;
layout(location=1) in vec2 aTextureCoord;

out vec2 vTextureCoord;

void main() {
    vTextureCoord = aTextureCoord;

    vec3 pos = vec3(aCanvas, 0.0);
    gl_Position = vec4(pos, 1.0);
}
`;


const canvasFragmentShaderSource = `#version 300 es
#pragma vscode_glsllint_stage : frag
precision mediump float;

// texture data
in vec2 vTextureCoord;
uniform sampler2D uSampler; // texture unit 0

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uMouse;

out vec4 fragColor;

vec3 drawMouseCursor(vec2 st, vec2 mousePos) {
    vec3 color = vec3(0.0);
     if ((abs(st.x - mousePos.x) < 0.001 || abs(st.y - mousePos.y) < 0.001) && distance(st, mousePos) < 0.015) {
        color = vec3(1.0, 0.0, 0.0);
    }
    return color;
}

void main() {
    // float time = uTime;
    // //normalize gl_FragCoord with correct aspect ratio
    // float aspectRatio = uResolution.x / uResolution.y;
    // vec2 st = gl_FragCoord.xy / uResolution.xy * vec2(aspectRatio, 1.0);
    // // normalize mouse position with correct aspect ratio
    // vec2 mousePos = uMouse.xy * vec2(aspectRatio, 1.0);
    // float mouseButton = uMouse.z;

    // vec3 color = vec3(1.0);
    // if (mouseButton == 1.0) {
    //     color = vec3(0.9);
    // }

    //fragColor = vec4(color, 1.0);
    fragColor = texture(uSampler, vTextureCoord);
}
`;

export class WebGLRenderer {
    constructor(canvasId, physarumManager) {
        this.canvas = document.getElementById(canvasId);
        this.gl = this.canvas.getContext('webgl2');
        this.physarumManager = physarumManager;

        // Canvas program
        this.canvasProgram = this.gl.createProgram();
        this.canvasFragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.canvasVertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);

        this.aCanvasBuffer = this.gl.createBuffer();
        this.canvasBorder;

        // Canvas Texture
        this.canvasTexture = this.gl.createTexture(); 
        
        // Particle program
        this.particleProgram = this.gl.createProgram();
        this.particleFragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.particleVertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);

        this.aParticlesBuffer = this.gl.createBuffer();

        this.onMouseMove = this.onMouseMove.bind(this);
        this.onResize = this.onResize.bind(this);
        this.uPointSize = 3.0;
        this.uTime = 0.0;

        this.createCanvasShaders();
        this.createParticlesShaders();

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
        // Vertex shader
        const particleVertexShaderSource = 
        `#version 300 es

        in vec3 aPopulation;

        uniform float uPointSize;
        uniform float uTime;
        uniform vec3 uMouse;

        void main() {
            // normalize mouse position
            vec2 mouse = uMouse.xy;
            mouse.x = (mouse.x * 2.0) - 1.0;
            mouse.y = (mouse.y * 2.0) - 1.0;

            // mouse attraction force of radius 0.5
            vec2 mouseForce = vec2(0.0);
            if (distance(aPopulation.xy, mouse) < 0.5) {
                mouseForce = normalize(mouse - aPopulation.xy) * 0.1;
            }

            vec2 pos = vec2(aPopulation.xy);

            // add mouse force position 
            pos += mouseForce;
            


            gl_Position = vec4(pos, 0.0, 1.0);
            gl_PointSize = uPointSize;
        }
        `;
        
        // Fragment shader
        const particleFragmentShaderSource = 
        `#version 300 es
        precision mediump float;


        uniform vec2 uResolution;

        out vec4 fragColor;

        void main() {
            
            // normalize gl_FragCoord with correct aspect ratio
            float aspectRatio = uResolution.x / uResolution.y;
            vec2 st = gl_PointCoord.xy * vec2(aspectRatio, 1.0);
            // normalize mouse position with correct aspect ratio

            vec3 color = vec3(0);
            fragColor = vec4(color, 1.0);
        }
        `;

        // Vertex shader
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

        // Link the particleProgram
        this.gl.linkProgram(this.particleProgram);
        this.gl.useProgram(this.particleProgram); // -1 if not linked
        if (!this.gl.getProgramParameter(this.particleProgram, this.gl.LINK_STATUS)) {
            // getProgramInfoLog() returns a string containing info about the last link error
            // use %c to apply css to the log
            const str = this.gl.getProgramInfoLog(this.particleProgram);
            console.log('%c ↓ Error linking particleProgram:\n', 'color: purple', str); 
        }
        this.prepareParticleAttributes();
        this.prepareUniforms(this.particleProgram);
    }


    prepareUniforms(program) {
        /*
        const uniformLocation = getUniformLocation(program, 'uniform_name')
        const bufferData = Float32Array([]), etc.
        uniform1f(uniformLocation, bufferData) for float, uniform2fv(location, bufferData) for vec2, etc.
            EXAMPLE:
            uniform1f(uniformLocation, 0.5);
            uniform2fv(uniformLocation, new Float32Array([0.5, 0.5]));
        */

        // set to use program and get attached program name
        this.gl.useProgram(program);
        const programName = program === this.canvasProgram ? 'canvasProgram ' : 'particleProgram ';

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
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        // uPointSize
        if (program === this.particleProgram) {
            const uPointSize = this.gl.getUniformLocation(program, 'uPointSize');
            this.gl.uniform1f(uPointSize, this.uPointSize);
            if (uPointSize === null) {
                console.log('%c' + programName + 'uPointSize uniform was not found or used', 'color: yellow');
            }
        }

        // Texture uSampler
        const textureUnit = 0;
        if (program === this.canvasProgram) {
            const uSampler = this.gl.getUniformLocation(program, 'uSampler');
            this.gl.uniform1i(uSampler, textureUnit); // texture unit 1
            if (uSampler === null) {
                console.log('%c' + programName + 'uSampler uniform was not found or used', 'color: yellow');
            }   
        }
    }

    prepareCanvasAttributes() {
        /*
        const attributeLocation var from getAttribLocation(canvasProgram, 'attribute_name')
        const bufferData = Float32Array([])
        const buffer = createBuffer()
        bindBuffer(ARRAY_BUFFER, buffer)
        bufferData(ARRAY_BUFFER, bufferData, STATIC_DRAW) if not changing
        enableVertexAttribArray(attributeLocation) only once after binding to buffer
        define buffer layout: vertexAttribPointer(attributeLocation, nr_of_chunks, FLOAT, normalized=false, chunk_size_in_bytes, offset_in_bytes)
        */

        // set to use program and get attached program name
        this.gl.useProgram(this.canvasProgram);

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
        
        // create color texture on the fly, further steps don't require async loading
        // make map at least 4x4
        const pixelMap = new Uint8Array([
            0, 0, 255,  // blue
            255, 255, 0, // yellow
            255, 0, 0, // red
            0, 255, 0, // green

            255, 0, 0,  // red
            0, 255, 0,  // green
            0, 0, 255,  // blue
            255, 255, 0, // yellow

            0, 0, 255,  // blue
            255, 255, 0, // yellow
            255, 0, 0,  // red
            0, 255, 0,  // green

            255, 0, 0,  // red
            0, 255, 0,  // green
            0, 0, 255,  // blue
            255, 255, 0, // yellow

            0, 0, 255,  // blue
            255, 255, 0, // yellow
            255, 0, 0, // red
            0, 255, 0, // green

            255, 0, 0,  // red
            0, 255, 0,  // green
            0, 0, 255,  // blue
            255, 255, 0, // yellow

            0, 0, 255,  // blue
            255, 255, 0, // yellow
            255, 0, 0,  // red
            0, 255, 0,  // green

            255, 0, 0,  // red
            0, 255, 0,  // green
            0, 0, 255,  // blue
            255, 255, 0, // yellow


            0, 0, 255,  // blue
            255, 255, 0, // yellow
            255, 0, 0,  // red
            0, 255, 0,  // green

            255, 0, 0,  // red
            0, 255, 0,  // green
            0, 0, 255,  // blue
            255, 255, 0, // yellows

            255, 0, 0,  // red
            0, 255, 0,  // green
            0, 0, 255,  // blue
            255, 255, 0, // yellow

            0, 0, 255,  // blue
            255, 255, 0, // yellow
            255, 0, 0, // red
            0, 255, 0, // green

        ]);

        //this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.canvasTexture);
        // where width and height describe the size of the texture in pixels
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, 4, 4, 0, this.gl.RGB, this.gl.UNSIGNED_BYTE, pixelMap);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    }

    loadImages = async (path) => new Promise(resolve => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.src = path;
    });

    prepareParticleAttributes() {
        // set to use program and get attached program name
        this.gl.useProgram(this.particleProgram);

        // aPopulation
        const aPopulationLoc = this.gl.getAttribLocation(this.particleProgram, 'aPopulation');
        const populationBuffer = new Float32Array(
            this.physarumManager.population.map((p) => {
                return [p.position.x, p.position.y, p.rotation];
            }).flat()
        );
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.aParticlesBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, populationBuffer, this.gl.STATIC_DRAW);
        this.gl.enableVertexAttribArray(aPopulationLoc);
        this.gl.vertexAttribPointer(aPopulationLoc, 3, this.gl.FLOAT, true, 3*4, 0);
        if (aPopulationLoc === -1) {
            console.log('%c aPopulation attribute was not found or used', 'color: yellow');
        }
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

    drawPoints() {

        // depth test should be disabled for 2D rendering:
        /*
            gl.useProgram( shader1 );
            gl.bindBuffer(cubeVbo )
            gl.vertexAttribPointer() ...
            gl.drawArrays()
            gl.useProgram( shader2 );
            gl.bindBuffer(cubeNormalVbo )
            gl.vertexAttribPointer() ...
            gl.drawArrays()
        */
        this.gl.useProgram(this.canvasProgram);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.aCanvasBuffer);
        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, 4);

        this.gl.useProgram(this.particleProgram);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.aParticlesBuffer);
        this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, true, 0, 0);
        this.gl.drawArrays(this.gl.POINTS, 0, this.physarumManager.count);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this)); // bind this to the animate function
        // to set fps, use setTimeout or requestAnimationFrame
        this.prepareParticleAttributes();

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

        if (this.uTime % 2 === 0) {
            this.updatePopulation();
        }
        this.drawPoints();

    }
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
const buffer = createBuffer(), bindBuffer(ARRAY_BUFFER, buffer), bufferData(ARRAY_BUFFER, bufferData, STATIC_DRAW) if not changing
enableVertexAttribArray(attributeLocation) only once after binding to buffer
define buffer layout: vertexAttribPointer(attributeLocation, nr_of_chunks, FLOAT, normalized=false, chunk_size_in_bytes, offset_in_bytes)
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

