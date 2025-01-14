#version 300 es
precision highp float;

in vec2 vTexCoord;

uniform sampler2D uCanvasSampler1;
uniform sampler2D uCanvasSampler2;
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
    // size of one texel:
    float texelSize = 1.0 / uResolution.x;

    vec4 tex = texture(uCanvasSampler1, vTexCoord);
    vec2 pos = vec2(tex.x, tex.y);
    float x = tex.r;
    float y = tex.g;
    float heading = tex.b;
    // tex.r = x, tex.g = y, tex.b = heading, tex.a = speed
    // where tex.xy is the position of the particle
    // start by checking if the particle is located at current fragment

    vec4 col = vec4(1.0, 1.0, 1.0, 1.0);
    // if the particle is located at the current fragment
    // if (abs(gl_FragCoord.x - x) < 150.0 && abs(gl_FragCoord.y - y) < 150.0) {
    //     col = vec4(0.0f, 0.0, 0.0, 0.0); // Paint the fragment black
    // }

    float dist = distance(vTexCoord, vec2(x, y));
    // Check if the distance is within the radius
    if (distance(pos, vTexCoord*uResolution) < 5.0) {
        col = vec4(0.0, 0.0, 0.0, 1.0);
    }
  

    vec4 black = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 white = vec4(1.0, 1.0, 1.0, 1.0);
    vec4 cost = texture(uCanvasSampler2, vTexCoord);
    fragColor = mix(black, cost, col);
}
