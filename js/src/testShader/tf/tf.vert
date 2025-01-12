#version 300 es
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
uniform sampler2D uCostSampler;     //texture unit 1

uniform int uParticleCount;
uniform float uSensorAngle;     // 22.5 degrees
uniform float uSensorDistance;  // 8 pixels

out vec2 vTexCoord;
out vec3 vPosition;
out vec4 vParticle;

vec2 randomize(vec2 vec) {
    float random = fract(sin(uTime + 12397.1237) * cos(17263.0 + uTime));
    return vec2(random * vec.x, random * vec.y);
}

float random(float seed) {
    return fract(sin(seed + 12397.1237) * cos(17263.0 + seed));
}

vec2 setToClippingSpace(vec2 pos) {
    return vec2(pos.x/uResolution.x*2.0 - 1.0, 1.0 - pos.y/uResolution.y*2.0);
}

void main() {

    gl_PointSize = 3.0;
    vec3 pos = aParticle.xyz;
    // pos.x = pos.x - 0.5 * 0.5;

    pos.x += cos(pos.z)*0.05;
    pos.y += sin(pos.z)*0.05;


    // keep in bounds
    if (pos.x <= -1.0 || pos.x >= 1.0 || pos.y <= -1.0 || pos.y >= 1.0) {
        pos.z += PI/2.0;
    }
    pos.z = mod(pos.z, 2.0*PI);

    vParticle = vec4(pos.xyz, 1.0);
    vTexCoord = aTexCoord;
    vPosition = aPosition;
    
    gl_Position = vec4(pos.xy, 0.0, 1.0);
}
