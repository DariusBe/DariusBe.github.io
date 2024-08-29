export class Utils {

    static loadImage = (src) => new Promise(resolve => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.src = src;
        // resize image to 128 x 128
        img.width = 128;
        img.height = 128;

        return img;
    });

    static async loadImageConcurrently(src) {
        var img = await this.loadImage(src);
        return img;
    } 

    static getEmptyStartTexture(width=512, height=512) {
        var textureData = new Float32Array(width * height * 4);
        for (let i = 0; i < width * height; i++) {
            textureData[i * 4 + 0] = (i%15==0) ? 255 : 0;  // r
            textureData[i * 4 + 1] = 0;  // g
            textureData[i * 4 + 2] = 0;  // b
            textureData[i * 4 + 3] = 255;   // a
        }
        console.info('Generated empty start texture of size', width, 'x', height);
        // return Imagedata as RGBA16F
        return textureData
    }

    static getRandomStartTexture(width=512, height=512) {
        // Allocate a Float32Array instead of a Uint8ClampedArray.
        // This is necessary because we're using floating point values.
        var textureData = new Float32Array(width * height * 4);
    
        for (let i = 0; i < width * height; i++) {
            // Random value between 0 and 1 for each channel.
            const fill = Math.random();
            textureData[i * 4 + 0] = fill;  // r
            textureData[i * 4 + 1] = fill;  // g
            textureData[i * 4 + 2] = fill;  // b
            textureData[i * 4 + 3] = 1.0;   // a (fully opaque)
        }
    
        console.info('Generated random start texture of size', width, 'x', height);
        return textureData;
    }
    

    static readShaderFile = async (path) => {
        const response = await fetch(path);
        const shaderCode = await response.text();
        return shaderCode;
    }

    static prepareShaderProgram = async (gl, vertexShaderPath, fragmentShaderPath, TF_enabled = false, TF_varyings = [], TF_mode = gl.SEPARATE_ATTRIBS) => {
        const vertexShaderCode = await Utils.readShaderFile(vertexShaderPath);
        const fragmentShaderCode = await Utils.readShaderFile(fragmentShaderPath);

        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        vertexShader.name = vertexShaderPath.split('/').pop();
        gl.shaderSource(vertexShader, vertexShaderCode);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error('Error compiling ', vertexShader.name, gl.getShaderInfoLog(vertexShader));
            return;
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        fragmentShader.name = fragmentShaderPath.split('/').pop();
        gl.shaderSource(fragmentShader, fragmentShaderCode);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error('Error compiling ', fragmentShader.name, gl.getShaderInfoLog(fragmentShader));
            return;
        }

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);

        // before linking, set up transform feedback varyings if enabled
        if (TF_enabled) {
            gl.transformFeedbackVaryings(shaderProgram, TF_varyings, TF_mode);
        }

        gl.linkProgram(shaderProgram);

        return shaderProgram;
    }

    static canvasPoints = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        1.0, 1.0,
        -1.0, 1.0
    ]);
    static quadTextCoords = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
    ]);

    static gaussKernel(size, sigma) {
        const kernel = new Float32Array(size);
        const center = (size - 1) / 2;
        let sum = 0.0;
        for (let i = 0; i < size; i++) {
            kernel[i] = Math.exp(-Math.pow(i - center, 2) / (2 * Math.pow(sigma, 2)));
            sum += kernel[i];
        }
        for (let i = 0; i < size; i++) {
            kernel[i] /= sum;
        }
        console.info('Generated gaussian kernel of size', size, 'with sigma', sigma);
        console.debug('Kernel:', kernel);
        return kernel;
    }

    static prepareAttributes = (gl, program, attributes) => {
        const programVAO = gl.createVertexArray();
        gl.bindVertexArray(programVAO);

        gl.useProgram(program);
        // name: [location_in_shader, [size, type, normalized, stride, offset], [...]] 
        // 'aPosition': [ 0, [2, 'FLOAT', false, 0, 0], data_array]
        
        for (const [attributeName, [location, [size, type, normalized, stride, offset], bufferData]] of Object.entries(attributes)) {
            const attributeLocation = gl.getAttribLocation(program, attributeName);
            if (attributeLocation === -1) {
                console.error('Attribute', attributeName, 'not found in', program.name);
            } else if (attributeLocation !== location) {
                console.error('Attribute', attributeName, 'prepared for location', location, 'but is located at', attributeLocation);
            } else { 
                console.info(program.name, '\nAttribute', attributeName, 'found'); 
            }
            const attribBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, attribBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(attributeLocation);
            gl.vertexAttribPointer(attributeLocation, size, gl[type], normalized, stride, offset);
            console.info(
                program.name, 'bound attribute:', attributeName, '\n',
                'Location:', attributeLocation, '\n',
                'Size:', size, '\n',
                'Type:', type, '\n',
                'Normalized:', true, '\n',
                'Stride:', stride, '\n',
                'Offset:', offset, '\n',
                'Data:', bufferData
            );
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.useProgram(null);
            // gl.bindAttribLocation(program, location, attributeName);
        }
        return programVAO;
    }

    static prepareImageTextureForProgram = (gl, program, programVAO, sampler = 'uSampler', textureData, name='') => {
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

        texture.name = name;

        return texture;
    }

    static bindTextureToProgram(gl, program, programVAO, texture, sampler = 'uSampler') {
        gl.useProgram(program);
        gl.bindVertexArray(programVAO);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const samplerLocation = gl.getUniformLocation(program, sampler);
        gl.uniform1i(samplerLocation, 0);
        gl.bindVertexArray(null);
        gl.useProgram(null);
        return texture;
    }

    static prepareUniform = (gl, program, uniforms) => {
        gl.useProgram(program);

        for (const [uniformName, [value, type]] of Object.entries(uniforms)) {
            const uniformLocation = gl.getUniformLocation(program, uniformName);
            if (uniformLocation === null) {
                console.warn(program.name, ":", 'uniform', uniformName ,'not found/used');
                continue;
            } else { console.info(program.name, ":", 'uniform', uniformName ,'found'); }
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

    static prepareFramebufferObject = (gl, program, location=gl.COLOR_ATTACHMENT0, texture, width, height, textureFormat = gl.RGBA16F) => {
        gl.useProgram(program);
        const fbo = gl.createFramebuffer();
        fbo.name = texture.name + 'FBO';
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

        // create the texture to store the position data
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // params: target, mipmap-level, internalFormat, width, height
        gl.texStorage2D(gl.TEXTURE_2D, 1, [textureFormat], width, height);

        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, // target
            location, // attachment point == location of point locations in fragment shader
            gl.TEXTURE_2D, // texture target
            texture, // texture
            0); // mipmap level, always 0 in webgl

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error(program.name, ':', fbo.name, 'is incomplete');
        } else {
            console.info(program.name, ':', fbo.name, 'with texture', texture.name, 'is complete');
        }

        // unbind
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.useProgram(null);

        return fbo;
    }

    static readTextureData = (gl, texture, width, height) => {
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        const data = new Float32Array(width * height * 4);
        
        // args: target, x, y, width, height, format, type, data
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, data);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        console.debug('Read texture data:', data);
        return data;
    }
}