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
    if (distance(gl_FragCoord.xy, mouse * uv) < 25.0) {
        if (mouseClick == 1.0) {
            cursor = vec3(1.0, 0.0, 0.0);
        } else {
            cursor = vec3(0.25, 0.25, 0.25);
        }
    }

    vec3 points = vec3(0.0);
    float currentState = texelFetch(uSampler, ivec2(gl_FragCoord.xy), 0).r;
    if (currentState < 0.001) {
        points = vec3(1.0);
    }

    fragColor = vec4(points + cursor, 1.0);
}

