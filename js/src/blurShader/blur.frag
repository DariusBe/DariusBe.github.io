#version 300 es
//#pragma vscode_glsllint_stage : frag
// precision highp sampler2D;
precision mediump float;

// texture data
in vec2 vTexCoord;
uniform sampler2D uSampler; // texture unit 0

layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    mat4 uModel;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};

// uniform float uTime;
// uniform vec3 uMouse;
// uniform bool uShowCursor;
// uniform vec2 uResolution;
uniform int uKernelSize;
uniform float uKernel[64];
uniform bool uIsHorizontal;

out vec4 fragColor;

vec4 prepareCursor(float radius, vec4 color) {
    // normalize moues position
    if (uShowCursor == 0.0) {
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
}

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

    if (uShowCursor == 1.0) {
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
