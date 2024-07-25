#version 300 es
precision mediump float;

uniform vec3 uMouse;
uniform float uTime;
uniform vec2 uResolution;

out vec4 fragColor;

void main() {
    
    uTime;
    vec2 uv = uResolution;
    // normalize moues position
    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;

    vec3 color = vec3(1.0, 0.0, 0.0);
    // show the mouse position
    if (distance(gl_FragCoord.xy, mouse * uv) < 10.0) {
        if (mouseClick == 1.0) {
            color = vec3(0.0, 0.0, 1.0);
        } else {
            color = vec3(0.0, 1.0, 0.0);
        }
    }

    fragColor = vec4(color, 1.0);
}

