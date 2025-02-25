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
    if(uShowCursor == 0.0f) {
        vec2 mouse = uMouse.xy;
        float mouseClick = uMouse.z;

        vec4 cursor = vec4(0.0f);
        // show the mouse position
        if(distance(gl_FragCoord.xy, mouse * uResolution) < radius) {
            if(mouseClick == 1.0f) {
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

vec4 applySimpleBoxFilter() {
    vec4 sum = vec4(0.0f);
    vec2 texelSize = 1.0f / uResolution;
    int range = uKernelSize / 2;
    for(int i = -range; i <= range; i++) {
        vec2 offset = vec2(0.0f, float(i) * texelSize);
        if(uIsHorizontal) {
            offset = offset.yx;
        }
        sum += texture(uSampler, vTexCoord + offset);
    }
    return sum / float(uKernelSize);
}

void main() {
    // float decay = uDecay * 0.00001;

    vec4 original = texture(uSampler, vTexCoord);
    vec4 blurred = original;
    if (uKernelSize >= 3) {
        blurred = applyKernel();
    }
    // convolution fall-off via attenuation
    blurred.rgb *= (1.0 - (uAttenuation));

    fragColor = vec4(blurred.rgb, 1.0f);

    // radius of half the screen width: if frag is not within this radius, fragColor is black
    vec2 radius = uResolution * 0.5f;
    if(distance(gl_FragCoord.xy, radius) > radius.x) {
        fragColor = vec4(0.0f);
    }

    if(true) {
        float p1 = distance(vec2(0.5f, 0.7f) * uResolution, gl_FragCoord.xy);
        float radius1 = 15.0f;
        float p2 = distance(vec2(0.5f, 0.3f) * uResolution, gl_FragCoord.xy);
        float radius2 = 15.0f;

        float factor = 1.0f;
        if(p1 < radius1) {
            fragColor = vec4(1.0f)*factor;
        } else if(p2 < radius2) {
            fragColor = vec4(1.0f)*factor;
        }
    }
}
