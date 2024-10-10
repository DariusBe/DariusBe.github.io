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

    static getEmptyStartTexture(width = 512, height = 512) {
        var textureData = new Float32Array(width * height * 4);
        for (let i = 0; i < width * height; i++) {
            textureData[i * 4 + 0] = (i % 15 == 0) ? 255 : 0;  // r
            textureData[i * 4 + 1] = 0;     // g
            textureData[i * 4 + 2] = 0;     // b
            textureData[i * 4 + 3] = 255;   // a
        }
        console.info('Generated empty start texture of size', width, 'x', height);
        // return Imagedata as RGBA16F
        return textureData
    }

    static getRandomStartTexture(width = 512, height = 512) {
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

    static randomCoords = (count) => {
        const coors = new Float32Array(count * 2);
        for (let i = 0; i < count; i++) {
            coors[i * 2] = Math.random() * 2 - 1;
            coors[i * 2 + 1] = Math.random() * 2 - 1;
        }
        return coors;
    }

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
        console.info('Generated Gaussian kernel of size', size, 'with sigma', sigma, ':', kernel);
        return kernel;
    }

    static boxKernel(size) {
        const kernel = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            kernel[i] = 1.0;
        }
        console.info('Generated box kernel of size', size, ':', kernel);
        return kernel;
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
                console.warn(program.name, ":", 'uniform', uniformName, 'not found/used');
                continue;
            } else { console.info(program.name, ":", 'uniform', uniformName, 'found'); }
            if (type === '1f') {
                gl.uniform1f(uniformLocation, value);
            } else if (type === '1fv') {
                gl.uniform1fv(uniformLocation, value);
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

    static prepareFramebufferObject = (gl, program, location = gl.COLOR_ATTACHMENT0, texture, width, height, textureFormat = gl.RGBA16F) => {
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

    static readTextureData = (gl, texture, width, height, logAllValues = false) => {
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

    /**
      * Read a text file from the server and parse it into a Float32Array.
      * @param {string} path - The path to the XYZ file
      * @returns {Promise<Float32Array>} - The parsed XYZ data with the last element being the number of rows
      */
    static readXYZMapToTexture = (path, rows = null) => new Promise(resolve => {
        // measure time until promise is resolved

        var map = fetch(path)
            .then(response => response.text())
            .then(text => {
                var max_x = 0;
                var max_y = 0;
                var max_z = 0;

                var min_x = 1;
                var min_y = 1;
                var min_z = 1;

                var lines = text.split('\n');
                var data = new Float32Array((1 + lines.length * 4));
                var empty_lines = 0;
                for (let i = 0; i < lines.length; i++) {
                    // split by comma, space or semicolon
                    var values = lines[i].split(',');
                    if (values.length < 3) {
                        values = lines[i].split(' ');
                    }
                    if (values.length < 3) {
                        values = lines[i].split(';');
                    }
                    // skip if line is empty
                    if (values.length == 3) {
                        data[i * 4 + 0] = parseFloat(values[0]);
                        data[i * 4 + 1] = parseFloat(values[1]);
                        data[i * 4 + 2] = parseFloat(values[2]);

                        // max
                        if (parseFloat(values[0]) > max_x) {
                            max_x = parseFloat(values[0]);
                        }
                        if (parseFloat(values[1]) > max_y) {
                            max_y = parseFloat(values[1]);
                        }
                        if (parseFloat(values[2]) > max_z) {
                            max_z = parseFloat(values[2]);
                        }
                        // min
                        if (parseFloat(values[0]) < min_x) {
                            min_x = parseFloat(values[0]);
                        }
                        if (parseFloat(values[1]) < min_y) {
                            min_y = parseFloat(values[1]);
                        }
                        if (parseFloat(values[2]) < min_z) {
                            min_z = parseFloat(values[2]);
                        }
                        data[i * 4 + 3] = 1.0;
                    } else {
                        empty_lines += 1;
                    }
                }
                // remove trailing empty lines
                lines = lines.slice(0, lines.length - empty_lines);
                map = data.slice(0, 1 + lines.length * 4);
                // normalize all values: lowest mapped to 0, highest to 1
                for (let i = 0; i < lines.length; i++) {
                    map[i * 4 + 0] = (map[i * 4 + 0] - min_x) / (max_x - min_x);
                    map[i * 4 + 1] = (map[i * 4 + 1] - min_y) / (max_y - min_y);
                    map[i * 4 + 2] = (map[i * 4 + 2] - min_z) / (max_z - min_z);
                }

                if (rows != null) {
                    // set last to sqrt of rows
                    map[lines.length * 4] = rows;
                } else {
                    // set last to sqrt of lines
                    map[lines.length * 4] = Math.sqrt(lines.length);
                }
                resolve(map);
            });
        return (map);
    });

    static normalizePointCloud = (pointCloud) => {
        // min should be 0, max should be 1
        var max_x = 0;
        var max_y = 0;
        var max_z = 0;
        var min_x = 1;
        var min_y = 1;
        var min_z = 1;

        for (let i = 0; i < pointCloud.length; i += 4) {
            // max
            if (pointCloud[i] > max_x) {
                max_x = pointCloud[i];
            }
            if (pointCloud[i + 1] > max_y) {
                max_y = pointCloud[i + 1];
            }
            if (pointCloud[i + 2] > max_z) {
                max_z = pointCloud[i + 2];
            }
            // min
            if (pointCloud[i] < min_x) {
                min_x = pointCloud[i];
            }
            if (pointCloud[i + 1] < min_y) {
                min_y = pointCloud[i + 1];
            }
            if (pointCloud[i + 2] < min_z) {
                min_z = pointCloud[i + 2];
            }
        }
        // normalize all values
        for (let i = 0; i < pointCloud.length; i += 4) {
            pointCloud[i] = (pointCloud[i] - min_x) / (max_x - min_x);
            pointCloud[i + 1] = (pointCloud[i + 1] - min_y) / (max_y - min_y);
            pointCloud[i + 2] = (pointCloud[i + 2] - min_z) / (max_z - min_z);
        }
        return pointCloud;
    }

    static saveArrayToImageFile = (data, filename, width, height) => {
        // save XYZ data array as png with (RGB)
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        var imgData = ctx.createImageData(width, height);
        for (let i = 0; i < data.length; i += 4) {
            imgData.data[i] = data[i] * 255;
            imgData.data[i + 1] = data[i + 1] * 255;
            imgData.data[i + 2] = data[i + 2] * 255;
            imgData.data[i + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
        var a = document.createElement('a');
        a.href = canvas.toDataURL();
        a.download = filename;
        a.click();

    }
}