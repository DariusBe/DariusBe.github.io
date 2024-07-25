export class Utils {

    static loadImage = (src) => new Promise(resolve => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.src = src;
    });

    static getPixelMap() {
        return new Uint8Array([
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
                continue;
            } else { console.info(program.name, '\nAttribute', attributeName, 'found in'); }
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
                'Normalized:', normalized, '\n',
                'Stride:', stride, '\n',
                'Offset:', offset, '\n',
                'Data:', bufferData
            );
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            // gl.bindAttribLocation(program, location, attributeName);
        }
        return programVAO;
    }

    static prepareUniform = (gl, program, uniforms) => {
        gl.useProgram(program);

        for (const [uniformName, [value, type]] of Object.entries(uniforms)) {
            const uniformLocation = gl.getUniformLocation(program, uniformName);
            if (uniformLocation === null) {
                console.warn(program.name, '\nuniform', uniformName,'not found or used');
                continue;
            } else { console.info(program.name, ":", 'uniform', uniformName ,'found'); }
            if (type === '1f') {
                gl.uniform1f(uniformLocation, value);
            } else if (type === '2fv') {
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
}