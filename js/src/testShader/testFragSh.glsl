#version 300 es
precision mediump float;

uniform vec3 uMouse;
uniform float uTime;
uniform vec2 uResolution;

out vec4 fragColor;

void main() {
    
    uTime;

    vec3 color = vec3(1.0, 0.0, 0.0);
    // show the mouse position
    if (distance(gl_FragCoord.xy, uMouse.xy) < 10.0) {
        color = vec3(0.0, 0.0, 0.0);
    }
    fragColor = vec4(color, 1.0);
}

