import { Utils } from './Utils.js';
// use whole of gl-matrix from gl-matrix-min.js
import '../../gl-matrix-min.js';

export class GLContext {
    gl;
    shaderList = [];
    canvas;
    sliderVal = 0.6;
    inputs = [];

    // global Uniform Buffer Object
    globalUniformBuffer;
    globalUniformBindingPoint = 0;
    globalUniformsBlock;
    globalUniformData;
    globalUniformLocation = {};

    // global uniforms
    uModel;
    uView;
    uProjection;
    uResolution;
    uTime = 5.0;
    uShowCursor;
    uMouse;

    // perspective matrices
    lookAt;
    ortho;
    perspective;

    constructor(context = 'webgl-canvas') {
        // initialize the canvas and WebGL2 context
        // set gl context to use MSAA
        this.canvas = document.getElementById(context);
        if (!this.canvas) {
            throw new Error('No canvas found with id: ' + context);
        }
        this.gl = canvas.getContext('webgl2', { antialias: true });
        if (!this.gl) {
            throw new Error('WebGL2 not supported');
        }
        this.gl.getExtension('EXT_color_buffer_float');
        this.gl.hint(this.gl.FRAGMENT_SHADER_DERIVATIVE_HINT, this.gl.NICEST);

        this.uModel = new glMatrix.mat4.create();
        this.uView = new glMatrix.mat4.create();
        this.uProjection = new glMatrix.mat4.create();

        this.lookAt = glMatrix.mat3.fromValues(
            0, 0, 4,  // viewer's position (4 units away from center)
            0, 0, 0,  // position viewer is looking at
            0, 1, 0   // up-axis);
        )
        this.ortho = new glMatrix.mat3.create();
        this.perspective = new glMatrix.mat3.create();


        // initialize global uniforms
        this.fillGlobalUniformBuffer();
        this.prepareGlobalUniforms();
        this.preparePerspective();

        this.canvas.addEventListener('touchmove', this.touchmove);
        this.canvas.addEventListener('mousemove', this.onmousemove);
        window.addEventListener('resize', this.onresize);


        /* get all inputs with id starting with 'matrix_' and setup event listeners */
        this.inputs = document.querySelectorAll('input[id^="matrix_"]');
        const inputMatrix = [];

        for (const input of this.inputs) {
            inputMatrix.push(input);
        }
        for (const input of inputMatrix) {
            const that = this;
            input.oninput = function () {
                const str = this.value;
                const val = parseFloat(this.value);
                if (val.constructor.name == 'Number') {
                    const id = this.id.split('_');
                    const whichMatrix = id[1];
                    const row = parseInt(id[2]) - 1;
                    const col = parseInt(id[3]) - 1;
                    that.updateInputMatrix(whichMatrix, row, col, val);
                }
            }
        }


    }

    /**
     * Sets up the glViewport to have a perspective based on uView and uProjection
     * @param {glMatrix.mat3} lookAtMatrix An optional 3-dimensional lookAt-matrix (otherwise default)
     */
    preparePerspective = (lookAtMatrix = this.lookAt) => {
        const row1 = new Float32Array([lookAtMatrix[0], lookAtMatrix[1], lookAtMatrix[2]]);
        const row2 = new Float32Array([lookAtMatrix[3], lookAtMatrix[4], lookAtMatrix[5]]);
        const row3 = new Float32Array([lookAtMatrix[6], lookAtMatrix[7], lookAtMatrix[8]]);


        glMatrix.mat4.lookAt(
            this.uView,
            row1,  // viewer's position (4 units away from center)
            row2,  // position viewer is looking at
            row3,  // up-axis
        );

        // const aspectRatio = this.canvas.width / this.canvas.height;
        // // args: in_matrix, fovy (vertical FoV in rad, smaller --> 'tele'), aspect_ratio, near, far (resp. distances of camera to near/far planes)
        // glMatrix.mat4.perspective(
        //     this.uProjection,
        //     Math.PI / 6, // 90 degrees --> PI = 180, PI/1.5 = 120, PI/2 = 90 deg...
        //     aspectRatio,
        //     0.01,
        //     8
        // );

        glMatrix.mat4.ortho(
            this.uProjection,
            // perspective defined as a bounding box
            // distance to.. left, right, bottom, top, near, far plane
            -1, 1, -1, 1, 0, 5 // bounding box as a unit cube that is stretched by factor 5 along z axis
        );
    }

    cameraTransform = () => {
        glMatrix.mat4.rotate(this.uModel, this.uModel, 0.01, [0, 0.53, 0.25]);
        glMatrix.mat4.scale(this.uModel, this.uModel, [.999, .999, .999]);
    }

    /* EVENT HANDLERS*/
    onmousemove = (e) => {
        const shaderList = this.shaderList;
        const gl = this.gl;

        const pressedButton = e.buttons === 1 ? 1.0 : 0.0;
        const padding = 0;
        const mouse = new Float32Array([e.clientX / canvas.width, 1 - (e.clientY / canvas.height), pressedButton, padding]);

        this.updateGlobalUniform('uMouse', mouse);
    };
    touchmove = (e) => {
        const shaderList = this.shaderList;
        const gl = this.gl;

        e.preventDefault(); // prevent scrolling
        var touch = e.touches[0];
        // update mouse uniform
        const pressedButton = 1.0;
        var mouse = new Float32Array([touch.clientX / canvas.width, 1 - (touch.clientY / canvas.height), pressedButton]);

        for (const shader of shaderList.program) {
            gl.useProgram(shader.program);
            gl.uniform3fv(gl.getUniformLocation(shader.program, 'uMouse'), mouse);
        }
    }
    onresize = () => {
        const shaderList = this.shaderList;
        const gl = this.gl;

        window.innerWidth = canvas.width;
        window.innerHeight = canvas.height - 65;
        canvas.width = window.innerWidth;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        for (const shader of shaderList) {
            gl.useProgram(shader.program);
            gl.uniform2fv(gl.getUniformLocation(shader.program, 'uResolution'), new Float32Array([window.innerWidth, window.innerHeight]));
        }
    }
    updateInputMatrix = (whichMatrix, row, col, val) => {
        switch (whichMatrix) {
            case 'M':
                // check if value is a number, if NaN, return
                if (val.constructor.name === 'Number') {
                    this.uModel[row * 4 + col] = val;
                    // to rotate MV matrix by 45 degrees, multiply by rotation matrix
                    this.updateGlobalUniform('uModel', this.uModel);
                    console.log('Model Matrix changed');
                    console.log(Utils.printMatrix(this.uModel, 4, 4, 2));
                    return;
                }
                break;
            case 'V':
                // check if value is a number, if NaN, return
                if (val.constructor.name === 'Number') {
                    this.uView[row * 4 + col] = val;
                    // to rotate MV matrix by 45 degrees, multiply by rotation matrix
                    this.updateGlobalUniform('uModel', this.uView);
                    console.log('View Matrix changed');
                    console.log(Utils.printMatrix(this.uView, 4, 4, 2));
                    return;
                }
                break;
            case 'P':
                if (val.constructor.name === 'Number') {
                    this.uProjection[row * 4 + col] = val;
                    this.updateGlobalUniform('uProjection', this.uProjection);
                    console.log('Pers. Matrix changed');
                    console.log(Utils.printMatrix(this.uProjection, 4, 4, 2));
                    return;
                }
                break;
            default:
                break;
        }
    }

    /**
     * List the capabilities of the WebGL context
     */
    listContextStats = () => {
        const gl = this.gl;
        // check for MSAA support

        const msaa = this.gl.getContextAttributes().antialias;
        const stats = {
            Context: [
                {
                    Renderer: gl.getParameter(gl.RENDERER),
                    Version: gl.getParameter(gl.VERSION),
                    ShadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                },
            ],
            Limitations: [
                {
                    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                    maxDrawBuffers: gl.getParameter(gl.MAX_DRAW_BUFFERS),
                    maxColorAttachments: gl.getParameter(gl.MAX_COLOR_ATTACHMENTS),
                    maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
                    maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
                    maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
                    maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
                    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
                }
            ],
        };
        console.groupCollapsed('WebGL Context Stats');
        for (const [title, list] of Object.entries(stats)) {
            console.groupCollapsed(title);
            for (const entry of list) {
                for (const [key, value] of Object.entries(entry)) {
                    console.log(key + ':', value);
                }
            }
            console.groupEnd();
        }
        console.groupCollapsed('MSAA');
        console.log('MSAA active:', msaa);
        console.groupEnd();
        console.groupEnd();
    }

    /**
     * Initialize the global uniform buffer with default values
    */
    fillGlobalUniformBuffer = () => {
        this.globalUniformData = new Float32Array(16 + 16 + 16 + 2 + 1 + 1 + 4); // 56 BYTE
        /**
         * populate buffer with data
         *  1) mat4 uProjection; == 4 * 4 == 16 elements in one chunk
         *  2) mat4 uView; == 4 * 4 == 16 elements in two chunks
         *  3) mat4 uModel; == 4 * 4 == 16 elements in two chunks
         *  4) uniform vec2 uResolution; == 2 elements in chunk
         *  5) uniform float uTime; == 1 element in chunk
         *  6) uniform bool uShowCursor; == 1 element in chunk
         *  7) uniform vec3 uMouse; == 3 elements in chunk
         *  [1][1][1][1] x 4
         *  [2][2][2][2] x 4
         *  [3][3][3][3] x 4
         *  [4][4]-[5]-[6]
         *  [7][7][7]-[Pad] 
        */

        this.uResolution = new Float32Array([this.canvas.width, this.canvas.height]);
        this.uTime = new Float32Array([0.0]);
        this.uShowCursor = new Float32Array([0.0]);
        const padding = new Float32Array([0.0]);
        this.uMouse = new Float32Array([-1.0, -2.0, 0.0, padding]);

        const chunk1 = this.uProjection;
        const chunk2 = this.uView;
        const chunk3 = this.uModel;

        this.globalUniformLocation = {
            'uProjection': 0,
            'uView': 16,
            'uModel': 32,
            'uResolution': 48,
            'uTime': 50,
            'uShowCursor': 51,
            'uMouse': 52,
        };

        this.globalUniformData.set(chunk1, 0);
        this.globalUniformData.set(chunk2, 16);
        this.globalUniformData.set(chunk3, 32);
        this.globalUniformData.set(this.uResolution, 48);
        this.globalUniformData.set(this.uTime, 50);
        this.globalUniformData.set(this.uShowCursor, 51);
        this.globalUniformData.set(this.uMouse, 52);


        console.groupCollapsed('Global Uniform Buffer, Length:', this.globalUniformData.length);
        console.log('uProjection',
            '[Positions 0-15]', '\n',
            Utils.printMatrix(this.globalUniformData.slice(0, 16), 4));
        console.log('uView',
            '[Positions 16-31]', '\n',
            Utils.printMatrix(this.globalUniformData.slice(16, 32), 4));
        console.log('uModel',
            '[Positions 32-47]', '\n',
            Utils.printMatrix(this.globalUniformData.slice(32, 48), 4));
        console.log('uResolution',
            '[Positions 48-49]\n',
            Utils.printMatrix(this.globalUniformData.slice(48, 50), 2, 1));
        console.log('uTime',
            '[Position 50]\n',
            Utils.printMatrix(this.globalUniformData.slice(50, 51), 1, 1));
        console.log('uShowCursor',
            '[Position 51]\n',
            Utils.printMatrix(this.globalUniformData.slice(51, 52), 1, 1),
        );
        console.log('uMouse',
            '[Positions 52-55]\n',
            Utils.printMatrix(this.globalUniformData.slice(52, 55), 3, 1) + '\n',
            Utils.printMatrix(this.globalUniformData.slice(55, 56), 1, 1), '(Pad)'
        );

        console.log('Buffer Layout:\n',
            Utils.printMatrix(this.globalUniformData, 4, 14));
        console.groupEnd();
    }

    /**
     * Update the global uniform buffer with new values
     * @param {string} uniform - the uniform to update
     * @param {number} value - the value to update the uniform with
     * @returns {void}
    */
    updateGlobalUniform = (uniform, value) => {
        const gl = this.gl;
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.globalUniformBuffer);
        var offset = this.globalUniformLocation[uniform];
        if (value instanceof Array || value instanceof Float32Array) {
            value = new Float32Array(value);
        } else if (typeof value === 'number') {
            value = new Float32Array([value]);
        }
        const BYTE = 4;
        this.globalUniformData.set(value, offset);
        gl.bufferSubData(gl.UNIFORM_BUFFER, offset * BYTE, value);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    }

    /**
     * Adds a shader to the glContext shaderList and associates it with the global uniform buffer
     * @param {Shader} shader - the shader to associate with the global uniform buffer
     * @returns {void}
    */
    setShaderGlobal = (shader) => {
        this.shaderList.push(shader);
        this.prepareGlobalUniforms();
    }

    /**
     * Prepares the global uniforms for each shader in the shaderList
     * @returns {void}
    */
    prepareGlobalUniforms = () => {
        const gl = this.gl;

        // set uniform block binding point for each shader
        for (const shader of this.shaderList) {
            gl.uniformBlockBinding(
                shader.program,
                gl.getUniformBlockIndex(shader.program, 'GlobalUniforms'),
                this.globalUniformBindingPoint
            );
        }

        this.globalUniformBuffer = gl.createBuffer();
        // create associated between index = 0 and uniform buffer
        gl.bindBufferBase(
            gl.UNIFORM_BUFFER,
            this.globalUniformBindingPoint,
            this.globalUniformBuffer
        );

        gl.bufferData(
            gl.UNIFORM_BUFFER,
            this.globalUniformData,
            gl.DYNAMIC_DRAW
        );
    }

    showMatrixGuides = () => {
        console.groupCollapsed('Matrix Guides');
        console.log('uProjection\n',
            Utils.printMatrix(this.uProjection, 4, 4, 2));
        console.log('uView\n',
            Utils.printMatrix(this.uView, 4, 4, 2));

        console.info('A View matrix rotated by 45 degrees about the z-axis looks like this:\n');
        const rotationMatrix = glMatrix.mat4.create();
        glMatrix.mat4.rotateZ(rotationMatrix, rotationMatrix, Math.PI / 4);
        console.log('Rotation Matrix:\n',
            Utils.printMatrix(rotationMatrix, 4, 4, 2));

        // listen to keypress 'r':
        document.addEventListener('keypress', (e) => {
            var test = glMatrix.mat4.create();
            if (e.key === 'r') {
                glMatrix.mat4.mul(this.uView, rotationMatrix, this.uView);
                this.updateGlobalUniform('uView', this.uView);
            }
            if (e.key === 'p') {
                console.log('rotated uView\n',
                    Utils.printMatrix(this.uView, 4, 4, 8));
            }
        });
        console.groupEnd();

    }
}
// rotated uModel;
//  [  0.70710677,  0.70710677,  0.00000000,  0.00000000 ]
//  [  0.70710677, -0.70710677,  0.00000000,  0.00000000 ]
//  [  0.00000000,  0.00000000, -1.00000000,  0.00000000 ]
//  [  0.00000000,  0.00000000,  0.00000000,  1.00000000 ]