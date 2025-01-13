#version 300 es
precision highp float;

in vec3 vPosition;
in vec2 vTexCoord;
in vec4 vParticle;

uniform sampler2D uSampler;

// uniform binding index = 0
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

void main() {
    vec2 pos = vParticle.xy;
    float dist = distance(gl_FragCoord.xy, pos);

    vec4 color = texture(uSampler, vTexCoord);
    fragColor = color;

    if (dist < 5.0) {
        fragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
}
