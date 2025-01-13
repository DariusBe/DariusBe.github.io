#version 300 es
precision highp float;

in vec2 vTexCoord;

uniform sampler2D uSampler;

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

void main() {
    vec4 tex = texture(uSampler, vTexCoord);
    vec2 pos = vec2(tex.r, tex.g);
    pos.x = pos.x/2.0 + 0.5;
    pos.y = pos.y/2.0 + 0.5;
    float heading = tex.b;
    float speed = tex.a;
    // tex.r = x, tex.g = y, tex.b = heading, tex.a = speed
    // where tex.xy is the position of the particle
    // start by checking if the particle is located at current fragment
    
    if (distance(vTexCoord, pos) < 0.2) {
        // draw the particle
        fragColor = vec4(0.0f, 0.0f, 0.0f, 1.0f);
    } else {
        fragColor = vec4(1.0f, 1.0f, 1.0f, 1.0f);
    }
    

    
}