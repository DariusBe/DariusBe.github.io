#version 300 es
//#pragma vscode_glsllint_stage : frag
precision highp float;

// texture data
in vec2 vTextureCoord;
uniform sampler2D uSampler; // texture unit 0

uniform float uTime;
uniform vec3 uMouse;
uniform vec2 uResolution;
uniform float uKernel[5];
uniform float uDecay;
/*
0: 0.054488684982061386
1: 0.24420134723186493
2: 0.40261995792388916
3: 0.24420134723186493
4: 0.054488684982061386
*/

out vec4 fragColor;

vec4 applyKernel(sampler2D sampler, vec2 texCoord, float kernel[5]) {
    vec4 sum = vec4(0.0);
    vec2 texelSize = 1.0 / uResolution;
    for (int i = 0; i < 5; i++) {
        for (int j = 0; j < 5; j++) {
            vec2 offset = vec2(float(i - 2), float(j - 2)) * texelSize;
            sum += texture(sampler, texCoord + offset) * kernel[i] * kernel[j];
        }
    }
    return sum;
}

void main() {
    float decay = uDecay * 0.00001;
    vec4 blurred = applyKernel(uSampler, vTextureCoord, uKernel);
    vec4 original = texture(uSampler, vTextureCoord);
    // softly combine the original and blurred image
    float r_combined = mix(original.r, blurred.r, decay);

    fragColor = vec4(r_combined, original.g, original.b, original.a);
}

