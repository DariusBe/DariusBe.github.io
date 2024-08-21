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

    vec4 col = vec4(0.0, 0.0, 0.0, 1.0);
    float fetch = texelFetch(uSampler, ivec2(gl_FragCoord.xy), 0).r;
    if (fetch < 0.6) {
        col.rgb = vec3(1.0, 0.0, 0.0);
    } else {
        col.rgb = vec3(0.0, 0.1882, 0.4353);
    }
    col += texel;
    nextTexel = col;
}