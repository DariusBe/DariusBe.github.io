#version 300 es
#extension GL_OES_standard_derivatives : enable
precision highp sampler2D;
precision highp float;


in vec2 vTexCoord;

uniform sampler2D uSampler;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uMouse;

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

// Function to create a color gradient based on z value
vec4 colorGradient(float z) {
    // Define colors for the gradient
    vec3 color1 = vec3(1.0, 0.0, 0.0); // Red
    vec3 color2 = vec3(0.0, 1.0, 0.0); // Green
    vec3 color3 = vec3(0.0, 0.0, 1.0); // Blue

    // Interpolate between colors based on z value
    if (z < 0.5) {
        return vec4(mix(color1, color2, z * 2.0), 1.0);
    } else {
        return vec4(mix(color2, color3, (z - 0.5) * 2.0), 1.0);
    }
}

vec4 prepareCursor(float radius, vec4 color, vec4 inputColor) {
    // normalize moues position
    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;

    vec4 cursor = inputColor;
    // show the mouse position
    if (distance(gl_FragCoord.xy, mouse * uResolution) < radius) {
        if (mouseClick == 1.0) {
            cursor = color;
        }
    }
    return cursor;
}


void main() {
    vec4 xyz = texture(uSampler, vTexCoord);
    vec4 trad = colorGradient(1.0-xyz.z);

    vec4 new = colorGradient(1.0-calculateCostSurfaceDerivative(vTexCoord)*50.0);

    float t = sin(uTime)*sin(uTime);

    fragColor = vec4(vec3(mix(trad.xyz, new.xyz, t)), 1.0);
        vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;

    if (distance(gl_FragCoord.xy, mouse * uResolution) < 50.0) {
        if (mouseClick == 1.0) {
            fragColor = new;
        }
    }

}