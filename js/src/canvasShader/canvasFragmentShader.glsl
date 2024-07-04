#version 300 es
//#pragma vscode_glsllint_stage : frag
precision mediump float;

// texture data
in vec2 vTextureCoord;

uniform sampler2D fboPositionSampler; // texture unit 0

uniform float uTime;
uniform vec3 uMouse;
uniform vec2 uResolution;

out vec4 fragColor;

vec3 applyConv(inout vec3 inputColor, int repeat) {
    float kernel[9];
    kernel[0] = 1.0 / 16.0; kernel[1] = 2.0 / 16.0; kernel[2] = 1.0 / 16.0;
    kernel[3] = 2.0 / 16.0; kernel[4] = 4.0 / 16.0; kernel[5] = 2.0 / 16.0;
    kernel[6] = 1.0 / 16.0; kernel[7] = 2.0 / 16.0; kernel[8] = 1.0 / 16.0;

    // calculate the size of a texel
    ivec2 texSize = textureSize(fboPositionSampler, 0);
    vec2 tex_offset = 1.0 / vec2(texSize);
    vec2 offsets[9];
    offsets[0] = vec2(-tex_offset.x, tex_offset.y);  // top-left
    offsets[1] = vec2(0.0, tex_offset.y);            // top-center
    offsets[2] = vec2(tex_offset.x, tex_offset.y);   // top-right
    offsets[3] = vec2(-tex_offset.x, 0.0);           // center-left
    offsets[4] = vec2(0.0, 0.0);              // center-center
    offsets[5] = vec2(tex_offset.x, 0.0);            // center-right
    offsets[6] = vec2(-tex_offset.x, -tex_offset.y); // bottom-left
    offsets[7] = vec2(0.0, -tex_offset.y);           // bottom-center
    offsets[8] = vec2(tex_offset.x, -tex_offset.y);  // bottom-right
    
    vec3 result = vec3(1.0, 1.0, 1.0);

    for (int i = 0; i<repeat; i++) {
        for (int i = 0; i < 9; i++) {
            vec3 texColor = texture(fboPositionSampler, vTextureCoord + offsets[i]).rgb;
            if (abs(texColor.x) > 0.0 || abs(texColor.y) > 0.0) {
                texColor = vec3(1.0, 1.0, 1.0);
            }
            result -= texColor * kernel[i];
        }
    }
    return result;
}

void main() {

    vec3 position = texture(fboPositionSampler, vTextureCoord).rgb;
    float rotation = position.z; 

    vec2 mousePos = uMouse.xy / uResolution.xy;
    vec3 color = vec3(1.0);
    
    // abs is used to avoid negative values
    if(abs(position.x) > 0.0 || abs(position.y) > 0.0) {
        color = vec3(0.0);
    }

    // apply convolution
    //color = applyConv(color, 1);

    fragColor = vec4(color, 1.0);
}



// vec3 drawMouseCursor(vec2 st, vec2 mousePos) {
//     vec3 color = vec3(0.0);
//      if ((abs(st.x - mousePos.x) < 0.001 || abs(st.y - mousePos.y) < 0.001) && distance(st, mousePos) < 0.015) {
//         color = vec3(1.0, 0.0, 0.0);
//     }
//     return color;
// }