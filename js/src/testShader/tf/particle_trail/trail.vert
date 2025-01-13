#version 300 es
precision highp float;

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


void main() {
    gl_PointSize = 400.0;

    vPosition = aPosition;
    vTexCoord = aTexCoord;
    vParticle = aParticle;
    vParticle.xy = vParticle.xy; 
    gl_Position = vec4(aPosition, 1.0);
}