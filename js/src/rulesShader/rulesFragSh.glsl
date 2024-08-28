#version 300 es
precision mediump float;

in vec2 vTexCoord;

uniform sampler2D uSampler;
uniform vec2 uResolution;
uniform float uTime;
uniform float uAngle;

out vec4 nextTexel;

// Function to wrap coordinates
vec2 wrapCoords(vec2 coord, vec2 resolution) {
    return mod(coord + resolution, resolution);
}

// random number between 0-8
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
}

void main() {
    vec2 texCoord = vTexCoord;
    vec4 currentTexel = texture(uSampler, texCoord);

    float occupation = currentTexel.r;
    float heading = currentTexel.g;
    float acceleration = currentTexel.b;
    float age = currentTexel.a;

    // Calculate new position based on heading and acceleration
    vec2 direction = vec2(cos(heading), sin(heading));
    vec2 newPos = texCoord + direction * acceleration / uResolution;

    // Wrap coordinates to stay within texture bounds
    newPos = wrapCoords(newPos, uResolution);

    // Read the state of the new position
    vec4 newTexel = texture(uSampler, newPos);

    // Determine the next state
    float nextOccupation = newTexel.r;
    float nextHeading = heading;
    float nextAcceleration = acceleration;
    float nextAge = age + 1.0;

    // Handle collisions and maintain particle count
    if (nextOccupation > 0.0) {
        // Collision detected, handle it (e.g., change heading)
        nextHeading += radians(45.0); // Simple example: reverse direction
    }

    // Output the next state
    nextTexel = vec4(nextOccupation, min(180.0, nextHeading), nextAcceleration, nextAge);
}