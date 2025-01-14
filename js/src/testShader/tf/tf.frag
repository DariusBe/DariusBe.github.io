#version 300 es
precision highp float;

in vec3 vPosition;
in vec2 vTexCoord;
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
uniform sampler2D uAdditionalSampler;

uniform float uParticleCount;
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
    // vec2 uv = vTexCoord;
    // vec2 st = uv / uResolution;
    // vec3 pos = vParticle.xyz;
    // vec4 cursor = prepareCursor(350.0, vec4(0.0f, 0.0f, 0.0f, 0.5f));

    // vec4 cost = texture(uCostSampler, uv);
    // vec4 particle = texture(uParticleSampler, uv);

    // // render particles
    // vec4 test = vec4(0.0f);
    // if (particle.r > 0.5) {
    //     test = vec4(1.0f) + cursor;
    // } else {
    //     test = vec4(0.0f, 0.0f, 0.0f, 1.0f) + cursor;
    // }
    // fragColor = cost;

    vec2 delta = gl_PointCoord - vec2(0.5, 0.5);
    float lenSqr = abs(dot(delta, delta));
    float a = smoothstep(0.25, 0.24, lenSqr);
    

    // vec3 col = texture(uAdditionalSampler, gl_FragCoord.xy/uResolution).rgb;
    fragColor = vec4(vec3(1.0), a);
}
