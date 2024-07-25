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

    static prepareShaderProgram = async (gl, vertexShaderPath, fragmentShaderPath) => {
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
        gl.linkProgram(shaderProgram);

        return shaderProgram;
    }
}