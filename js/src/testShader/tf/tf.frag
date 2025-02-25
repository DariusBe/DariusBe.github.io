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
uniform float uRotationAngle; // 45 degreess
uniform float uSensorDistance; // 8 pixels

layout(location = 0) out vec4 fragColor;
layout(location = 1) out vec4 sensorColor;

vec4 colorGradient(float z) {
    // Define colors for the gradient
    vec3 color1 = vec3(1.0f, 0.0f, 0.0f); // Red
    vec3 color2 = vec3(0.0f, 1.0f, 0.0f); // Green
    vec3 color3 = vec3(0.0f, 0.0f, 1.0f); // Blue

    // Interpolate between colors based on z value
    if(z < 0.5f) {
        return vec4(mix(color1, color2, z * 2.0f), 1.0f);
    } else {
        return vec4(mix(color2, color3, (z - 0.5f) * 2.0f), 1.0f);
    }
    // transform color
}

vec4 prepareCursor(float radius, vec4 color) {
    // normalize moues position
    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;

    vec4 cursor = vec4(0.0f);
    // show the mouse position
    if(distance(gl_FragCoord.xy, mouse * uResolution) < radius) {
        if(mouseClick == 1.0f) {
            cursor = color;
        }
    }
    return cursor;
}

void main() {
    vec4 tex = texture(uParticleSampler, vTexCoord);
    vec2 delta = gl_PointCoord - vec2(0.5f, 0.5f);
    float lenSqr = abs(dot(delta, delta));
    float a = smoothstep(0.25f, 0.24f, lenSqr);

    float deposition = vParticle.w;

    fragColor = vec4(vec3(1.0f), a);
    fragColor.rgb *= deposition;



    sensorColor = vec4(0.0f);

    float heading = vParticle.z;
    vec2 pixelPos = vec2((vParticle.x * 0.5f + 0.5f), (vParticle.y * 0.5f + 0.5f)) * uResolution;
    vec2 F_sensorOffset = vec2(cos(heading), sin(heading)) * uSensorDistance;
    vec2 FL_sensorOffset = vec2(cos(heading + uSensorAngle), sin(heading + uSensorAngle)) * uSensorDistance;
    vec2 FR_sensorOffset = vec2(cos(heading - uSensorAngle), sin(heading - uSensorAngle)) * uSensorDistance;
    vec2 F_sensorPos = pixelPos + F_sensorOffset;
    vec2 FL_sensorPos = pixelPos + FL_sensorOffset;
    vec2 FR_sensorPos = pixelPos + FR_sensorOffset;

    if (distance(gl_FragCoord.xy, F_sensorPos) > 0.000) {
        sensorColor = vec4(0.83f, 1.0f, 0.0f, 1.0f);
    }
    if (distance(gl_FragCoord.xy, FL_sensorPos) > 0.5f) {
        sensorColor = vec4(0.1f, 0.0f, 1.0f, 1.0f);
    }
    if (distance(gl_FragCoord.xy, FR_sensorPos) > 1.0) {
        sensorColor = vec4(1.0f, 0.0f, 0.65f, 1.0f);
    }
}
