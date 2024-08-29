#version 300 es

layout(location=0) in vec2 aPosition;
layout(location=1) in vec2 aTexCoord;

out vec2 vTextureCoord;

void main() {
    vTextureCoord = aTexCoord;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}