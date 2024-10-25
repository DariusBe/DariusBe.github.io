export class Utils {

    /**
     * Load an image.
     * @param {string} src The path to the image
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
    static getEmptyStartTexture(width = 512, height = 512) {
        var textureData = new Float32Array(width * height * 4);
        for (let i = 0; i < width * height; i++) {
            textureData[i * 4 + 0] = (i % 15 == 0) ? 255 : 0;  // r
            textureData[i * 4 + 1] = 0;     // g
            textureData[i * 4 + 2] = 0;     // b
            textureData[i * 4 + 3] = 1;     // a
        }
        console.info('Generated empty start texture of size', width, 'x', height);
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
            const fill = Math.random();
            textureData[i * 4 + 0] = fill;  // r
            textureData[i * 4 + 1] = fill;  // g
            textureData[i * 4 + 2] = fill;  // b
            textureData[i * 4 + 3] = 1.0;   // a (fully opaque)
        }

        if (verbose) {
            console.info('Generated random start texture of size', width, 'x', height);
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
        -1.0, -1.0,
        1.0, -1.0,
        1.0, 1.0,
        -1.0, 1.0
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

    /**
     * Generate a Gaussian kernel of a given size and sigma.
     * @param {number} size The size of the kernel, must be odd
     * @param {number} sigma The standard deviation of the Gaussian, higher values result in more blur
     * @param {boolean} verbose A flag to print the kernel to the console
     * @returns {Float32Array} The generated kernel
     */
    static gaussKernel1D(size, sigma=size/6, verbose = false) {
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
            console.log('Size:', size+', Sigma:', sigma+', Total:', total);
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
}