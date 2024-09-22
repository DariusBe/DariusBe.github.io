import { Utils } from './Utils.js';

export class Shader{
    gl;
    name;
    textureList = [];
    buffferList = [];
    program;
    vao;
    tfBufferSize=0;
    tfBuffer;
    
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

    prepareUniform = (uniforms) => {
        const gl = this.gl;
        const program = this.program;
        
        gl.useProgram(program);

        for (const [uniformName, [value, type]] of Object.entries(uniforms)) {
            const uniformLocation = gl.getUniformLocation(program, uniformName);
            if (uniformLocation === null) {
                console.warn(this.name, ":", 'uniform', uniformName ,'not found/used');
                continue;
            } else { console.info(this.name, ":", 'uniform', uniformName ,'found'); }
            if (type === '1f') {
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
    }

    prepareAttributes = (attributes) => {
        const gl = this.gl;
        const program = this.program;
        const programVAO = gl.createVertexArray();
        gl.bindVertexArray(programVAO);

        gl.useProgram(program);
        // name: [location_in_shader, [size, type, normalized, stride, offset], [...]] 
        // 'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], data_array]
        
        for (const [attributeName, [location, [size, type, normalized, stride, offset], bufferData]] of Object.entries(attributes)) {
            const attributeLocation = gl.getAttribLocation(program, attributeName);
            if (attributeLocation === -1) {
                console.error('Attribute', attributeName, 'not found in', this.name);
            } else if (attributeLocation !== location) {
                console.error('Attribute', attributeName, 'prepared for location', location, 'but is located at', attributeLocation);
            } else { 
                console.info(this.name, '\nAttribute', attributeName, 'found'); 
            }
            const attribBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, attribBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.DYNAMIC_DRAW);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, bufferData);
            gl.enableVertexAttribArray(attributeLocation);
            gl.vertexAttribPointer(attributeLocation, size, gl[type], normalized, stride, offset);
            console.info(
                'program', this.name, 'bound the attribute:', attributeName, '\n',
                'Location:', attributeLocation, '\n',
                'Size:', size, '\n',
                'Type:', type, '\n',
                'Normalized:', true, '\n',
                'Stride:', stride, '\n',
                'Offset:', offset, '\n',
                'Data:', bufferData
            );
            this.buffferList.push(attribBuffer);
        }
        return programVAO;
    }

    prepareImageTextureForProgram = (sampler = 'uSampler', textureData, texName='') => {
        const gl = this.gl;
        const program = this.program;
        program.name = this.name;
        programVAO = this.vao;

        gl.useProgram(program);
        gl.bindVertexArray(programVAO);
    
        // flip image vertically
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        const texture = gl.createTexture();
        // gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // args: target, mipmap-level, internalFormat, format, type, data_source
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, window.innerWidth, window.innerHeight, 0, gl.RGBA, gl.FLOAT, textureData);        // mipmapping
        // gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        // set to repeat
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);


        // bind texture to sampler
        const samplerLocation = gl.getUniformLocation(program, sampler);
        gl.uniform1i(samplerLocation, 0);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindVertexArray(null);
        gl.useProgram(null);

        texture.name = texName;
        this.textureList.push(texture);

        return texture;
    }

    prepareBuffer = (bufferData, bufferName) => {
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
        this.buffferList.push(buffer);

        return buffer;
    }

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

    fetchBufferData(buffer, bufferSize) {
        const view = new Float32Array(bufferSize);
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.getBufferSubData(gl.ARRAY_BUFFER, 0, view);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return view;
    }

    printShaderDetails() {
        const gl = this.gl;
        const program = this.program;
        const vao = this.vao;
        console.info(
            'Shader:', this.name, 
            '\nProgram:', program, 
            '\nVAO:', vao, 
            '\nTextures:', this.textureList,
            '\nBuffers:', this.buffferList
        );
    }
}