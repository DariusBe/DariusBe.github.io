import { ModelOBJ } from "./ModelOBJ.js";

export class Utils {

    /** 
     * Parse the .mtl-file of a wavefront model
     * @param {string} src The path to the .mtl-file
     * @param {boolean?} verbose A flag to print info
     * @returns {list} a list of layout // @TODO add description
     * 
    */
    static parseMTL = async (src, verbose = true) => {
        const then = performance.now();
        const response = await fetch(src);
        var content = await response.text();
        content = content.split('\n');
        content = content.filter(x => !(x.startsWith('#') || x == ('')));
        var list = {};
        var sublist = {};
        var currentSection = '';
        for (const i in content) {
            const elem = content[i];
            if (elem.startsWith('newmtl')) {
                const section = elem;
                currentSection = section.split(' ')[1];
                list[section.split(' ')[1]] = '';
                sublist = {};
            } else {
                sublist[elem.split(' ')[0]] = elem.split(' ').slice(1);
                list[currentSection] = sublist;
            }
        }
        console.log('Parsed MTL-File', '"' + src + '"', 'in', performance.now() - then, 'ms.');
        return list;
    }

    /** 
     * Parse the .mtl-file of a wavefront model
     * @param {string} src The path to the .mtl-file
     * @param {boolean?} verbose A flag to print info
     * @param {string?} mtl_src Optionally, the path to an .mtl-file
     * @returns {ModelOBJ} a ModelOBJ object containing geometry lists
    */
    static parseOBJFile = async (src, verbose = true, mtl_src = '') => {
        const then = performance.now();
        const response = await fetch(src);
        const content = await response.text();
        // console.log(content);
        const objectName = content.split('o')[2].split('v')[0].trimEnd();
        var lines = content.split('\n');

        var obj = new ModelOBJ();

        for (var i = 0; i < lines.length; i++) {
            const key = lines[i].split(' ')[0];
            const value = lines[i].split(key + ' ')[1];
            // check file integrity:
            const check = lines[i].split(key + ' ').length;
            if ((check > 2 || check < 2) && lines[i] != '') {
                console.warn('OBJ Parsing Error:\nFormat qualifier (o, v, vt, ...) must be separeted by space:\n', lines[i]);
            }
            switch (key) {
                case '#': break;
                default: break;
                case 'o':
                    // objName = value;
                    // objDescription['object_name'].push(value);
                    console.log(value);
                    obj.objectNames.push(value.trim());
                    break;
                case 'v':
                    // vertices.push(value);
                    // objDescription['vertices'].push(value);
                    obj.vertices.push(
                        value.trim().split(' ').map((c) => parseFloat(c))
                    );
                    break;
                case 'vt':
                    // texCoords.push(value);
                    // objDescription['tex_coords'].push(value);
                    obj.texCoords.push(
                        value.trim().split(' ').map((c) => parseFloat(c))
                    );
                    break;
                case 'vn':
                    // vertexNormals.push(value);
                    // objDescription['vertex_normals'].push(value);
                    obj.vertexNormals.push(
                        value.trim().split(' ').map((c) => parseFloat(c))
                    );
                    break;
                case 'f':
                    // faces.push(value);
                    // objDescription['faces'].push(value);
                    obj.faces.push(
                        value.trim().split(' ').map(tuple => tuple.trim().split('/').map(n => parseFloat(n)))
                    );
                    break;
                case 'l':
                    // lineElements.push(value);
                    // objDescription['line_elements'].push(value);
                    obj.lineElements.push(
                        value.trim().split(' ').map((c) => parseFloat(c))
                    );
                    break;
                case 'vp':
                    // parameterSpaceVertices.push(value);
                    // objDescription['parameter_space_vertices'].push(value);
                    obj.parameterSpaceVertices.push(
                        value.trim().split(' ')
                    );
                    break;
                case 's':
                    // objDescription['smooth_shading'].push(smoothShading);
                    obj.smoothShading = value.trim();
                    break;
            }
        }

        mtl_src;
        if (mtl_src != '') {
            if (verbose) {
                this.parseMTL(mtl_src, verbose);
            }
        }

        // if (!facesListEmpty) {
        for (const face in Object.entries(obj.faces)) {
            // f v_1/X/X     v_2/X/X     v_3/X/X
            const v1_location = obj.faces[face][0][0] - 1;
            const v2_location = obj.faces[face][1][0] - 1;
            const v3_location = obj.faces[face][2][0] - 1;

            // f X/vt_1/X    X/vt_2/X    X/vt_3/X
            const vt1_location = obj.faces[face][0][1] - 1;
            const vt2_location = obj.faces[face][1][1] - 1;
            const vt3_location = obj.faces[face][2][1] - 1;

            // equals f X/X/vn_1    X/X/vn_2    X/X/vn_3
            const vn1_location = obj.faces[face][0][2] - 1;
            const vn2_location = obj.faces[face][1][2] - 1;
            const vn3_location = obj.faces[face][2][2] - 1;

            const v_1 = obj.vertices[v1_location];
            const v_2 = obj.vertices[v2_location];
            const v_3 = obj.vertices[v3_location];

            var vt_1 = 0;
            var vt_2 = 0;
            var vt_3 = 0;
            if (obj.texCoords.length == 0) {
                console.warn('OBJ Parser: OBJ-File', src, 'does not contain Texture Coordinates.');
            } else {
                vt_1 = obj.texCoords[vt1_location];
                vt_2 = obj.texCoords[vt2_location];
                vt_3 = obj.texCoords[vt3_location];
            }
            if (obj.vertexNormals.length == 0) {
                console.warn('OBJ Parser: OBJ-File', src, 'does not contain Vertex Normals.');
            }
            const nor_a = obj.vertexNormals[vn1_location];
            const nor_b = obj.vertexNormals[vn2_location];
            const nor_c = obj.vertexNormals[vn3_location];

            const colR = Math.random();
            const colG = Math.random();
            const colB = Math.random();

            const rgb = [colR, colG, colB];
            obj.combined.push(
                ...v_1,
                ...vt_1,
                ...nor_a,
                ...rgb,

                ...v_2,
                ...vt_2,
                ...nor_b,
                ...rgb,

                ...v_3,
                ...vt_3,
                ...nor_c,
                ...rgb
            );
        }
        // }
        console.log('Parsed OBJ-file', '"' + src + '"', 'in', performance.now() - then, 'ms.');
        // console.log(Utils.printMatrix(obj.combined, 6, obj.combined.length / 6, 1));
        return obj;
    };

    /**
     * Load an image.
     * @param {string} src The path to the image
     * @param {boolean?} verbose A flag to to print info
     * @returns {HTMLImageElement} The loaded image
     */
    static loadImage = (src) => new Promise(resolve => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.src = src;
        // resize image to 128 x 128
        img.width = 128;
        img.height = 128;
        return img;
    });

    /**
     * Load an image concurrently.
     * @param {string} src The path to the image
     * @returns {HTMLImageElement} The loaded image
     */
    static async loadImageConcurrently(src) {
        var img = await this.loadImage(src);
        return img;
    }

    /**
     * Generate a texture with a test strip pattern.
     * @param {*} width The width of the texture.
     * @param {*} height The height of the texture.
     * @returns {Float32Array} A test strip texture with RGBA16F. Alpha is always 1.
     */
    static getEmptyStartTexture(width = 512, height = 512, verbose = false) {
        var textureData = new Float32Array(width * height * 4);
        for (let i = 0; i < width * height; i++) {
            textureData[i * 4 + 0] = 0;  // r
            textureData[i * 4 + 1] = 0;     // g
            textureData[i * 4 + 2] = 0;     // b
            textureData[i * 4 + 3] = 1;     // a
        }
        if (verbose) {
            console.info('Generated empty start texture of size', width, 'x', height);
        }
        // return Imagedata as RGBA16F
        return textureData
    }

    /**
     * Generate a random texture.
     * @param {number} width The width of the texture
     * @param {number} height The height of the texture
     * @returns {Float32Array} A random texture with RGBA16F values ranging from 0 to 1. Alpha is always 1.
     */
    static getRandomStartTexture(width = 512, height = 512, verbose = false) {
        var textureData = new Float32Array(width * height * 4);

        for (let i = 0; i < width * height; i++) {
            // Random value between 0 and 1 for each channel.
            textureData[i * 4 + 0] = Math.random();  // r       //occupation
            textureData[i * 4 + 1] = Math.random();  // g       //heading
            textureData[i * 4 + 2] = Math.random();  // b       //acceleration
            textureData[i * 4 + 3] = 0.0;   // a (fully opaque) //age
        }

        if (verbose) {
            console.info('Generated random start texture of size', width, 'x', height);
        }
        return textureData;
    }

    /**
     * Generate a red texture.
     * @param {number} width The width of the texture
     * @param {number} height The height of the texture
     * @returns {Float32Array} A red texture with RGBA16F values ranging from 0 to 1. Alpha is always 1.
     * @example
    */
    static getRedStartTexture(width = 512, height = 512, verbose = false) {
        var textureData = new Float32Array(width * height * 4);

        for (let i = 0; i < width * height; i++) {
            textureData[i * 4 + 0] = 1.0;  // r
            textureData[i * 4 + 1] = 0.0;  // g
            textureData[i * 4 + 2] = 0.0;  // b
            textureData[i * 4 + 3] = 1.0;  // a
        }

        if (verbose) {
            console.info('Generated red start texture of size', width, 'x', height);
        }
        return textureData;
    }

    /**
     * @param {string} path The path to a GLSL shader file
     * @returns {Promise<string>} The shader code as a string
     */
    static readShaderFile = async (path) => {
        const response = await fetch(path);
        const shaderCode = await response.text();
        return shaderCode;
    }

    /**
     * Positions for a quad covering the entire canvas. 
     */
    static canvasPoints = new Float32Array([
        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0
    ]);

    /**
     * Quad texture coordinates for a full screen quad.
     */
    static quadTextCoords = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
    ]);

    /**
     * #### A Float32Array containing a the coordinates of a flat canvas plane and their texture coordinates in the following layout:
     * test
     * ---
     * [x][y][z]-[u][v] (5 BYTES per line (Stride), 3 BYTE Offset for aTexCoords)
     */
    static canvasAttribs = new Float32Array([
        // vec3 aPosition,  vec2 aTexCoord
        -1.0, -1.0, 0.0, 0.0, 0.0,
        1.0, -1.0, 0.0, 1.0, 0.0,
        1.0, 1.0, 0.0, 1.0, 1.0,
        -1.0, 1.0, 0.0, 0.0, 1.0
    ]);

    /**
     * Generate random 2D-coordinates in the range [-1, 1].
     * @param {number} count The number of coordinates to generate
     * @returns {Float32Array} The generated 2D-coordinates as a Float32Array
     */
    static randomCoords = (count) => {
        const coors = new Float32Array(count * 2);
        for (let i = 0; i < count; i++) {
            coors[i * 2] = Math.random() * 2 - 1;
            coors[i * 2 + 1] = Math.random() * 2 - 1;
        }
        return coors;
    }

    static populateParticleBuffer = (count, max_x=width, max_y=height, min_x=0, min_y=0) => {
        //XYZ, ID
        const particleBuffer = new Float32Array(count * 4);
        for (let i = 0; i < count; i++) {
            particleBuffer[i * 4] = Math.random() * (max_x - min_x) + min_x;
            particleBuffer[i * 4 + 1] = Math.random() * (max_y - min_y) + min_y;
            particleBuffer[i * 4 + 2] = Math.random() * Math.PI * 2;
            particleBuffer[i * 4 + 3] = i;
        }
        return particleBuffer;
    }

    /**
     * Generate a Gaussian kernel of a given size and sigma.
     * @param {number} size The size of the kernel, must be odd
     * @param {number} sigma The standard deviation of the Gaussian, higher values result in more blur
     * @param {boolean} verbose A flag to print the kernel to the console
     * @returns {Float32Array} The generated kernel
     */
    static gaussKernel1D(size, sigma = size / 6, verbose = false) {
        const kernel = new Float32Array(size);
        const center = (size - 1) / 2;
        let sum = 0.0;
        for (let i = 0; i < size; i++) {
            kernel[i] = Math.exp(-Math.pow(i - center, 2) / (2 * Math.pow(sigma, 2)));
            sum += kernel[i];
        }
        var total = 0.0;
        for (let i = 0; i < size; i++) {
            kernel[i] /= sum;
            total += kernel[i];
        }
        if (verbose) {
            console.groupCollapsed('Generated Gaussian kernel');
            console.log('Size:', size + ', Sigma:', sigma + ', Total:', total);
            console.log(kernel);
            console.groupEnd();
        }
        if (sigma == 0) {
            // no blur
            kernel.fill(0);
            kernel[center] = 1;
        }
        return kernel;
    }

    /**
     * Generate a box kernel of a given size.
     * @param {number} size The size of the kernel, must be odd
     * @param {boolean} verbose A flag to print the kernel to the console
     * @returns {Float32Array} The generated kernel
    **/
    static boxKernel(size, verbose = false) {
        const kernel = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            kernel[i] = 1.0;
        }
        if (verbose) {
            console.info('Generated box kernel of size', size, ':', kernel);
        }
        return kernel;
    }

    /**
     * Prepares a Float32Array to be logged to the console in a readable format.
     * 
     * @param {Float32Array} array The array to prepare
     * @param {number} rows The width of the array
     * @param {number?} cols The height of the array (can be omitted if the array is square)
     * @param {number?} precision The number of decimal places to show
     * @returns {string} The formatted string
    */
    static printMatrix = (matrix, cols, rows = cols, precision = 0) => {
        const maxLength = Math.max(...matrix.map(num => num.toFixed(precision).length));
        var str = '';
        for (let i = 0; i < rows; i++) {
            str += '[ ';
            for (let j = 0; j < cols; j++) {
                str += matrix[i * cols + j].toFixed(precision).padStart(maxLength, ' ');
                if (j < cols - 1) {
                    str += ', ';
                }
            }
            str += i < rows - 1 ? ' ]' + '\n ' : ' ]';
        }
        return str;
    }


    /**
      * Read a text file from the server and parse it into a Float32Array.
      * @param {string} path The path to the XYZ file
      * @returns {Promise<Float32Array>} The parsed XYZ data with the last element being the number of rows
      * @example 
      * var topoMap = await Utils.readXYZMapToTexture('topo.xyz');
      * const size = topoMap[topoMap.length-1];
      * topoMap = topoMap.slice(0, topoMap.length-1);
    **/
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

    /**
     * Normalizes a point cloud to the range [0, 1].
     * @param {Float32Array} pointCloud The array storing a point cloud
     * @returns {Float32Array} The normalized point cloud array
     */
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

    /**
     * Creates a download prompt for the PNG image of a Float32Array.
     * @param {Float32Array} data The data to save
     * @param {string} filename The name of the file to save
     * @param {number} width The width of the image
     * @param {number} height The height of the image
     */
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

    static getBufferContents = (gl, buffer, COUNT, cols = null, max=COUNT/4) => {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        const checkStatus = () => {
            const status = gl.clientWaitSync(sync, gl.SYNC_FLUSH_COMMANDS_BIT, 0);
            if (status == gl.TIMEOUT_EXPIRED) {
                console.log('GPU busy.'); setTimeout(checkStatus);
            } else if (status === gl.WAIT_FAILED) {
                console.erfor('Context lost.');
            } else {
                const view = new Float32Array(COUNT);
                gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, buffer);
                gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, view);
                gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);
                // if (cols != null) {
                //     console.log(Utils.printMatrix(view, cols, max, 2));
                // } else {
                    console.log(view);
                // }
            };
        };
        setTimeout(checkStatus);
    };
}
