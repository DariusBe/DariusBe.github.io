#version 300 es
precision mediump float;
#define PI 3.14159265359

// R: Occupation
// G: Heading
// B: Acceleration
// A: Age
in vec2 vTexCoord;

layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    mat4 uModel;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};

uniform sampler2D uSampler;
uniform float uSensorAngle;
uniform float uSensorDistance;

out vec4 nextTexel;

// Function to wrap coordinates
vec2 wrapCoords(vec2 coord, vec2 resolution) {
    return mod(coord + resolution, resolution);
}

float randomNum() {
    // random number from uv
    float seed = dot(gl_FragCoord.xy / uTime, vec2(12.9898, 78.233));
    // further randomize seed
    return fract(sin(seed * sin(uTime)) * 43758.5453);
}

// cointoss for -1 or 1
float randomSign() {
    float seed = randomNum();
    return sign(seed - 0.5);
}

float randomAngle() {
    return float(int(randomNum() * PI * 2.0));
}

vec4 prepareCursor(float radius, vec4 color) {
    // normalize moues position
    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;

    vec4 cursor = vec4(0.0);
    // show the mouse position
    if (distance(gl_FragCoord.xy, mouse * uResolution) < radius) {
        if (mouseClick == 1.0) {
            cursor = color;
        }
    }
    return cursor;
}

void main() {
    vec4 cursor = prepareCursor(60.0, vec4(0.4471, 0.4471, 0.4471, 0.5));
    vec2 texCoord = vTexCoord;

    // if (uTime <= 0.5) {
    //     vec4 tex = texture(uSampler, texCoord);
    //     float r = randomNum();
    //     nextTexel = vec4(r, randomAngle(), tex.b, tex.a);
    //     return;
    // }
    vec4 currentTexel = texture(uSampler, texCoord);

    /*
        R          G         B          A
    occupation, heading, acceleration, age
    */
    float occupation = currentTexel.r;
    float heading = currentTexel.g;
    float acceleration = currentTexel.b;
    float age = currentTexel.a;

    // Calculate new position based on heading and acceleration
    vec2 direction = vec2(cos(heading), sin(heading));
    vec2 newPos = texCoord + direction / uResolution;

    // Wrap coordinates to stay within texture bounds
    // newPos = wrapCoords(newPos, uResolution);

    // Read the state of the new position
    vec4 newTexel = texture(uSampler, newPos);

    // Determine the next state
    float nextOccupation = newTexel.r;
    float nextHeading = heading;
    float nextAcceleration = acceleration;
    float nextAge = uTime;

    /* [Motor stage]
        - Attempt move forwards in current direction
        - If (moved forwards successfully):
            Deposit trail in new location
        - Else:
            Choose random new orientation
        */
    if (nextOccupation <= 0.0) {
        // Deposit trail in new location
        nextOccupation = 1.0;
    } else {
        // Choose random new orientation
        nextHeading = randomAngle();
        if (nextHeading < 0.0) {
            nextHeading += PI/4.;
        } else if (nextHeading >= PI) {
            nextHeading -= PI/4.;
        }
    }

    /*[Sensory stage]*/
    //Sample trail map values
    if (texCoord.x + direction.x > 1.0 || texCoord.x + direction.x < 0.0 || texCoord.y + direction.y > 1.0 || texCoord.y + direction.y < 0.0) {
        // invert heading if out of bounds
        heading = -heading;
    }

    vec2 offsetFL = vec2(cos(heading + uSensorAngle), sin(heading + uSensorAngle));
    vec2 offsetFR = vec2(cos(heading - uSensorAngle), sin(heading - uSensorAngle));

    vec4 FL = texelFetch(uSampler, ivec2(texCoord + offsetFL), 0);
    vec4 F = texelFetch(uSampler, ivec2(texCoord + direction), 0);
    vec4 FR = texelFetch(uSampler, ivec2(texCoord + offsetFR), 0);
    /*
        - if (F > FL) && (F > FR):
            Stay facing same direction
            Return
        - Else if (F < FL) && (F < FR):
            Rotate randomly left or right by RA
        - Else if (FL < FR):
            Rotate right by RA
        - Else if (FR < FL):
            Rotate left by RA
        - Else:
            Continue facing same direction
        */
    if (F.r > FL.r && F.r > FR.r) {
        // Stay facing same direction
    }
    else if (F.r < FL.r && F.r < FR.r) {
        // Rotate randomly left or right by RA
        nextHeading += randomAngle();
    }
    else if (FL.r < FR.r) {
        // Rotate right by RA
        nextHeading += uSensorAngle;
    }
    else if (FR.r < FL.r) {
        // Rotate left by RA
        nextHeading -= uSensorAngle;
    }
    else {

    }
    // if (nextOccupation > FL.r) {
    //     // Stay facing same direction
    // } else if (nextOccupation < FL.r) {
    //     // Rotate randomly left or right by RA
    //     nextHeading = heading;
    // } else if (FL.r < FR.r) {
    //     // Rotate right by RA
    //     nextHeading += uSensorAngle;
    // } else if (FR.r < FL.r) {
    //     // Rotate left by RA
    //     nextHeading -= uSensorAngle;
    // } else {
    //     // Continue facing same direction
    // }

    // Output the next state
    // clamp nextHeading to 0-360
    // nextHeading = mod(nextHeading, 360.0);
    // return acceleration as difference between current and next heading
    nextAcceleration = nextHeading - heading;
    nextTexel = vec4(nextOccupation, nextHeading, nextAcceleration, nextAge) - cursor;
}

/*
[Motor stage]
- Attempt move forwards in current direction
- If (moved forwards successfully):
    Deposit trail in new location
- Else:
    Choose random new orientation

[Sensory stage]
- Sample trail map values
- if (F > FL) && (F > FR):
    Stay facing same direction
    Return
- Else if (F < FL) && (F < FR):
    Rotate randomly left or right by RA
- Else if (FL < FR):
    Rotate right by RA
- Else if (FR < FL):
    Rotate left by RA
- Else:
    Continue facing same direction
*/
