#version 300 es
precision mediump float;

in vec2 vTexCoord;

uniform vec3 uMouse;
uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uSampler;

out vec4 fragColor;

void main() {
    float t = uTime;
    
    vec2 uv = uResolution;
    // normalize moues position
    vec2 mouse = uMouse.xy;
    float mouseClick = uMouse.z;

    vec3 color = vec3(0.0);
    // show the mouse position
    if (distance(gl_FragCoord.xy, mouse * uv) < 5.0) {
        if (mouseClick == 1.0) {
            color = vec3(1.0, 1.0, 1.0);
        } else {
            color = vec3(0.0118, 0.2314, 0.5059);
        }
    }
    // normalize the texture size with the resolution
    float scaleFactor = 50.0 / 100000.0;
    float texWidth = vTexCoord.x * uv.x * scaleFactor;
    float texHeight = vTexCoord.y * uv.y * scaleFactor;
    vec2 texCoord = vec2(texWidth, texHeight);

    vec3 texColor = texture(uSampler, texCoord).rgb;

    fragColor = vec4(texColor + color, t);
}

