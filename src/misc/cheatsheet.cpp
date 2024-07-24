// ORDER OF OPERATIONS:

// CONTEXT:
// get canvas, get context

// SHADER PROGRAMS:
// create shader, use shaderSource(shader, src), compile(shader), attach(canvasProgram, shader)
// link & use canvasProgram

// ATTRIBUTES:
const attributeLocation // var from:
getAttribLocation(canvasProgram, 'attribute_name')
const bufferData = Float32Array([])
const buffer = createBuffer()
bindBuffer(ARRAY_BUFFER, buffer)
bufferData(ARRAY_BUFFER, bufferData, STATIC_DRAW) // if not changing
enableVertexAttribArray(attributeLocation) // only once after binding to buffer
// define buffer layout: vertexAttribPointer(attributeLocation, nr_of_chunks, FLOAT, normalized=false, chunk_size_in_bytes, offset_in_bytes)
    // EXAMPLE:
    vertexAttribPointer(attributeLocation, 2, this.gl.FLOAT, false, 3*4, 0);
    // would mean we have an array of 3 floats (= 4 bytes) per vertex, and we want to use the first 2 floats as x,y coordinates
    vertexAttribPointer(attributeLocation, 1, this.gl.FLOAT, false, 3*4, 2*4);
    // to get the third float from the array

// UNIFORMS:
const uniformLocation = getUniformLocation(canvasProgram, 'uniform_name')
const bufferData = Float32Array([]) //, etc.
// uniform1f(uniformLocation, bufferData) for float, uniform2fv(location, bufferData) for vec2, etc.
    // EXAMPLE:
    uniform1f(uniformLocation, 0.5);
    uniform2fv(uniformLocation, new Float32Array([0.5, 0.5]));

// TEXTURES:
// necessary in fragment shader are uniform sampler2D uSampler 
// and an attribute in vec2 vTextureCoord that is passed from vertex shader:
        // VERTEX SHADER:
            #version 300 es

            layout(location=0) in vec2 aCanvas;
            layout(location=1) in vec2 aTextureCoord;   --> incoming texture coordinates

            void main() {
                vTextureCoord = aTextureCoord;          --> pass texture coordinates to fragment shader
                gl_Position = vec4(aCanvas, 0.0, 1.0);
            }

        // FRAGMENT SHADER:
            #version 300 es
            precision mediump float;

            // texture data
            in vec2 vTextureCoord;                      --> incoming texture coordinates from vertex shader
            uniform sampler2D uSampler; //textureunit 0 --> necessary uniform for texture
            out vec4 fragColor;

            void main() {
                fragColor = texture(uSampler, vTextureCoord);
            }

// given that vertices already exist, are bound to buffer and have been defined with vertexAttribPointer
// EXAMPLE:
        plane = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        1.0, 1.0,
        -1.0, 1.0
    ]);
// provide texture coordinates as attribute:
const texCoordBufferData = Float32Array([0.0, 0.0, ...]), with texture coordinates for each vertex matching order of vertices
// EXAMPLE: Cube Unwrapping
        "1.0, 1.0, 1.0,  0.0, 0.0"
        X    Y    Z                                   U    V
        -1.0, -1.0, (1.0) (top right (front)) lies at 0.0, 0.0 (bottom left of texture)
        ...
const texCoordBuffer = createBuffer()
bindBuffer(ARRAY_BUFFER, texCoordBuffer)
bufferData(ARRAY_BUFFER, texCoordBufferData, STATIC_DRAW)
vertexAttribPointer(texCoordLocation, 2, FLOAT, false, 0, 0)
enableVertexAttribArray(texCoordLocation)
// provide texture image from file (async) or array 'pixels':
    // EXAMPLE:
        const loadImage = () =>  new Promise(resolve => {
            const img = new Image();
            image.addEventListener('load', () => resolve(img));
            img.src = './image.jpg';
        });
        const run = async () => {
            const img = loadImage('image.jpg');
            // all later texture code must be in the async function
            [ const texture = createTexture();
                ... ]
            };
    // or
        const pixels = new Uint8Array([
            255, 0, 0, 255,  // red
            0, 255, 0, 255,  // green
            0, 0, 255, 255,  // blue
            255, 255, 0, 255 // yellow
        ]);
// Either way, image will be flipped vertically due to openGL coordinate system, so lets flip storage strategy before creating texture
    pixelStorei(UNPACK_FLIP_Y_WEBGL, true)
const texture = createTexture()
bindTexture(TEXTURE_2D, texture)
texImage2D(TEXTURE_2D, 0, RGBA, 4, 4, 0, RGBA, gl.UNSIGNED_BYTE, pixels) // target, mipmap_level, internalFormat, (opt. width, height, border=always_zero,) format, type, data_source
// WebGL by default requires mipmaps (either create ad-hoc (1) or change default config (2))
    // 1) 
    generateMipmap(TEXTURE_2D)
    // 2) 
    texParameteri(TEXTURE_2D, TEXTURE_MIN_FILTER, NEAREST) and texParameteri(TEXTURE_2D, TEXTURE_MAG_FILTER, NEAREST)



// DRAW:
gl.useProgram( shader1 );
gl.bindBuffer(cubeVbo )
gl.vertexAttribPointer() ...
gl.drawArrays()
gl.useProgram( shader2 );
gl.bindBuffer(cubeNormalVbo )
gl.vertexAttribPointer() ...
gl.drawArrays()
drawArrays(mode, first, count)

// FRAMEBUFFERS:
gl.createFramebuffer() 
bindFramebuffer()   // "turn on" framebuffer, necessary when adding attachments, textures, before drawcalls, etc.
// unbind to return to default framebuffer
// by default, framebuffer does not have a color attachment, so we need to add one:
// e.g. a texture:
    const fb_Texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, fb_Texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
// attach texture to framebuffer:
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fb_Texture, 0);
// or renderbuffer:
    const fb_Renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, fb_Renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 512, 512);
// attach renderbuffer to framebuffer:
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, fb_Renderbuffer);
// Framebuffers should be checked for completeness:
const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.error('Framebuffer is not complete');
}
drawBuffer() // can be used to specify which color attachment to draw from
// only necessary when multiple color attachments are used
// drawing to buffer means to draw to the texture or renderbuffer attached to the framebuffer
clearBuffer() // can be used to clear the buffer before drawing




// WEBGL
sqr - pow(x, 2.0)
