export class GLContext {
    gl;
    shaderList = [];
    sliderVal = 0.6;
    constructor(context='webgl-canvas') {
        this.canvas = document.getElementById(context);
        if (!this.canvas) {
            throw new Error('No canvas found with id: ' + context);
        }
        this.gl = canvas.getContext('webgl2');
        if (!this.gl) {
            throw new Error('WebGL2 not supported');
        }
        this.gl.getExtension('EXT_color_buffer_float');
        this.gl.hint(this.gl.FRAGMENT_SHADER_DERIVATIVE_HINT, this.gl.NICEST);
        this.canvas.addEventListener('touchmove', this.touchmove);
        this.canvas.addEventListener('mousemove', this.onmousemove);
        window.addEventListener('resize', this.onresize);
    }

    /* EVENT HANDLERS*/
    onmousemove = (e) => {
        const shaderList = this.shaderList;
        const gl = this.gl;

        const pressedButton = e.buttons === 1 ? 1.0 : 0.0;
        const mouse = new Float32Array([e.clientX / canvas.width, 1-(e.clientY / canvas.height), pressedButton]);
        
        for (const shader of shaderList) {
            gl.useProgram(shader.program);
            gl.uniform3fv(gl.getUniformLocation(shader.program, 'uMouse'), mouse);
        }
    };
    touchmove = (e) => {
        const shaderList = this.shaderList;
        const gl = this.gl;

        e.preventDefault(); // prevent scrolling
        var touch = e.touches[0];
        // update mouse uniform
        const pressedButton = 1.0;
        var mouse = new Float32Array([touch.clientX / canvas.width, 1-(touch.clientY / canvas.height), pressedButton]);
        
        for (const shader of shaderList.program) {
            gl.useProgram(shader.program);
            gl.uniform3fv(gl.getUniformLocation(shader.program, 'uMouse'), mouse);
        }
    }
    onresize = () => {
        const shaderList = this.shaderList;
        const gl = this.gl;

        window.innerWidth = canvas.width;
        window.innerHeight = canvas.height-70;
        canvas.width = window.innerWidth;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        for (const shader of shaderList) {
            gl.useProgram(shader.program);
            gl.uniform2fv(gl.getUniformLocation(shader.program, 'uResolution'), new Float32Array([window.innerWidth, window.innerHeight]));
        }
    }

    /**
     * List the capabilities of the WebGL context
     */
    listContextCapabilities = () => {
        const gl = this.gl;

        const debugInfo = gl.getParameter(gl.RENDERER);//.getExtension('WEBGL_debug_renderer_info');
        const stats = {
            version: gl.getParameter(gl.VERSION),
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
            maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
            maxDrawBuffers: gl.getParameter(gl.MAX_DRAW_BUFFERS),
            maxColorAttachments: gl.getParameter(gl.MAX_COLOR_ATTACHMENTS),
            maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
            maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
            maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
            maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
            maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
            maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
            maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
            maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
            maxVertexUniformComponents: gl.getParameter(gl.MAX_VERTEX_UNIFORM_COMPONENTS),
            maxFragmentUniformComponents: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_COMPONENTS),
            maxElementIndices: gl.getParameter(gl.MAX_ELEMENTS_INDICES),
            maxElementVertices: gl.getParameter(gl.MAX_ELEMENTS_VERTICES),
        };
        console.log(debugInfo, stats);
    }
}