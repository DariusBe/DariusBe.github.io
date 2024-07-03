#version 300 es
precision mediump float;

in vec3 position;
layout(location=0) out vec3 fboPosition;

void main() {
    fboPosition = position;
}