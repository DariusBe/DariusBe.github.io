#version 300 es
precision mediump float;

in vec2 vTexCoord;

uniform vec3 uMouse;
uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uSampler;

out vec4 fragColor;

void main() {
    float t = uTime;

    vec2 uv = uResolution;
    // normalize moues position
    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;

    vec3 cursor = vec3(0.0);
    // show the mouse position
    if (distance(gl_FragCoord.xy, mouse * uv) < 8.0) {
        if (mouseClick == 1.0) {
            cursor = vec3(0.35, 0.35, 0.35);
        } else {
            cursor = vec3(0.15, 0.15, 0.15);
        }
    }

    vec3 tex = texture(uSampler, vTexCoord).rgb;

    fragColor = vec4(tex+cursor, 1.0);
}

