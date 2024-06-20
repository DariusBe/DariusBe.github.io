uniform vec4 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec3 color = vec3(0.0);

    // at cursor, draw a cross
    if (abs(gl_FragCoord.x - u_mouse.x) < 1.0 || abs(gl_FragCoord.y - u_mouse.y) < 1.0) {
        color = vec3(0.3, 0.0, 0.0);
    }

    gl_FragColor = vec4(color, 1.0);
}