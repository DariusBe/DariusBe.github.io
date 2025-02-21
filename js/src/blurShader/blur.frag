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
uniform float uAttenuation;
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
    // convolution fall-off via attenuation
    blurred.rgb *= 0.99;

    fragColor = vec4(blurred.rgb, 1.0);

    if (true) {
        vec2 mouse = uMouse.xy;
        float mouseClick = uMouse.z;

        vec4 cursor = vec4(0.0);
        // show the mouse position
        float p1 = distance(vec2(0.5, 0.7) * uResolution, gl_FragCoord.xy);
        float radius1 = 10.0;
        float p2 = distance(vec2(0.5, 0.3) * uResolution, gl_FragCoord.xy);
        float radius2 = 10.0;

        float factor = 1.0;
        if (p1 < radius1) {
            fragColor = vec4(1.0f);
        } else if (p2 < radius2) {
            fragColor = vec4(1.0f);
        }
    }
}
