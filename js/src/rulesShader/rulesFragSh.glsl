#version 300 es
precision highp float;

// R: Occupation
// G: Heading
// B: Acceleration 
// A: Age
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

vec4 prepareCursor(float radius) {
    // normalize moues position
    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;

    vec4 cursor = vec4(0.0);
    // show the mouse position
    if (distance(gl_FragCoord.xy, mouse * uResolution) < radius) {
        if (mouseClick == 1.0) {
            cursor = vec4(1.0, 1.0, 1.0, 1.0);
        }
    }
    return cursor;
}

void main() {
    vec4 cursor = prepareCursor(6.0);
    vec2 texCoord = vTexCoord;

    if (uTime <= 1.0) {
        vec4 tex = texture(uSampler, texCoord);
        float r = randomNum();
        nextTexel = vec4(r, randomAngle(), tex.b, tex.a);
        return;
    }
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
    // newPos = wrapCoords(newPos, uResolution);

    // Read the state of the new position
    vec4 newTexel = texture(uSampler, newPos);

    // Determine the next state
    float nextOccupation = newTexel.r;
    float nextHeading = heading;
    float nextAcceleration = acceleration;
    float nextAge = age + 1.0;

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
            nextHeading += 180.0;
        } else if (nextHeading >= 180.0) {
            nextHeading -= 180.0;
        }
    }
    
    /*[Sensory stage]*/
    //Sample trail map values
    vec4 FL = texture(uSampler, texCoord + vec2(cos(heading + uAngle), sin(heading + uAngle)));
    vec4 F = texture(uSampler, texCoord + direction);
    vec4 FR = texture(uSampler, texCoord + vec2(cos(heading - uAngle), sin(heading - uAngle)));
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
    if (nextOccupation > FL.r) {
        // Stay facing same direction
    } else if (nextOccupation < FL.r) {
        // Rotate randomly left or right by RA
        nextHeading += randomSign() * uAngle;
    } else if (FL.r < FR.r) {
        // Rotate right by RA
        nextHeading += uAngle;
    } else if (FR.r < FL.r) {
        // Rotate left by RA
        nextHeading -= uAngle;
    } else {
        // Continue facing same direction
    }

    // Output the next state
    // clamp nextHeading to 0-360
    nextHeading = mod(nextHeading, 360.0);
    // return acceleration as difference between current and next heading
    nextAcceleration = nextHeading - heading;
    nextTexel = vec4(nextOccupation, nextHeading, nextAcceleration, nextAge)-cursor;
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