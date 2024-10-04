#version 300 es
precision highp float;

in vec2 vTexCoord;

uniform sampler2D uSampler;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uMouse;

out vec4 fragColor;

void main() {
    vec4 xyz = texture(uSampler, vTexCoord);
    xyz.z = xyz.z;
    fragColor = vec4(xyz.z, 0.0, 1.0-xyz.z, 1.0);
}