#version 300 es
precision mediump float;

in vec2 vTexCoord;

uniform vec3 uMouse;
uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uSampler;

out vec4 nextTexel;

void main() {
    // fetch the color from the texture
    vec4 texel = texture(uSampler, vTexCoord);

    vec3 col = vec3(0.0, 0.0, 0.0);
    float fetch = texelFetch(uSampler, ivec2(gl_FragCoord.xy), 0).r;
    if (fetch < 0.01) {
        col = vec3(0.0, 0.0, 0.0);
    } else {
        col = vec3(1.0, 1.0, 1.0);
    }
    nextTexel = vec4(col, 1.0);
}

