#version 300 es
precision mediump float;

in vec2 vTexCoord;

uniform sampler2D uParticleTexture;

out vec4 fragColor;

void main() {
    vec4 particle = texture(uParticleTexture, vTexCoord);
    if (particle.r < 0.01) {
        fragColor = vec4(0.98f, 0.98f, 0.98f, 1.0f); // Render occupied particles as red
    } else {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0); // Render empty space as black
    }
    vec4(particle.r, particle.g, particle.b, 1.0);
    // fragColor = vec4(particle.r, particle.g, particle.b, 1.0);
}