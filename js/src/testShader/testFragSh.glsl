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

    vec4 cursor = vec4(0.0);
    // show the mouse position
    if (distance(gl_FragCoord.xy, mouse * uv) < 15.0) {
        if (mouseClick == 1.0) {
            cursor = vec4(0.4471, 0.4471, 0.4471, 0.1);
        } else {
            cursor = vec4(0.25);
        }
    }

    vec3 tex = texture(uSampler, vTexCoord).rgb;

    fragColor = vec4(tex, 1.0)+cursor;
}

