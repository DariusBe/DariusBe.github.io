#version 300 es
precision highp float;
#define PI 3.14159265359

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;
layout(location = 2) in vec4 aParticle;

layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    mat4 uModel;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};

uniform sampler2D uParticleSampler; //texture unit 0
uniform sampler2D uCostSampler; //texture unit 1

uniform float uParticleCount;
uniform float uSensorAngle; // 22.5 degrees
uniform float uSensorDistance; // 8 pixels

out vec3 vPosition;
out vec2 vTexCoord;
out vec4 vParticle;

vec2 randomize(vec2 vec) {
    float random = fract(sin(uTime + 12397.1237) * cos(17263.0 + uTime));
    return vec2(random * vec.x, random * vec.y);
}

float random(float seed) {
    return fract(sin(seed + 12397.1237) * cos(17263.0 + seed));
}


float randomSign() {
    return sign(random(uTime*float(gl_VertexID)) - 0.5);
}   

void main() {
    vec2 pos = aParticle.xy;
    vec2 mouse = uMouse.xy;
    float mouseDown = uMouse.z;

    float heading = aParticle.z;
    // keep in bounds
    if (pos.x <= -1.0 || pos.x >= 1.0 || pos.y <= -1.0 || pos.y >= 1.0) {
        heading += PI/2.0;
    }
    pos.x += cos(heading) * 0.01;
    pos.y += sin(heading) * 0.01;

    if (mouseDown == 1.0) {
        pos.xy = mouse * 2.0 - 1.0;
    }

    vPosition = aPosition;
    vTexCoord = aTexCoord;
    vParticle = vec4(pos.xy, heading, aParticle.w);
    vParticle.xy = pos.xy; //+ vec2(sin(uTime)*0.005, cos(uTime)*0.005);


    gl_Position = vec4(pos.xy, 1.0, 1.0);
}
