uniform vec4 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;
uniform int u_population;
uniform vec2 u_points[100];

// Function to calculate color based on mouse position
vec3 cursorIndicator() {
    if (abs(gl_FragCoord.x - u_mouse.x) < 1.0 || abs(gl_FragCoord.y - u_mouse.y) < 1.0) {
        return vec3(0.3, 0.3, 0.3);
    }
    return vec3(0.0);
}

void main() {
    vec2 mouse = u_mouse.xy / u_resolution.xy;


    vec3 color = cursorIndicator();

    for (int i = 1; i < u_population; i++) {
        vec2 point = u_points[i];
            float dist = distance(gl_FragCoord.xy, point);
        if (dist < 3.0) {
            color = vec3(1.0, 1.0, 1.0);
        }
    }

    gl_FragColor = vec4(color, 1.0);
}