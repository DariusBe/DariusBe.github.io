#version 300 es
precision mediump float;

in vec2 vTexCoord;

uniform sampler2D uParticleTexture;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uMouse;

out vec4 fragColor;

void main() {
    vec2 uv = uResolution;
    // normalize moues position
    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;

    vec4 cursor = vec4(0.0);
    // show the mouse position
    if (distance(gl_FragCoord.xy, mouse * uv) < 15.0) {
        if (mouseClick == 1.0) {
            cursor = vec4(0.4471, 0.4471, 0.4471, 0.5);
        } else {
            cursor = vec4(0.25);
        }
    }

    vec4 particle = texture(uParticleTexture, vTexCoord);
    if (particle.r < 0.005) {
        fragColor = vec4(0.1f); // Render occupied particles as red
    } else {
        fragColor = vec4(0.0f, 0.0f, 0.0f, 1.0f); // Render empty space as black
    }
    fragColor = fragColor - cursor;
}