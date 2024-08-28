#version 300 es
precision mediump float;

in vec2 vTexCoord;
in vec4 vParticleCoord;

uniform vec3 uMouse;
uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uSampler;

uniform float uParticleCount;
uniform float uDistance;
uniform float uAngle;

out vec4 nextTexel;

// Use texture to store:
// r: state
// g: age
// b: acceleration
// a: rotation in degrees

float randomNumber() {
    return fract(sin(uTime) * 43758.5453123);
}

float randomNumber0to32(float seed) {
    return randomNumber() * 32.0;
}

float randomAngleIn45DegreeIncrements(float seed) {
    return randomNumber() * 8.0 * 3.14159;
}

vec2 angleToVec(float angle) {
    return vec2(cos(angle), sin(angle));
}

vec2 pixelToCoord(vec2 pixel) {
    return pixel / uResolution;
}

vec2 offsetAngle(float offset) {
    return vec2(cos(uAngle + offset), sin(uAngle + offset));
}

vec2 rotateVec2(vec2 vec, float angle) {
    float radians = radians(angle);
    float cosAngle = cos(radians);
    float sinAngle = sin(radians);
    return round(vec2(vec.x * cosAngle - vec.y * sinAngle, vec.x * sinAngle + vec.y * cosAngle));
}


void main() {
    //globals
    float texWidth = uResolution.x;
    float texHeight = uResolution.y;
    // normalized frag coord position
    vec2 fragCoord = vec2(gl_FragCoord.x, gl_FragCoord.y);

    vec2 offset_front = vec2(0.0, uAngle);
    vec2 sensor_left = vec2(-12.0, 0.0);
    vec2 sensor_right = vec2(10.0, 0.0);

    offset_front = rotateVec2(offset_front, 45.0);

    vec4 currentTexel = texture(uSampler, vTexCoord);

    vec2 st = vTexCoord + offset_front / uResolution;
    vec2 texelCoord = vec2(gl_FragCoord);
    vec3 col = vec3(1.0, 1.0, 1.0);
    

    // // Get the neighboring texels
    // vec4 top = texture(uSampler, vTexCoord + vec2(0.0, 1.0) / uResolution);
    // vec4 bottom = texture(uSampler, vTexCoord + vec2(0.0, -1.0) / uResolution);
    // vec4 left = texture(uSampler, vTexCoord + vec2(-1.0, 0.0) / uResolution);
    // vec4 right = texture(uSampler, vTexCoord + vec2(1.0, 0.0) / uResolution);
    // vec4 topLeft = texture(uSampler, vTexCoord + vec2(-1.0, 1.0) / uResolution);
    // vec4 topRight = texture(uSampler, vTexCoord + vec2(1.0, 1.0) / uResolution);
    // vec4 bottomLeft = texture(uSampler, vTexCoord + vec2(-1.0, -1.0) / uResolution);
    // vec4 bottomRight = texture(uSampler, vTexCoord + vec2(1.0, -1.0) / uResolution);
    
    // // Count the number of live neighbors
    // int liveNeighbors = int(top.r + top.g + top.b + bottom.r + bottom.g + bottom.b + left.r + left.g + left.b + right.r + right.g + right.b + topLeft.r + topLeft.g + topLeft.b + topRight.r + topRight.g + topRight.b + bottomLeft.r + bottomLeft.g + bottomLeft.b + bottomRight.r + bottomRight.g + bottomRight.b);
    
    // // Apply the rules of Conway's Game of Life
    // vec4 col = vec4(0.0);
    // if (currentTexel.r > 0.5) {
    //     if (liveNeighbors < 2 || liveNeighbors > 3) {
    //         currentTexel = vec4(0.0);
    //     } else {
    //         currentTexel = vec4(1.0);
    //     }
    // } else {
    //     if (liveNeighbors == 3) {
    //         currentTexel = vec4(1.0);
    //     }
    // }
    if (currentTexel.r > 0.9) {
        col = vec3(0.0, 0.0, 0.0);
    } else {
        col = vec3(1.0, 1.0, 1.0);
    }

    int top_fill = int(texture(uSampler, st).r);

    if (top_fill > 0) {
        col = vec3(1.0, 1.0, 1.0);
    }

    // draw black border around the screen
    if (texelCoord.x < 1.0 || texelCoord.x > texWidth - 1.0 || texelCoord.y < 1.0 || texelCoord.y > texHeight - 1.0) {
        col = vec3(1.0, 0.0, 0.0);
    }

    nextTexel = vec4(col, 1.0);
}