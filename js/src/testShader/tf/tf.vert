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
uniform float uParticleCount;
uniform float uSensorAngle; // 22.5 degrees
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

float randomSign() {
    return sign(random(uTime * float(gl_VertexID)) - 0.5);
}

void main() {
    gl_PointSize = 1.0;
    vec2 texelSize = 1.0 / uResolution;

    float sensorDistance = 8.0;
    float sensorAngle = PI / 8.0;

    vec2 pos = aParticle.xy;
    float heading = aParticle.z;
    float deposition = 0.0;

    // normalize pos -1 to 1 -> 0 to 1
    vec2 pixelPos = vec2((pos.x * 0.5 + 0.5) * uResolution.x, (pos.y * 0.5 + 0.5) * uResolution.y);
    // texel ahead
    ivec2 lookAheadOffset = ivec2(
            pixelPos.x + cos(heading) * gl_PointSize * 5.0,
            pixelPos.y + sin(heading) * gl_PointSize * 5.0
        );
    vec2 lookAhead = vec2(cos(heading), sin(heading)) * uResolution;
    vec4 lookAheadTexel = texelFetch(uParticleSampler, lookAheadOffset, 0);

    // if texel ahead is empty, move forward
    if (lookAheadTexel.r >= 0.8) {
        heading += randomSign() * random(float(sin(uTime * aParticle.w*12387.0)));
    } else {
        // choose random new heading
        // go ahead
        pos += vec2(cos(heading), sin(heading)) * texelSize;
        deposition = 1.0;
    }

    // // Sensor Offsets
    vec2 F_Offset = vec2(cos(heading), sin(heading)) * sensorDistance;
    vec2 FL_Offset = vec2(cos(heading + sensorAngle), sin(heading + sensorAngle)) * sensorDistance;
    vec2 FR_Offset = vec2(cos(heading - sensorAngle), sin(heading - sensorAngle)) * sensorDistance;

    // Sensors
    vec4 F = texelFetch(uParticleSampler, ivec2(pixelPos + F_Offset), 0);
    vec4 FL = texelFetch(uParticleSampler, ivec2(pixelPos + FL_Offset), 0);
    vec4 FR = texelFetch(uParticleSampler, ivec2(pixelPos + FR_Offset), 0);

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
        heading = aParticle.z;
        // Return;
    } else if ((F_val < FL_val) && (F_val < FR_val)) {
        // Rotate randomly by RA
        heading += randomSign() * sensorAngle;
    } else if (FL_val < FR_val) {
        // Rotate right by RA
        heading -= sensorAngle;
    } else if (FR_val < FL_val) {
        // Rotate left by RA
        heading += sensorAngle;
    } else {
        // Continue facing same direction
    }

    // keep in bounds
    float bound = 0.95;
    if (pos.x < -bound || pos.x > bound || pos.y < -bound || pos.y > bound) {
        heading += PI;
        pos.x = clamp(pos.x, -bound, bound);
        pos.y = clamp(pos.y, -bound, bound);
    }

    // keep in bounds

    // float stepWidth = texelSize.x * 0.1;

    // vec2 pos = aParticle.xy;
    // // normalize mouse position for -0.5 to 0.5
    // vec2 mouse = uMouse.xy - 0.5;
    // float mouseDown = uMouse.z;

    // float heading = aParticle.z;

    // //normalize pos
    // vec2 normPos = pos + vec2(0.5, 0.5);

    // ivec2 sensorDistanceVec = ivec2(cos(heading) * uSensorDistance, sin(heading) * uSensorDistance);
    // vec4 particleTexel = texelFetch(uParticleSampler, ivec2(normPos * uResolution) + sensorDistanceVec, 0);
    // vec4 cost = texture(uCostSampler, normPos);

    // float dampingFactor = 10.0;

    // if ((particleTexel.r + particleTexel.g + particleTexel.b) > 0.5) {
    //     heading += random(uTime * float(gl_VertexID));
    // }

    // // cost map at current position ()
    // vec4 costTexel = texelFetch(uCostSampler, ivec2(normPos) + sensorDistanceVec, 0);

    // if (costTexel.g < 0.5 || costTexel.b < 0.5) {
    //     heading += randomSign() * uSensorAngle;
    //     pos.x += cos(heading) * stepWidth * dampingFactor;
    //     pos.y += sin(heading) * stepWidth * dampingFactor;
    // } else {
    //     pos.x += cos(heading) * stepWidth;
    //     pos.y += sin(heading) * stepWidth;
    // }

    // if (mouseDown == 1.0) {
    //     if (distance(pos, mouse) < 0.5) {
    //         pos.xy = mouse + randomize(vec2(0.01, 0.01));
    //     }
    // }
    // pos += vec2(cos(heading), sin(heading)) * texelSize;

    // round pos to match texel

    vParticle = vec4(pos, mod(heading, PI * 2.0), deposition);
    gl_Position = vec4(pos, 0.0, 1.0);
    // vParticle.xy = pos.xy * uResolution; //+ vec2(sin(uTime)*0.005, cos(uTime)*0.005);

    vPosition = aPosition;
    vTexCoord = aTexCoord;
    // gl_Position = vec4(pos.xy, 1.0, 1.0);
}
