#version 300 es
precision mediump float;

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
out vec3 vPosition;
out vec2 vTexCoord;
out vec4 vParticle;

float randomVal(vec3 seed) {
    return fract(sin(dot(seed, vec3(12.9898, 78.233, 11.979))) * 43758.5453);
}

void main() {

    // vec2 aspectRatio = vec2(uResolution.x / uResolution.y, 1.0);
    // vec3 particlePos = aParticle.xyz;
    // float particleID = aParticle.w;
    // particlePos.x = randomVal(particlePos + sin(uTime*1276.123));
    // particlePos.y = randomVal(particlePos + cos(uTime*23.897));
    // particlePos.z = 0.0;
    // vParticle = vec4(particlePos.xyz, particleID);
    
    vPosition = aPosition;
    vTexCoord = aTexCoord;
    
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}
