#version 300 es
precision highp float;
#define PI 3.14159265359

// Attributes
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;
layout(location = 2) in vec4 aParticle;

// Uniforms
layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    mat4 uModel;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};
uniform sampler2D uParticleSampler; //texture unit 0
uniform sampler2D uCostSampler; //texture unit 1
uniform sampler2D uAdditionalSampler; //texture unit 2

uniform bool uStage;
uniform float uParticleCount;
uniform float uSensorAngle; // 22.5 degrees
uniform float uRotationAngle; // 45 degreess
uniform float uSensorDistance; // 8 pixels

out vec3 vPosition;
out vec2 vTexCoord;
out vec4 vParticle;

// texelSize

vec2 randomize(vec2 vec) {
    float random = fract(sin(uTime + 12397.1237) * cos(17263.0 + uTime));
    return vec2(random * vec.x, random * vec.y);
}

float random(float seed) {
    return fract(sin(seed * 12397.1237) * cos(17263.0 + seed));
}

float randomSign(float seed) {
    return random(seed) > 0.5 ? 1.0 : -1.0;
}

void main() {
    bool simulationStage = uStage;
    
    gl_PointSize = 1.0;
    vec2 texelSize = 1.0 / uResolution;
    float bound = 0.99;
    float deposition = 1.0;

    float sensorDistance = 50.0;
    float sensorAngle = PI / 8.0;
    float rotationAngle = PI / 4.0;

    vec2 pos = aParticle.xy;
    float heading = aParticle.z;
    float seed = aParticle.w * 12397.1237;


    // normalize pos -1 to 1 -> (0, 0, 500, 583)
    vec2 pixelPos = vec2((pos.x * 0.5 + 0.5), (pos.y * 0.5 + 0.5)) * uResolution;

    /* MOTOR STAGE */
    // texel ahead
    ivec2 lookAheadOffset = ivec2(
            pixelPos.x + cos(heading),
            pixelPos.y + sin(heading)
        );
    vec2 lookAhead = vec2(cos(heading), sin(heading)) * uResolution;
    vec4 lookAheadTexel = texelFetch(uParticleSampler, lookAheadOffset, 0);
    float lookAheadVal = lookAheadTexel.r + lookAheadTexel.g + lookAheadTexel.b;

    // if texel ahead is occupied, choose random new heading
    if (lookAheadVal != 3.0) {
        pos += vec2(cos(heading), sin(heading)) * texelSize * 5.0;
        deposition = 1.0;
    } else {
        heading += randomSign(seed) * random(seed * 12376.1236) * PI;
        deposition = 0.0;
    }

    /* SENSORY STAGE */
    // Sensor Offsets
    ivec2 F_Offset = ivec2(
            pixelPos.x + sensorDistance * cos(heading),
            pixelPos.y + sensorDistance * sin(heading)
        );
    ivec2 FL_Offset = ivec2(
            pixelPos.x + sensorDistance * cos(heading + sensorAngle),
            pixelPos.y + sensorDistance * sin(heading + sensorAngle)
        );
    ivec2 FR_Offset = ivec2(
            pixelPos.x + sensorDistance * cos(heading - sensorAngle),
            pixelPos.y + sensorDistance * sin(heading - sensorAngle)
        );

    // Sensors
    vec4 F = texelFetch(uParticleSampler, ivec2(F_Offset), 0);
    vec4 FL = texelFetch(uParticleSampler, ivec2(FL_Offset), 0);
    vec4 FR = texelFetch(uParticleSampler, ivec2(FR_Offset), 0);

    float F_val = F.r + F.g + F.b;
    float FL_val = FL.r + FL.g + FL.b;
    float FR_val = FR.r + FR.g + FR.b;

    /*
        - [Movement]
            - Attempt to move forward one pixel
            - If successful, move forward
                Deposit trail
            - Else
                Choose random new heading
        - [Sensory Behaviour]
            - Sample chemoattractant values from sensors
            If (F > FL) && (F > FR)
                - Stay facing same direction
                - Return
            - Else if (F < FL) && (F < FR)
                - Rotate randomly by RA
            - Else if (FL < FR)
                - Rotate right by RA
            - Else if (FR < FL)
                - Rotate left by RA
            - Else
                - Continue facing same direction
        Particle [PosX][PosY][Heading][ID]
    */

    // Attempt to move forward one pixel
    // (F > FL) && (F > FR)
    if ((F_val > FL_val) && (F_val > FR_val)) {
        // Stay facing same direction
        // heading = aParticle.z;
        // Return;
    } else if ((F_val < FL_val) && (F_val < FR_val)) {
        // Rotate randomly by RA
        heading += randomSign(seed + 6.18728) * rotationAngle;
    } else if (FL_val < FR_val) {
        // Rotate right by RA
        heading -= rotationAngle;
    } else if (FR_val < FL_val) {
        // Rotate left by RA
        heading += rotationAngle;
    } else {
        // Continue facing same direction
        // heading = aParticle.z;
    }

    // keep in bounds
    if (pos.x < -bound || pos.x > bound || pos.y < -bound || pos.y > bound) {
        heading += PI;
        deposition = 0.0;
        pos.x = clamp(pos.x, -bound, bound);
        pos.y = clamp(pos.y, -bound, bound);
    }

    vParticle = vec4(pos, mod(heading, PI * 2.0), deposition);
    gl_Position = vec4(pos, 0.0, 1.0);

    vPosition = aPosition;
    vTexCoord = aTexCoord;
}
