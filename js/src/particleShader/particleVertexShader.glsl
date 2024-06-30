#version 300 es

uniform float uPointSize;
uniform float uTime;
uniform vec3 uMouse;

// INPUTS
layout(location=0) in vec3 aPosition;
// TFOs OUTPUTS require the following

out vec3 position;   // 3*4 bytess

float randomFloat() {
    return 
    fract(sin(mod(float(gl_VertexID), uTime) + gl_Position.x) * 43758.5453123) +
    fract(cos(float(gl_VertexID) + gl_Position.y) * 123879.1453123) - 0.5;
}


void main() {
    // Move the vertex using Transform Feedback Input
    vec2 newPos = aPosition.xy;
    newPos.x += randomFloat() * 0.001;
    newPos.y += randomFloat() * 0.001;

    if (newPos.x > 1.0) {
        newPos.x = -1.0;
    } else if (newPos.x < -1.0){
        newPos.x = 1.0;
    }
    if (newPos.y > 1.0) {
        newPos.y = -1.0;
    } else if (newPos.y < -1.0){
        newPos.y = 1.0;
    }
    gl_Position = vec4(newPos, 0.0, 1.0);
    position = vec3(newPos, 0.0);
    gl_PointSize = 25.0;
}