#version 300 es
precision mediump float;

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
uniform bool uCheckbox;
// uniform vec2 uResolution;
// uniform float uTime;
// uniform vec3 uMouse;
// uniform bool uShowCursor;

out vec4 fragColor;

float calculateCostSurface(vec2 texCoord) {
    vec2 texelSize = 1.0 / uResolution;
    float height = texture(uSampler, texCoord).z;
    float heightLeft = texture(uSampler, texCoord - vec2(texelSize.x, 0.0)).z;
    float heightRight = texture(uSampler, texCoord + vec2(texelSize.x, 0.0)).z;
    float heightUp = texture(uSampler, texCoord + vec2(0.0, texelSize.y)).z;
    float heightDown = texture(uSampler, texCoord - vec2(0.0, texelSize.y)).z;

    vec2 gradient = vec2((heightRight - heightLeft) / (2.0 * texelSize.x),
                         (heightUp - heightDown) / (2.0 * texelSize.y));

    // Calculate the slope
    float slope = length(gradient);

    // Return the cost surface value
    return slope;
}

float calculateCostSurfaceDerivative(vec2 texCoord) {
    vec2 texelSize = 1.0 / uResolution;
    float height = texture(uSampler, texCoord).z;

    // Use OpenGL derivative functions
    float dFdxHeight = dFdx(height);
    float dFdyHeight = dFdy(height);

    // Calculate the slope
    float slope = length(vec2(dFdxHeight, dFdyHeight));

    // Return the cost surface value
    return slope;
}

vec4 colorGradient(float z) {
    // Define colors for the gradient
    vec3 color1 = vec3(1.0f, 0.0f, 0.0f); // Red
    vec3 color2 = vec3(0.0, 1.0, 0.0); // Green
    vec3 color3 = vec3(0.0, 0.0, 1.0); // Blue

    // Interpolate between colors based on z value
    if (z < 0.5) {
        return vec4(mix(color1, color2, z * 2.0), 1.0);
    } else {
        return vec4(mix(color2, color3, (z - 0.5) * 2.0), 1.0);
    }
    // transform color 
}

void main() {
    vec4 xyz = texture(uSampler, vTexCoord);
    vec4 terrain = colorGradient(1.0-xyz.z);

    float slopeFactor = 35.0;
    float slope = 1.0-calculateCostSurfaceDerivative(vTexCoord)*slopeFactor;
    vec4 derrivative = colorGradient(slope);

    float t = sin(uTime)*sin(uTime);

    // fragColor = vec4(terrain.xyz, 1.0);
    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;

    if (uShowCursor == 1.0) {
        float dist = smoothstep(0.0, 50.0, distance(gl_FragCoord.xy, mouse * uResolution));
        if (mouseClick == 1.0 && dist < 1.0 && dist > 0.9) {
            fragColor = mix(terrain, derrivative, dist);
            fragColor.w *= 0.95;
        } else {
            fragColor = derrivative;
        }
    } else {
        fragColor = derrivative;
    }

    if (!uCheckbox) {
        fragColor = terrain;
        float dist = smoothstep(0.0, 100.0, distance(gl_FragCoord.xy, mouse * uResolution));
        if (mouseClick == 1.0 && dist < 1.0) {
            fragColor = mix(terrain, derrivative, 1.0-(dist*dist));
        }
    }
}