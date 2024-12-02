#version 300 es
precision mediump float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;
layout(location = 2) in vec4 aParticleCoord;

out vec2 vTexCoord;
out vec4 vParticleCoord;

void main() {
    vTexCoord = aTexCoord;
    vParticleCoord = aParticleCoord;
    gl_Position = vec4(aPosition, 1.0);
}