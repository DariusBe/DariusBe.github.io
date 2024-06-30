#version 300 es
//#pragma vscode_glsllint_stage : frag
precision mediump float;

// texture data
in vec2 vTextureCoord;
uniform sampler2D uSampler; // texture unit 0

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uMouse;

out vec4 fragColor;

vec3 drawMouseCursor(vec2 st, vec2 mousePos) {
    vec3 color = vec3(0.0);
     if ((abs(st.x - mousePos.x) < 0.001 || abs(st.y - mousePos.y) < 0.001) && distance(st, mousePos) < 0.015) {
        color = vec3(1.0, 0.0, 0.0);
    }
    return color;
}

void main() {
    // float time = uTime;
    // //normalize gl_FragCoord with correct aspect ratio
    // float aspectRatio = uResolution.x / uResolution.y;
    // vec2 st = gl_FragCoord.xy / uResolution.xy * vec2(aspectRatio, 1.0);
    // // normalize mouse position with correct aspect ratio
    // vec2 mousePos = uMouse.xy * vec2(aspectRatio, 1.0);
    // float mouseButton = uMouse.z;

    vec3 color = vec3(0.9);

    fragColor = texture(uSampler, vTextureCoord) + vec4(color, 1.0);
}