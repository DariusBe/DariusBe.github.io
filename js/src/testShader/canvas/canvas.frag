#version 300 es
precision highp float;

#define PI 3.14159265359

in vec2 vTexCoord;

uniform sampler2D uCanvasSampler1;
uniform sampler2D uCanvasSampler2;
uniform sampler2D uCanvasSampler3;
layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    mat4 uModel;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};

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

void main() {
    float texelSize = 1.0 / uResolution.x;

    vec4 trail = texture(uCanvasSampler1, vTexCoord);
    vec4 cost = texture(uCanvasSampler2, vTexCoord);
    vec4 sensor = texture(uCanvasSampler3, vTexCoord);
    
    // fragColor = mix(trail, cost, 0.5);
    fragColor = mix(trail, cost, 0.0);
    fragColor = mix(fragColor, sensor, 0.0);
}
