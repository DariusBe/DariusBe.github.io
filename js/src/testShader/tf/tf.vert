#version 300 es

layout(location = 0) in vec2 aPoints;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uMouse;

out vec2 vPoints;

vec2 randomize(vec2 vec) {
    float random =  fract(sin(uTime+12397.1237)*cos(17263.0+uTime));
    return vec2(random * vec.x, random * vec.y);
}

void main() {
    float t = uTime*10.;
    vec2 pos = aPoints;
    gl_Position = vec4(pos, 0.0, 0.0);
    vPoints = aPoints;
}