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
uniform float uKernel[100];
uniform float uDecay;

out vec4 fragColor;

vec4 applyKernel() {
    vec4 sum = vec4(0.0);
    vec2 texelSize = 1.0 / uResolution;
    for (int i = 0; i < uKernelSize; i++) {
        for (int j = 0; j < uKernelSize; j++) {
            int center = (uKernelSize - 1) / 2;
            vec2 offset = vec2(float(i - center), float(j - center)) * texelSize;
            sum += texture(uSampler, vTexCoord + offset) * uKernel[i] * uKernel[j];
        }
    }
    return sum;
}

void main() {
    float decay = uDecay * 0.00001;
    vec4 blurred = applyKernel();
    vec4 original = texture(uSampler, vTexCoord);
    // softly combine the original and blurred image
    // float r_combined = mix(original.r, blurred.r, decay);

    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;
    float dist = smoothstep(0.0, 50.0, distance(gl_FragCoord.xy, mouse*uResolution));

    if (uShowCursor) {
        if (mouseClick == 1.0) {
            fragColor = mix(original, blurred, dist);
            if (dist > 0.9 && dist < 1.0) {
                fragColor = blurred;
                fragColor.w *= 0.95;
            }
        } else {
            fragColor = blurred;
        }
    } else {
        fragColor = blurred;
    }
}

