import { Utils } from './Utils.js';

export class Shader {
    gl;
    name;
    program;
    vao;
    textureList = [];
    bufferList = [];
    fbo = [];
    tfBufferSize=0;
    tfBuffer;
    attributeList = {};
    uniformList = {};
    /**
     * Creates a new Shader object.
     * @param {WebGL2RenderingContext} gl The WebGL2 rendering context
     * @param {string} name The name of the shader program
     * @param {string} vertexShaderCode The vertex shader code
     * @param {string} fragmentShaderCode The fragment shader code
     * @param {Object} attributes An object containing the attributes as { attributeName: [location, [size, type, normalized, stride, offset], bufferData] }
     * @param {Object} uniforms An object containing the uniforms as { uniformName: [type, value] }
     * @param {Object} tf_description An object containing the transform feedback description as { TF_varyings=['vPoints'], TF_mode=gl.SEPARATE_ATTRIBS, TF_bufferSize=BUFFSIZE }
    */
    constructor(gl, name='', vertexShaderCode, fragmentShaderCode, attributes, uniforms, tf_description=null) {
        this.gl = gl;
        this.name = name;
        this.program = this.prepareShaderProgram(
            gl, 
            vertexShaderCode, 
            fragmentShaderCode, 
            tf_description !== null ? tf_description : null
        );

        this.prepareUniform(uniforms);
        this.vao = this.prepareAttributes(attributes);
        if (tf_description !== null) {
            // seperate tf_description into args { TF_varyings: ['vPoints'], TF_mode: gl.SEPARATE_ATTRIBS, TF_buffer: TF_BUFF_1, TF_bufferSize: BUFFSIZE }
            const buffer = tf_description.TF_buffer;
            const bufferSize = tf_description.TF_bufferSize;
            this.prepareTransformFeedback(buffer, bufferSize);
        }
    }

    /**
    * Creates a shader program from vertex and fragment shader code
     * @param {WebGL2RenderingContext} gl The WebGL2 rendering context
     * @param {String} vertexShaderCode A string containing the vertex shader code
     * @param {String} fragmentShaderCode A string containing the fragment shader code
     * @param {Object} tf_description An object containing the transform feedback description as { TF_varyings=['vPoints'], TF_mode=gl.SEPARATE_ATTRIBS, TF_bufferSize=BUFFSIZE }
     * @returns {WebGLProgram} A WebGLProgram object
     * @throws {Error} If the shader program cannot be created
     */
    prepareShaderProgram(gl, vertexShaderCode, fragmentShaderCode, tf_description) {
        this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
        this.vertexShader.name = this.name+'VertShader';
        gl.shaderSource(this.vertexShader, vertexShaderCode);
        gl.compileShader(this.vertexShader);
        if (!gl.getShaderParameter(this.vertexShader, gl.COMPILE_STATUS)) {
            console.error('Error compiling ', this.vertexShader.name, gl.getShaderInfoLog(this.vertexShader));
            return;
        }

        this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        this.fragmentShader.name = this.name+'FragShader';
        gl.shaderSource(this.fragmentShader, fragmentShaderCode);
        gl.compileShader(this.fragmentShader);
        if (!gl.getShaderParameter(this.fragmentShader, gl.COMPILE_STATUS)) {
            console.error('Error compiling ', this.fragmentShader.name, gl.getShaderInfoLog(this.fragmentShader));
            return;
        }

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, this.vertexShader);
        gl.attachShader(shaderProgram, this.fragmentShader);

        // before linking, set up transform feedback varyings if enabled
        if (tf_description !== null) {
            const { TF_varyings, TF_mode, tf_bufferSize } = tf_description;
            this.tfBufferSize = tf_bufferSize;
            console.info('Transform feedback enabled with varyings:', TF_varyings, ', buffer size:', tf_bufferSize);
            gl.transformFeedbackVaryings(shaderProgram, TF_varyings, TF_mode);
        }

        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error('Error linking program', gl.getProgramInfoLog(shaderProgram));
            return;
        }

        return shaderProgram;
    }

    /**
     * Prepares the uniforms for the shader program
     * @param {Object} uniforms An object containing the uniforms as { uniformName: [type, value] }
     * @returns {void}
    */
    prepareUniform = (uniforms) => {
        const gl = this.gl;
        const program = this.program;
        
        gl.useProgram(program);

        var usedUniforms = [];
        var unusedUniforms = [];

        for (var [uniformName, [type, value]] of Object.entries(uniforms)) {
            const uniformLocation = gl.getUniformLocation(program, uniformName);
            if (uniformLocation === null) {
                unusedUniforms.push([uniformName, [type, value]]);
                continue;
            } else { usedUniforms.push([uniformName, [type, value]]) }
            if (type === 'bool') {
                gl.uniform1i(uniformLocation, value);
            } else if (type === '1f') {
                gl.uniform1f(uniformLocation, value);
            } else if (type === '1fv') {
                gl.uniform1fv(uniformLocation, value);
            }  else if (type === '2fv') {
                gl.uniform2fv(uniformLocation, value);
            } else if (type === '3fv') {
                gl.uniform3fv(uniformLocation, value);
            } else if (type === '4fv') {
                gl.uniform4fv(uniformLocation, value);
            } else if (type === '1i') {
                gl.uniform1i(uniformLocation, value);
            } else if (type === '1iv') {
                gl.uniform1iv(uniformLocation, value);
            } else if (type === '2iv') {
                gl.uniform2iv(uniformLocation, value);
            } else if (type === '3iv') {
                gl.uniform3iv(uniformLocation, value);
            } else if (type === '4iv') {
                gl.uniform4iv(uniformLocation, value);
            } else {
                console.error('Unknown uniform type:', type);
            }
            this.uniformList[type] = uniformName;
        }
        console.info(
            'Prepared uniforms for', this.name, '\n',
            'USED:', ...usedUniforms
            .reduce((acc, used) => { 
                acc.push('\n  •', used[0].concat(':'), used[1][0].concat(','), used[1][1].constructor.name == ('Float32Array' || 'Array') ? used[1][1].slice(0, 2).map(num => parseFloat(Number(num).toFixed(2))) + ', ...' : used[1][1]); 
                return acc; }, []
            ),'\n',
            'UNUSED:', ...unusedUniforms
            .reduce((acc, unused) => { 
                acc.push('\n  •', unused[0].concat(':'), unused[1][0].concat(','), unused[1][1].constructor.name === ('Float32Array' || 'Array') ? unused[1][1].slice(0, 2) + ', ...' : unused[1][1]); 
                return acc; 
            }, [])
        );
    }

    /**
     * Prepares the attributes for the shader program
     * @param {Object} attributes An object containing the attributes as { attributeName: [location, [size, type, normalized, stride, offset], bufferData] }
     * @returns {WebGLVertexArrayObject} A WebGLVertexArrayObject
     */
    prepareAttributes = (attributes) => {
        const gl = this.gl;
        const program = this.program;
        const programVAO = gl.createVertexArray();
        programVAO.name = this.name + '_VAO';
        gl.bindVertexArray(programVAO);

        gl.useProgram(program);
        // name: [location_in_shader, [size, type, normalized, stride, offset], [...]] 
        // 'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], data_array]

        var foundAttributes = [[]];
        var notFoundAttributes = [[]];
        
        for (const [attributeName, [location, [size, type, normalized, stride, offset], bufferData]] of Object.entries(attributes)) {
            const attributeLocation = gl.getAttribLocation(program, attributeName);
            if (attributeLocation === -1) {
                // console.error('Attribute', attributeName, 'not found in', this.name);
                notFoundAttributes.push([attributeName, [location, [size, type, normalized, stride, offset], bufferData]]);
            } else if (attributeLocation !== location) {
                console.error('Attribute', attributeName, 'prepared for location', location, 'but is located at', attributeLocation);
            } else { 
                // console.info(this.name, '\nAttribute', attributeName, 'found'); 
                foundAttributes.push([attributeName, [location, [size, type, normalized, stride, offset], bufferData]]);
            }
            const attribBuffer = gl.createBuffer();
            attribBuffer.name = attributeName + '_Buffer';
            gl.bindBuffer(gl.ARRAY_BUFFER, attribBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.DYNAMIC_DRAW);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, bufferData);
            gl.enableVertexAttribArray(attributeLocation);
            gl.vertexAttribPointer(attributeLocation, size, gl[type], normalized, stride, offset);
            this.bufferList.push(attribBuffer);
            this.attributeList[attributeLocation] = attributeName;
        }

        console.info(
            'Prepared attributes for', this.name, '\n',
            'FOUND:', ...foundAttributes
            .reduce((acc, found) => {
                acc.push('\n  •', found[0], 
                    '\n\tLocation:', found[1][0],
                    '\n\tSize:', found[1][1][0],
                    '\n\tType:', found[1][1][1],
                    '\n\tNormalized:', found[1][1][2],
                    '\n\tStride:', found[1][1][3],
                    '\n\tOffset:', found[1][1][4],
                    '\n\tData:', found[1][2].slice(0, 3) + ', ...'
                );
                return acc; 
            }
            ),
            notFoundAttributes.length>1 ? '\n NOT FOUND:' : ' ', ...notFoundAttributes
            .reduce((acc, notFound) => {
                acc.push('\n  •', notFound[0], 
                '\n\tLocation:', notFound[1][0],
                '\n\tSize:', notFound[1][1][0],
                '\n\tType:', notFound[1][1][1],
                '\n\tNormalized:', notFound[1][1][2],
                '\n\tStride:', notFound[1][1][3],
                '\n\tOffset:', notFound[1][1][4],
                '\n\tData:', notFound[1][2].slice(0, 3) + ', ...'
                );
                return acc;
            })
        );

        return programVAO;
    }

    /**
     * Creates a texture object and binds it to the shader program
     * @param {string} sampler name of the sampler in the shader program
     * @param {Float32Array} textureData an array buffer
     * @param {string} texName name of the texture
     * @param {number} width width of the texture
     * @param {number} height height of the texture
     * @param {boolean} silent if true, no console output is generated
     * @returns {WebGLTexture} texture object
    */
    prepareImageTexture = (sampler = 'uSampler', textureData, texName='', width=0, height=0, silent=true) => {
        const gl = this.gl;
        const program = this.program;
        program.name = this.name;
        const programVAO = this.vao;

        gl.useProgram(program);
        gl.bindVertexArray(programVAO);
    
        // flip image vertically
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        var texWidth = 0;
        var texHeight = 0;
        if (width >= 0 && height >= 0) {
            texWidth = width;
            texHeight = height;
        } else {
            texWidth = window.innerWidth;
            texHeight = window.innerHeight;
        }

        // args: target, mipmap level, internal format, width, height, border, format, type, data
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, texWidth, texHeight, 0, gl.RGBA, gl.FLOAT, textureData);        // mipmapping
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        // set to non-repeat
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


        // bind texture to sampler
        const samplerLocation = gl.getUniformLocation(program, sampler);
        gl.uniform1i(samplerLocation, 0);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindVertexArray(null);
        gl.useProgram(null);

        texture.name = texName;
        if (texName === '') {
            texture.name = this.name + '_Texture';
        }
        this.textureList.push(texture);

        if (!silent) {
            console.info('Prepared texture:', texture.name, 'with size:', texWidth, texHeight);
        }

        return texture;
    }

    /**
     * Creates a buffer object and binds it to the shader program
     * @param {Float32Array} bufferData an array buffer
     * @param {string?} bufferName if provided, the buffer is named
     * @param {boolean} silent if true, no console output is generated
     * @returns {WebGLBuffer} buffer object
     */
    prepareBuffer = (bufferData, bufferName='', silent=true) => {
        const gl = this.gl;
        const program = this.program;
        const programVAO = this.vao;

        gl.useProgram(program);
        gl.bindVertexArray(programVAO);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
        gl.useProgram(null);

        buffer.name = bufferName;
        this.bufferList.push(buffer);

        if (!silent) {
            console.info('Prepared buffer:', buffer.name, 'with size:', bufferData.length);
        }

        return buffer;
    }

    /**
     * Creates a framebuffer object (FBO) with a texture attached to it.
     * @param {number?} location color attachment position matching the output location in fragment shader (default: gl.COLOR_ATTACHMENT0)
     * @param {WebGLTexture} texture   A WebGLTexture
     * @param {number} width     Width of texture
     * @param {number} height    Height of texture
     * @param {number} textureFormat represents the internal format of the texture (default: gl.RGBA16F)
     * @param {boolean} withRenderBuffer if true, a render buffer is created and attached to the FBO
     * @param {boolean} silent    If true, no console output is generated, if resulting FBO is complete
     * @returns {WebGLFramebuffer?} if successful: a complete framebuffer object, else null
     */
    prepareFramebufferObject = (location=gl.COLOR_ATTACHMENT0, texture, width, height, textureFormat=gl.RGBA16F, withRenderBuffer=false, silent=true) => {
        const gl = this.gl;

        const program = this.program;
        gl.useProgram(program);

        if (texture.constructor.name !== 'WebGLTexture') {
            console.error('prepareFramebufferObject(): passed texture', texture.name, 'is not of type WebGLTexture');
            return;
        }

        const fbo = gl.createFramebuffer();
        fbo.name = texture.name + 'FBO';
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

        gl.activeTexture(gl.TEXTURE0+this.fbo.length);
        // create the texture to store the position data
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // params: target, mipmap-level, internalFormat, width, height
        gl.texStorage2D(gl.TEXTURE_2D, 1, [textureFormat], width, height);

        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, // target
            location, // attachment point == location of point locations in fragment shader
            gl.TEXTURE_2D,  // texture target
            texture,        // texture
            0               // mipmap level, always 0 in webgl
        ); 

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error(program.name, ':', fbo.name, 'is incomplete');
        } else if (!silent) {
            console.info(program.name, ':', fbo.name, 'with texture', texture.name, 'is complete');
        }

        if (withRenderBuffer) {
            const renderBuffer = gl.createRenderbuffer();
            renderBuffer.name = texture.name + 'RenderBuffer';
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);
            //this.bufferList.push(renderBuffer);
        }

        // unbind
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.useProgram(null);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error(program.name, ':', fbo.name, 'is incomplete');
            return null;
        } else {
            this.fbo.push(fbo);
            return fbo;
        }
    }

    /**
     * Creates a transform feedback buffer object and binds it to the shader program.
     * @param {WebGLBuffer} buffer a buffer object
     * @param {number} bufferSize size of the buffer
     * @returns {WebGLBuffer} buffer object
    */
    prepareTransformFeedback(buffer, bufferSize) {
        // set to use program and get attached program name
        const gl = this.gl;
        const program = this.program;
        const vao = this.vao;
        
        gl.useProgram(program);
        this.tfBuffer = buffer;
        this.tfBufferSize = bufferSize;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.tfBufferSize, this.gl.DYNAMIC_DRAW);
        console.info('Transform feedback buffer created with size:', bufferSize);
        // this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 3*4, 0);

        this.gl.enableVertexAttribArray(0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindVertexArray(null);

        return this.tfBuffer;
    }

    /**
     * Updates the value of a uniform variable in the shader program.
     * @param {string} uniformName name of the uniform variable
     * @param {string} type type of the uniform variable
     * @param {any} value value of the uniform variable
     * @returns {void}
    */
    updateUniform = (uniformName, type, value) => {
        const gl = this.gl;
        const program = this.program;
        gl.useProgram(program);

        const uniformLocation = gl.getUniformLocation(program, uniformName);
        if (uniformLocation === null) {
            console.warn(this.name, ":", 'attempt to update uniform', uniformName ,'failed - not found/used');
            return;
        }

        if (type === 'bool') {
            gl.uniform1i(uniformLocation, value);
        } else if (type === '1f') {
            gl.uniform1f(uniformLocation, value);
        } else if (type === '1fv') {
            gl.uniform1fv(uniformLocation, value);
        }  else if (type === '2fv') {
            gl.uniform2fv(uniformLocation, value);
        } else if (type === '3fv') {
            gl.uniform3fv(uniformLocation, value);
        } else if (type === '4fv') {
            gl.uniform4fv(uniformLocation, value);
        } else if (type === '1i') {
            gl.uniform1i(uniformLocation, value);
        } else if (type === '1iv') {
            gl.uniform1iv(uniformLocation, value);
        } else if (type === '2iv') {
            gl.uniform2iv(uniformLocation, value);
        } else if (type === '3iv') {
            gl.uniform3iv(uniformLocation, value);
        } else if (type === '4iv') {
            gl.uniform4iv(uniformLocation, value);
        } else {
            console.error('Unknown uniform type:', type);
        }
    }  


    /**
     * Fetches the data from a buffer object and returns it as a Float32Array.
     * 
     * Handy when debugging Transform Feedback operations.
     * Only use this for debugging purposes, as it is a blocking operation and can slow down the rendering process.
     * @param {WebGLBuffer} buffer a buffer object
     * @param {number} bufferSize size of the buffer
     * @returns {Float32Array} buffer data
     */
    fetchBufferData(buffer, bufferSize) {
        const view = new Float32Array(bufferSize);
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.getBufferSubData(gl.ARRAY_BUFFER, 0, view);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return view;
    }

    /**
     * Logs the details of the shader program, including VAO, FBOs, textures, buffers, attributes, and uniforms.
    */
    getShaderDetails(verbose=false) {
        const gl = this.gl;
        const program = this.program;
        const vao = this.vao;

        const listToArray = (list) => {
            const arr = [];
            for (const [key, value] of Object.entries(list)) {
                arr.push('\n •');
                arr.push(key);
                arr.push('-');
                arr.push(value);
            }
            return arr;
        }

        console.info(
            'SHADER DETAILS:',
            '\nname:', this.name, 
            '\nvao:', vao.name, 
            '\nfbos:', ...this.fbo.reduce((acc, fbo) => { acc.push('\n •',fbo.name); return acc; }, []),
            '\ntextures:', ...this.textureList.reduce((acc, tex) => { acc.push('\n •',tex.name); return acc; }, []),
            '\nbuffers:', ...this.bufferList.reduce((acc, buff) => { acc.push('\n •',buff.name); return acc; }, []),
            '\nattribs:', '(', gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES), 'active )',
            ...listToArray(this.attributeList),
            '\nuniforms:', '(', gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS), 'active )',
            ...listToArray(this.uniformList)
        );
    }

    /**
     * A function to log the values of a WebGLTexture to the console
     * @param {WebGL2RenderingContext} gl The WebGL2 rendering context
     * @param {WebGLTexture} texture The WebGLTexture to read from
     * @param {number} width The width of the texture
     * @param {number} height The height of the texture
     * @param {boolean} logAllValues A flag to log all values to the console
     */
    readTextureData = (texture, width, height, logAllValues = false) => {
        const gl = this.gl;

        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        const data = new Float32Array(width * height * 4);
        // args: target, x, y, width, height, format, type, data
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, data);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        if (logAllValues) {
            console.debug('Read texture data:', data);
        }
        console.debug(' Fill:\t\t', data[0], '\n',
            'Heading:\t', data[1], '\n',
            'Acc.:\t\t', data[2], '\n',
            'Age:\t\t', data[3]);
    }
}