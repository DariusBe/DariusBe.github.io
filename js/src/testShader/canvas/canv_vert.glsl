#version 300 es

layout(location = 0) in vec2 aPosition;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uMouse;

out vec2 vPosition;

vec2 brownianMotion(vec2 pos, float time, float seed) {
    float angle = fract(sin(dot(pos.xy, vec2(12.9898, 78.233)) + seed) * 43758.5453) * 6.28318530718; // 2 * PI
    vec2 direction = vec2(cos(angle), sin(angle));
    float speed = 0.05; // Adjust the speed of the random walk as needed
    return pos + direction * speed * time;
}


void main() {
    vec2 mouse = (uMouse.xy-0.5)*2.0;
    vec2 pos = brownianMotion(aPosition, uTime, float(gl_VertexID));

    if (uMouse.z == 1.0) {
        vec2 direction = normalize(mouse - pos);
        float distance = length(mouse - pos);
        float forceStrength = 0.005; // Adjust the strength of the force as needed
        vec2 force = direction * forceStrength / distance;
        pos += force;
    }
    gl_PointSize = 2.0;
    gl_Position = vec4(pos, 0.0, 1.0);
    vPosition = vec2(0.0);
}