#version 300 es

uniform float uPointSize;
uniform float uTime;
uniform vec3 uMouse;

// INPUTS
layout(location=0) in vec3 aPosition;
// TFOs OUTPUTS require the following

out vec3 position;   // 3*4 bytess

float randomVal() {
    return fract(sin(dot(aPosition.xy, vec2(12.9898,78.233))) * 43758.5453);
}

float randomAngle() {
    return sin(uTime);
}


void main() {
    // Move the vertex using Transform Feedback Input
    vec2 newPos = aPosition.xy;
    float rotation = aPosition.z;
    rotation += randomVal() * 0.1;

    // normalize moues position
    vec2 mouse = uMouse.xy * 2.0 - 1.0;
    float mouseClick = uMouse.z;

    // Move the vertex
    newPos.x += cos(rotation) * 0.025;
    newPos.y +=  sin(rotation) * 0.025;

    // mouse force
    vec2 mouseForce = mouse - newPos.xy;
    float distance = length(mouseForce);
    if (distance < 0.15 && mouseClick == 1.0) {
        newPos += normalize(mouseForce) * 0.1;
    }

    gl_Position = vec4(newPos, 0.0, 1.0);
    position = vec3(newPos, rotation);
    gl_PointSize = uPointSize;
}