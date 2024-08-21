#version 300 es
precision mediump float;

in vec2 vTexCoord;

uniform vec3 uMouse;
uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uSampler;

out vec4 nextTexel;

void main() {
    // conways game of life
    ivec2 texelCoord = ivec2(gl_FragCoord.xy);
    vec4 currentTexel = texture(uSampler, vTexCoord);
    
    // Get the neighboring texels
    vec4 top = texture(uSampler, vTexCoord + vec2(0.0, 1.0) / uResolution);
    vec4 bottom = texture(uSampler, vTexCoord + vec2(0.0, -1.0) / uResolution);
    vec4 left = texture(uSampler, vTexCoord + vec2(-1.0, 0.0) / uResolution);
    vec4 right = texture(uSampler, vTexCoord + vec2(1.0, 0.0) / uResolution);
    vec4 topLeft = texture(uSampler, vTexCoord + vec2(-1.0, 1.0) / uResolution);
    vec4 topRight = texture(uSampler, vTexCoord + vec2(1.0, 1.0) / uResolution);
    vec4 bottomLeft = texture(uSampler, vTexCoord + vec2(-1.0, -1.0) / uResolution);
    vec4 bottomRight = texture(uSampler, vTexCoord + vec2(1.0, -1.0) / uResolution);
    
    // Count the number of live neighbors
    int liveNeighbors = int(top.r + top.g + top.b + bottom.r + bottom.g + bottom.b + left.r + left.g + left.b + right.r + right.g + right.b + topLeft.r + topLeft.g + topLeft.b + topRight.r + topRight.g + topRight.b + bottomLeft.r + bottomLeft.g + bottomLeft.b + bottomRight.r + bottomRight.g + bottomRight.b);
    
    // Apply the rules of Conway's Game of Life
    vec4 col = vec4(0.0);
    if (currentTexel.r > 0.5) {
        if (liveNeighbors < 2 || liveNeighbors > 3) {
            col = vec4(0.0);
        } else {
            col = vec4(1.0);
        }
    } else {
        if (liveNeighbors == 3) {
            col = vec4(1.0);
        }
    }
    nextTexel = col;
}