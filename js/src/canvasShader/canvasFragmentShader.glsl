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


void main() {
    vec3 position = texture(fboPositionSampler, vTextureCoord).rgb;
    float rotation = position.z;  
    fragColor = vec4(position.xy, 0.0, 1.0);
}



// vec3 drawMouseCursor(vec2 st, vec2 mousePos) {
//     vec3 color = vec3(0.0);
//      if ((abs(st.x - mousePos.x) < 0.001 || abs(st.y - mousePos.y) < 0.001) && distance(st, mousePos) < 0.015) {
//         color = vec3(1.0, 0.0, 0.0);
//     }
//     return color;
// }