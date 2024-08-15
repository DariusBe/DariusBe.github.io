#version 300 es
precision mediump float;

uniform sampler2D currentFrameSampler;
uniform sampler2D previousFrameSampler;
uniform float fadeFactor;

in vec3 position;
layout(location=0) out vec3 fboPosition;

void main() {
    fboPosition = position;
}