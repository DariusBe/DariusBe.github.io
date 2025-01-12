#version 300 es
precision mediump float;

in vec3 vPosition;
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
uniform sampler2D uParticleSampler; // texture unit 0
uniform sampler2D uCostSampler; // texture unit 1

uniform int uParticleCount;
uniform float uSensorAngle;
uniform float uSensorDistance;

out vec4 fragColor;

vec4 prepareCursor(float radius, vec4 color) {
    vec2 mouse = uMouse.xy;
    
    float mouseClick = uMouse.z;

    vec4 cursor = vec4(0.0);
    if (distance(gl_FragCoord.xy, mouse * uResolution) < radius) {
        if (mouseClick == 1.0) {
            cursor = color;
        }
    }
    return cursor;
}

void main() {
    vec2 uv = gl_FragCoord.xy;
    vec2 st = uv / uResolution;

    vec4 old = texture(uParticleSampler, st);
    vec4 cost = texture(uCostSampler, st);

    float cell = 0.0;

    vec4 F = texelFetch(uParticleSampler, ivec2(uv), 0);
    vec4 FL = texelFetch(uParticleSampler, ivec2(uv) + ivec2(-1, 1), 0);

    if (true) {
        fragColor = old;
    }
    

    // if (uTime > 1.) {

    //     // if texel < 0.5, 1, otherwise 0
    //     float cell = float(texelFetch(uParticleSampler, ivec2(uv), 0).r > 0.5);
    //     float neighbor_tl = float(texelFetch(uParticleSampler, ivec2(uv) + tl, 0).r > 0.5);
    //     float neighbor_t = float(texelFetch(uParticleSampler, ivec2(uv) + t, 0).r > 0.5);
    //     float neighbor_tr = float(texelFetch(uParticleSampler, ivec2(uv) + tr, 0).r > 0.5);
    //     float neighbor_l = float(texelFetch(uParticleSampler, ivec2(uv) + l, 0).r > 0.5);
    //     float neighbor_r = float(texelFetch(uParticleSampler, ivec2(uv) + r, 0).r > 0.5);
    //     float neighbor_bl = float(texelFetch(uParticleSampler, ivec2(uv) + bl, 0).r > 0.5);
    //     float neighbor_b = float(texelFetch(uParticleSampler, ivec2(uv) + b, 0).r > 0.5);
    //     float neighbor_br = float(texelFetch(uParticleSampler, ivec2(uv) + br, 0).r > 0.5);

    //     // if outside of the texture, set to 0
    //     if (uv.x == 0.0 || uv.x == uResolution.x - 1.0 || uv.y == 0.0 || uv.y == uResolution.y - 1.0) {
    //         neighbor_tl = 0.0;
    //         neighbor_t = 0.0;
    //         neighbor_tr = 0.0;
    //         neighbor_l = 0.0;
    //         neighbor_r = 0.0;
    //         neighbor_bl = 0.0;
    //         neighbor_b = 0.0;
    //         neighbor_br = 0.0;
    //     }
    //     float sum = neighbor_tl + neighbor_t + neighbor_tr + neighbor_l + neighbor_r + neighbor_bl + neighbor_b + neighbor_br;

    //     // conway's game of life
    //     if (cell == 1.0) {
    //         if (sum < 2.0 || sum > 3.0) {
    //             cell = 0.0;
    //         } else if (sum == 2.0 || sum == 3.0) {
    //             cell = 1.0;
    //         }
    //     } else {
    //         if (sum == 3.0) {
    //             cell = 1.0;
    //         }
    //     }
    //     fragColor = vec4(vec3(cell), 1.0);
    // } else {
    //     float cell = 0.0;
    //     if (particle.r > 0.9) {
    //         cell = 1.0;
    //         fragColor = vec4(vec3(cell), 1.0);
    //     } else {
    //         fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    //     }
    // }

    fragColor += prepareCursor(20.0, vec4(1.0, 1.0, 1.0, 1.0));
    // fragColor = cost;
}

/*
- Sensory Behaviour
	- Sample chemoattractant values from sensors

	- if (F > FL) && (F > FR)
		- Stay facing same direction
		- Return
	- Else if (F < FL) && (F < FR)
		- Rotate towards strongest of FL and FR
	- Else if (FL < FR)
		- Rotate right by RA
	- Else if (FR < FL)
		- Rotate left by RA
	- Else
		- Continue facing same direction
*/