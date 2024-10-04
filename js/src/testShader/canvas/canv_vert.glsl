#version 300 es

layout(location = 0) in vec2 aPosition;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uMouse;

out vec2 vPosition;

void main() {
    vec2 mouse = (uMouse.xy-0.5)*2.0;
    vec2 pos = aPosition;

    gl_PointSize = 2.0;
    gl_Position = vec4(pos, 0.0, 1.0);
    vPosition = vec2(0.0);
}