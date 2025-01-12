#version 300 es
precision highp float;

in vec2 vTexCoord;
in vec2 vPosition;
in vec4 vParticle;

layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    mat4 uModel;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};
uniform sampler2D uParticleSampler;
uniform sampler2D uCostSampler;

uniform int uParticleCount;
uniform float uSensorAngle; // 22.5 degrees
uniform float uSensorDistance; // 8 pixels

out vec4 fragColor;

vec4 prepareCursor(float radius, vec4 color) {
    // normalize moues position
    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;

    vec4 cursor = vec4(0.0);
    // show the mouse position
    if (distance(gl_FragCoord.xy, mouse * uResolution) < radius) {
        if (mouseClick == 1.0) {
            cursor = color;
        }
    }
    return cursor;
}

void main() {
    vec2 uv = vTexCoord;
    vec2 st = uv / uResolution;
    vec3 pos = vParticle.xyz;
    vec4 outColor = vec4(0.0f);
    vec4 cursor = prepareCursor(250.0, vec4(1.0f));

    // vec4 particle = texelFetch(uParticleSampler, ivec2(vParticle.xy), 0);
    vec4 cost = texture(uCostSampler, uv);
    fragColor = vec4(1.0, 1.0, 1.0, 1.0f);
}