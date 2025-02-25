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

vec4 getInstanceOffset(int instanceID, vec4 offset) {
    if(instanceID == 0)
        return offset + vec4(0.0f, 0.1f, 0.0f, 1.0f);
    if(instanceID == 1)
        return offset + vec4(0.0f, -0.1f, 0.0f, 1.0f);
    if(instanceID == 2)
        return offset + vec4(0.1f, 0.0f, 0.0f, 1.0f);
    return offset; // Default, no offset
}

vec2 randomize(vec2 vec) {
    float random = fract(sin(uTime + 12397.1237f) * cos(17263.0f + uTime));
    return vec2(random * vec.x, random * vec.y);
}

float random(float seed) {
    return fract(sin(seed * 12397.1237f) * cos(17263.0f + seed));
}

float randomSign(float seed) {
    return random(seed) > 0.5f ? 1.0f : -1.0f;
}

void main() {
    bool simulationStage = uStage;

    gl_PointSize = 1.0f;
    vec2 texelSize = 1.0f / uResolution;
    float bound = 1.0f;
    float deposition = 0.0f;


    vec2 pos = aParticle.xy;
    float heading = aParticle.z;
    float seed = aParticle.w * 12397.1237f;

    // normalize pos -1 to 1 -> (0, 0, 500, 583)
    vec2 pixelPos = vec2((pos.x * 0.5f + 0.5f), (pos.y * 0.5f + 0.5f)) * uResolution;

    // radius of half the screen width: if frag is not within this radius, fragColor is black
    // vec2 radius = uResolution * 0.5f;
    // if(distance(pixelPos.xy, radius) >= radius.x) {
    //     heading += PI;
    // }

    /* MOTOR STAGE */
    // texel ahead
    ivec2 lookAheadOffset = ivec2(pixelPos.x + cos(heading), pixelPos.y + sin(heading));
    vec2 lookAhead = vec2(cos(heading), sin(heading)) * uResolution;
    vec4 lookAheadTexel = texelFetch(uParticleSampler, lookAheadOffset, 0);
    float lookAheadVal = lookAheadTexel.r;

    // if texel ahead is occupied, choose random new heading
    if(lookAheadVal >= 0.8f) {
        heading += randomSign(seed) * random(seed * 12376.1123f) * PI;
    } else {
        pos += vec2(cos(heading) * texelSize.x, sin(heading) * texelSize.y) * 8.0f;
        deposition = 1.0f;
    }

    /* SENSORY STAGE */
    // Sensor Offsets
    ivec2 F_Offset = ivec2(pixelPos.x + uSensorDistance * cos(heading), pixelPos.y + uSensorDistance * sin(heading));
    ivec2 FL_Offset = ivec2(pixelPos.x + uSensorDistance * cos(heading + uSensorAngle), pixelPos.y + uSensorDistance * sin(heading + uSensorAngle));
    ivec2 FR_Offset = ivec2(pixelPos.x + uSensorDistance * cos(heading - uSensorAngle), pixelPos.y + uSensorDistance * sin(heading - uSensorAngle));

    // Sensors
    vec4 F = texelFetch(uParticleSampler, ivec2(F_Offset), 0);
    vec4 FL = texelFetch(uParticleSampler, ivec2(FL_Offset), 0);
    vec4 FR = texelFetch(uParticleSampler, ivec2(FR_Offset), 0);

    float F_val = F.r;
    float FL_val = FL.r;
    float FR_val = FR.r;

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
    if((F_val > FL_val) && (F_val > FR_val)) {
        // Stay facing same direction
        heading = aParticle.z;
        // Return;
    } else if((F_val < FL_val) && (F_val < FR_val)) {
        // Rotate randomly by RA
        heading += randomSign(seed + 12.1725f) * uRotationAngle;
    } else if(FL_val < FR_val) {
        // Rotate right by RA
        heading -= uRotationAngle;
    } else if(FR_val < FL_val) {
        // Rotate left by RA
        heading += uRotationAngle;
    } else {
        // Continue facing same direction
        heading = aParticle.z;
    }

    if(pos.x > bound) {
        pos.x = -bound;
    } else if(pos.x < -bound) {
        pos.x = bound;
    }

    if(gl_InstanceID == 0) {
        vParticle = vec4(pos, mod(heading, PI * 2.0f), deposition);
        gl_Position = vec4(pos, 0.0f, 1.0f);
        vTexCoord = aTexCoord;
        vPosition = aPosition;
    }
}
