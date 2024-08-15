#version 300 es
//#pragma vscode_glsllint_stage : vert

layout(location=0) in vec2 aCanvas;
layout(location=1) in vec2 aTextureCoord;

out vec2 vTextureCoord;

void main() {
    vTextureCoord = aTextureCoord;
    gl_Position = vec4(aCanvas, 0.0, 1.0);
}