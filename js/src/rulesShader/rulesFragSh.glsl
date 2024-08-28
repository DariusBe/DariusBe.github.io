#version 300 es
precision mediump float;

in vec2 vTexCoord;

uniform sampler2D uSampler;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uMouse;
uniform float uAngle;
uniform float uDistance;

out vec4 nextTexel;

// Function to wrap coordinates
vec2 wrapCoords(vec2 coord, vec2 resolution) {
    return mod(coord + resolution, resolution);
}

float randomNum() {
    // random number from uv
    float seed = dot(gl_FragCoord.xy/uTime, vec2(12.9898, 78.233));
    // further randomize seed
    return seed = fract(sin(seed*sin(uTime)) * 43758.5453);
}

// cointoss for -1 or 1
float randomSign() {
    float seed = randomNum();
    return sign(seed - 0.5);
}

float randomAngle() {
    return float(int(randomNum()*16.0))*uAngle;
}

vec4 prepareCursor() {
    // normalize moues position
    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;

    vec4 cursor = vec4(0.0);
    // show the mouse position
    if (distance(gl_FragCoord.xy, mouse * uResolution) < 5.0) {
        if (mouseClick == 1.0) {
            cursor = vec4(1.0, 1.0, 1.0, 1.0);
        }
    }
    return cursor;
}

void main() {
    vec4 cursor = prepareCursor();

    vec2 texCoord = vTexCoord;
    vec4 lastTexel = texture(uSampler, texCoord);
    vec4 currentTexel = texture(uSampler, texCoord);

    // { occupation, heading, acceleration, age }
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
        nextHeading += randomSign()*randomAngle(); // Simple example: reverse direction
    }

    // Output the next state
    nextTexel = vec4(nextOccupation, nextHeading,1.5, randomAngle())+cursor;
}