#version 300 es
precision mediump float;

in vec2 vTexCoord;

uniform sampler2D uSampler;
uniform sampler2D uTopoSampler;

// uniform binding index = 0
layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    mat4 uModel;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};

out vec4 fragColor;

vec4 prepareCursor(float radius, vec4 color) {
    // normalize moues position
    if (uShowCursor == 1.0) {
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
    } else {
        return vec4(0.0);
    }
}

void main() {
    vec4 cursor = prepareCursor(15.0, vec4(0.4471, 0.4471, 0.4471, 0.5));
    
    vec4 particle_tex = texture(uSampler, vTexCoord);
    vec4 topo_tex = texture(uTopoSampler, vTexCoord);


    // if (particle_tex.r > 0.1) {
    //     particle_tex = vec4(1.0, 1.0, 1.0, 1.0);
    // }  else {
    //     particle_tex = vec4(0.0, 0.0, 0.0, 1.0);
    // }
    fragColor = topo_tex - particle_tex + cursor;
}
