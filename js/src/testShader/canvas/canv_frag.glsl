#version 300 es
precision highp float;

in vec2 vTexCoord;
in vec2 vPosition;

uniform sampler2D uParticleTexture;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uMouse;

out vec4 fragColor;

vec4 prepareCursor(float radius, vec4 color) {
    // normalize moues position
    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;

    vec4 cursor = vec4(0.0, 0.0, 0.0, 0.0);
    // show the mouse position
    if (distance(gl_FragCoord.xy, mouse * uResolution) < radius) {
        if (mouseClick == 1.0) {
            cursor = color;
        }
    }
    return cursor;
}

void main() {
    fragColor = texture(uParticleTexture, vTexCoord);
}