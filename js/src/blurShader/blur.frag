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
        float distPoint1 = distance(vec2(0.15, 0.8) * uResolution, gl_FragCoord.xy);
        float radius1 = 25.0;
        float distPoint2 = distance(vec2(0.75, 0.1) * uResolution, gl_FragCoord.xy);
        float radius2 = 15.0;
        float distPoint3 = distance(vec2(0.15, 0.5) * uResolution, gl_FragCoord.xy);
        float radius3 = 35.0;
        float distPoint4 = distance(vec2(0.25, 0.2) * uResolution, gl_FragCoord.xy);
        float radius4 = 15.0;
        float distPoint5 = distance(vec2(0.75, 0.65) * uResolution, gl_FragCoord.xy);
        float radius5 = 25.0;

        float factor = 0.1;
        if (distPoint1 < radius1) {
            fragColor = vec4(1.0f, 0.0f, 0.0f, 1.0f)*(radius1*factor);
        } else if (distPoint2 < radius2) {
            fragColor = vec4(1.0f, 0.0f, 0.0f, 1.0f)*(radius2*factor);
        } else if (distPoint3 < radius3) {
            fragColor = vec4(1.0f, 0.0f, 0.0f, 1.0f)*(radius3*factor);
        } else if (distPoint4 < radius4) {
            fragColor = vec4(1.0f, 0.0f, 0.0f, 1.0f)*(radius4*factor);
        } else if (distPoint5 < radius5) {
            fragColor = vec4(1.0f, 0.0f, 0.0f, 1.0f)*(radius5*factor);
        }
    }
}
