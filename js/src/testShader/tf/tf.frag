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

layout(location = 0) out vec4 fragColor;

vec4 colorGradient(float z) {
    // Define colors for the gradient
    vec3 color1 = vec3(1.0f, 0.0f, 0.0f); // Red
    vec3 color2 = vec3(0.0, 1.0, 0.0); // Green
    vec3 color3 = vec3(0.0, 0.0, 1.0); // Blue

    // Interpolate between colors based on z value
    if (z < 0.5) {
        return vec4(mix(color1, color2, z * 2.0), 1.0);
    } else {
        return vec4(mix(color2, color3, (z - 0.5) * 2.0), 1.0);
    }
    // transform color 
}

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
    vec2 delta = gl_PointCoord - vec2(0.5, 0.5);
    float lenSqr = abs(dot(delta, delta));
    float a = smoothstep(0.1, 0.0, lenSqr);

    float deposition = vParticle.w;

    fragColor = vec4(vec3(1.0)*deposition, a*deposition);

}
