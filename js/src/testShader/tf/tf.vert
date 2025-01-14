#version 300 es
precision highp float;
#define PI 3.14159265359

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;
layout(location = 2) in vec4 aParticle;

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

vec2 randomize(vec2 vec) {
    float random = fract(sin(uTime + 12397.1237) * cos(17263.0 + uTime));
    return vec2(random * vec.x, random * vec.y);
}

float random(float seed) {
    return fract(sin(seed + 12397.1237) * cos(17263.0 + seed));
}

float randomSign() {
    return sign(random(uTime * float(gl_VertexID)) - 0.5);
}

void main() {
    gl_PointSize = 2.0;
    float stepWidth = .0025;

    vec2 pos = aParticle.xy;
    // normalize mouse position for -0.5 to 0.5
    vec2 mouse = uMouse.xy - 0.5;
    float mouseDown = uMouse.z;

    float heading = aParticle.z;
    // keep in bounds
    float bound = 0.5;
    if (pos.x <= -bound || pos.x >= bound || pos.y <= -bound || pos.y >= bound) {
        heading += PI / 2.0;
    }
    // cost map at current position ()
    vec4 costTexel = texelFetch(uAdditionalSampler, ivec2(pos.x, pos.y), 0);

    //normalize pos
    vec2 normPos = pos + vec2(0.5, 0.5);

    vec4 cost = texture(uAdditionalSampler, normPos);

    if (cost.r >= 0.5 || cost.g >= 0.5) {
        // gl_PointSize = 1.0;
        pos.x += cos(heading) * stepWidth;
        pos.y += sin(heading) * stepWidth;
    } else {
        // heading = mod(heading, 2.0 * PI);
        pos.x += cos(heading) * stepWidth*0.1;
        pos.y += sin(heading) * stepWidth*0.1;
    }

    if (mouseDown == 1.0) {
        if (distance(pos, mouse) < 0.1) {
            pos.xy = mouse;
        }
    }

    vPosition = aPosition;
    vTexCoord = aTexCoord;
    vParticle = vec4(pos.xy, heading, aParticle.w);
    // vParticle.xy = pos.xy * uResolution; //+ vec2(sin(uTime)*0.005, cos(uTime)*0.005);

    gl_Position = vec4(aParticle.xy + pos.xy, 1.0, 1.0);
    // gl_Position = vec4(pos.xy, 1.0, 1.0);
}
