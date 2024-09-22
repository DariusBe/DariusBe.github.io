#version 300 es

layout(location = 0) in vec2 aPosition;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uMouse;

out vec2 vPosition;

vec2 randomizeCoords(vec2 coord) {
    float x = coord.x + sin(uTime) * 0.1;
    float y = coord.y + cos(uTime) * 0.1;
    return vec2(x, y);
}

void main() {
    gl_PointSize = 2.0;
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vPosition = randomizeCoords(aPosition);
}