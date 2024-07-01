#version 300 es
precision mediump float;

in vec3 position;

out vec4 fragColor;

void main() {
    vec3 baseColor = vec3(0.0, 0.0, 0.0);
    fragColor = vec4(baseColor, 1.0);
}