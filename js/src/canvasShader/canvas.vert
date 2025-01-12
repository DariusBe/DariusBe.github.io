#version 300 es
precision mediump float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;
layout(location = 2) in vec4 aParticle;

// std140 is a standard layout for uniform blocks
// layout(std140) uniform Globals {
layout(std140) uniform GlobalUniforms {
    mat4 uProjection;
    mat4 uView;
    mat4 uModel;
    vec2 uResolution;
    float uTime;
    float uShowCursor;
    vec4 uMouse;
};

out vec2 vTexCoord;
out vec4 vParticle;

void main() {
    vTexCoord = aTexCoord;
    vParticle = aParticle;
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
}

/*  */
// std140 is a standard layout for uniform blocks in chunks of 4 bytes
// rules:
// 1.)
//  all chunks are 4 bytes long:
//  [ ][ ][ ][ ] <- 1 fillable chunk
// 2.) 
//  floats, ints, bools are 4 bytes, so they occupy 1/4th of a chunk
//  [X][ ][ ][ ] <- 1 float = 1/4th chunk, 3/4 chunk is wasted or filled with 3 more floats, ints or bools
// 3.)
//  vec2 takes 2/4th of a chunk and is EITHER IN FIRST OR SECOND HALF OF A CHUNK
//  [X][X][0][0] <- 1 vec2 = 1/2 chunk, 1/2 chunk is wasted or filled with one more vec2 or two floats, etc.
// 4.)
//  vec3 takes 3/4th of a chunk and is ALWAYS AT START OF A CHUNK
//  [X][X][X][ ] <- 1 vec3 = 3/4 chunk, 1/4 chunk is wasted or filled with a float, int or bool
// 5.)
//  vec4 takes a whole chunk
//  [X][X][X][X] <- 1 vec4 = 1 chunk
// 6.)
//  mat4 are made of 4x4 = 16 floats = 4 chunks
// 7.)
//  matrices are always treated as arrays: each member always gets its own chunk
// vec3:    [X][X][X][ ]
//          [X][X][X][ ]
//          [X][X][X][ ]
// 8.)
//  padding is added where necessary to make sure the next variable starts at the beginning of a chunk
// 9.) 
// Don't try playing tetris with your chunks of uniform
// --> alignment always increases speed, keep code clean and easily updatable
