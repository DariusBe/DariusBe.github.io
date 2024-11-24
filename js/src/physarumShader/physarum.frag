#version 300 es
precision highp float;
precision highp sampler2D;

in vec3 vPosition;
in vec2 vTexCoord;


layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    mat4 uModel;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};
uniform int uParticleCount;
uniform float uSensorAngle;
uniform float uSensorDistance;
uniform sampler2D uParticleSampler;
uniform sampler2D uSampler; 

vec2 arr[8000];

out vec4 fragColor;

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 randomPosition() {
    vec2 pos = vec2(rand(gl_FragCoord.xy), rand(gl_FragCoord.xy));
    return pos;
}


void main() {
    vec2 uv = uResolution.xy * vTexCoord;
    vec4 tex1 = texture(uSampler, vTexCoord);
    vec4 tex2 = texture(uParticleSampler, vTexCoord);
    fragColor = mix(tex1, tex2, abs(sin(uTime)));
}