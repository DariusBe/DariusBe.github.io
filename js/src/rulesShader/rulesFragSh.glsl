#version 300 es
precision mediump float;

in vec2 vTexCoord;

uniform vec3 uMouse;
uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uSampler;

out vec4 fragColor;

void main() {
    float t = uTime;
    vec2 uv = uResolution;
    // normalize moues position
    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;

    vec3 points = texture(uSampler, vTexCoord).rgb;
    float currentState = texelFetch(uSampler, ivec2(gl_FragCoord.xy), 0).r;
    if (currentState < 0.01) {
        points = vec3(1.0, 1.0, 1.0);
    } else {
        // background color @TODO: replace with terrain texture?
        points = vec3(0.0, 0.0, 0.0);
    }

    fragColor = vec4(points, 1.0);
}

