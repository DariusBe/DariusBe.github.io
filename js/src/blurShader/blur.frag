#version 300 es
//#pragma vscode_glsllint_stage : frag
precision highp sampler2D;
precision highp float;

// texture data
in vec2 vTexCoord;
uniform sampler2D uSampler; // texture unit 0

uniform float uTime;
uniform vec3 uMouse;
uniform bool uShowCursor;
uniform vec2 uResolution;
uniform int uKernelSize;
uniform float uKernel[64];
uniform bool uIsHorizontal;
uniform float uDecay;

out vec4 fragColor;

vec4 applyKernel() {
    vec4 sum = vec4(0.0);
    vec2 texelSize = 1.0 / uResolution;
    int range = uKernelSize / 2;
    for (int i = -range; i <= range; i++) {
        vec2 offset = vec2(0.0, float(i) * texelSize);
        if (uIsHorizontal) {
            offset = offset.yx;
        }
        sum += texture(uSampler, vTexCoord + offset) * uKernel[i + range];
    }
    return sum;
}

void main() {
    // float decay = uDecay * 0.00001;

    vec4 original = texture(uSampler, vTexCoord);
    vec4 blurred = original;
    if (uKernelSize >= 3) {
        blurred = applyKernel();
    }
    // softly combine the original and blurred image
    // float r_combined = mix(original.r, blurred.r, decay);

    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;
    float dist = smoothstep(80.0, 100.0, distance(gl_FragCoord.xy, mouse * uResolution));

    if (uShowCursor) {
        if (mouseClick == 1.0) {
            fragColor = mix(original, blurred, dist);
            if (dist > 0.9 && dist < 1.0) {
                fragColor = blurred;
                fragColor.w *= 0.9;
            }
        } else {
            fragColor = blurred;
        }
    } else {
        fragColor = blurred;
    }
}
