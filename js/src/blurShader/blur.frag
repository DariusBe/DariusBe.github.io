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
    vec4 sum = vec4(0.0f);
    vec2 texelSize = 1.0f / uResolution;
    int range = uKernelSize / 2;
    for(int i = -range; i <= range; i++) {
        vec2 offset = vec2(0.0f, float(i) * texelSize);
        if(uIsHorizontal) {
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

float random(float seed) {
    return fract(sin(seed * 12397.1237f) * cos(17263.0f + seed));
}

float randomSign(float seed) {
    return random(seed) > 0.5f ? 1.0f : -1.0f;
}

void createCircles(int count, float radius, float bound, float factor, vec4 inputColor) {
    for(int i = 0; i < count; i++) {
        float seed = fract(uKernel[i]*19823.123898)*float(i+1);
        vec2 center = vec2(0.5f) * uResolution;
        float randomAngle = random(seed * 0.1234f) * 6.28318530718f;

        float x = center.x + cos(randomAngle) * bound * uResolution.x * random(fract(seed * 9.12736f));
        float y = center.y + sin(randomAngle) * bound * uResolution.y * random(fract(seed*11.987615));
        float p = distance(vec2(x, y), gl_FragCoord.xy);
        if(p < radius) {
            fragColor = vec4(1.0f);
        }
    }
}

void main() {
    // float decay = uDecay * 0.00001;

    vec4 original = texture(uSampler, vTexCoord);
    vec4 blurred = original;
    if(uKernelSize >= 3) {
        blurred = applyKernel();
    }
    // convolution fall-off via attenuation
    blurred.rgb *= (1.0f - (uAttenuation));

    fragColor = vec4(blurred.rgb, 1.0f);

    // radius of half the screen width: if frag is not within this radius, fragColor is black
    vec2 radius = uResolution * 0.5f;
    if(distance(gl_FragCoord.xy, radius) > radius.x) {
        fragColor = vec4(0.0f);
    }

    createCircles(8, 10.0f, 0.5f, 1.0f, fragColor);

    // fragColor = circles;

    if(false) {
        float p1 = distance(vec2(0.5f, 0.7f) * uResolution, gl_FragCoord.xy);
        float radius1 = 15.0f;
        float p2 = distance(vec2(0.5f, 0.3f) * uResolution, gl_FragCoord.xy);
        float radius2 = 15.0f;
        float p3 = distance(vec2(0.25f, 0.75f) * uResolution, gl_FragCoord.xy);
        float radius3 = 15.0f;
        float p4 = distance(vec2(0.75f, 0.5f) * uResolution, gl_FragCoord.xy);
        float radius4 = 15.0f;

        float factor = 1.0f;
        if(p1 < radius1) {
            fragColor = vec4(1.0f) * factor;
        } else if(p2 < radius2) {
            fragColor = vec4(1.0f) * factor;
        } else if(p3 < radius3) {
            fragColor = vec4(1.0f) * factor;
        } else if(p4 < radius4) {
            fragColor = vec4(1.0f) * factor;
        }
    }
}
