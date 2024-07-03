#version 300 es

uniform float uPointSize;
uniform float uTime;
uniform vec3 uMouse;

// INPUTS
layout(location=0) in vec3 aPosition;
// TFOs OUTPUTS require the following

out vec3 position;   // 3*4 bytess

float randomVal() {
    float sign_flag = 1.0;
    if (fract(sin(dot(aPosition.xy, vec2(13.982312398,78.233))) * 4338.5412353) > 0.5) {
        sign_flag = -1.0;
    }
    return fract(sin(dot(aPosition.xy, vec2(12.9898,78.233))) * 43758.5453) * sign_flag;
}


void main() {
    // Move the vertex using Transform Feedback Input
    vec2 newPos = aPosition.xy;
    float rotation = aPosition.z;
    rotation += randomVal();

    // normalize moues position
    vec2 mouse = uMouse.xy * 2.0 - 1.0;
    float mouseClick = uMouse.z;
    

    // Move the vertex
    float stepWidth = 0.01;
    newPos.x += cos(rotation) * stepWidth;
    newPos.y +=  sin(rotation) * stepWidth;

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