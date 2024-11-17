export class ModelOBJ {
    vertices = [];
    vertexNormals = [];
    texCoords = [];
    faces = [];
    lineElements = [];
    parameterSpaceVertices = [];
    objectNames = [];
    smoothShading = [];
    combined = [];

    printOjectDescription() {
        var objDescription = {
            'object_names': [this.objectNames, null],
            'vertices': [this.vertices, 'Vertices, with (x, y, z, [w]) coordinates. w is optional and defaults to 1.0.'],
            'tex_coords': [this.texCoords, 'Texture Coordinates in (u, [v, w]) coordinates. These will vary between 0 and 1. v, w are optional and default to 0.'],
            'vertex_normals': [this.vertexNormals, 'Vertex normals in (x,y,z) form; normals might not be unit vectors.'],
            'faces': [this.faces, 'Polygonal face definition using lists of vertex, texture and normal indices in the format vertex_index / texture_index / normal_index for which each index starts at 1 and increases corresponding to the order in which the referenced element was defined.'],
            'line_elements': [this.lineElements, 'Line elements specified by the order of the vertices which build a polyline.'],
            'parameter_space_vertices': [this.parameterSpaceVertices, 'Parameter space vertices in (u, [v, w]) form; free form geometry statement for control points of rational trimming curves.'],
            'smooth_shading': [this.smoothShading, null],
            'combined': [this.combined, 'The final object description including vertices as reconstructed by face-list, texCoords, normals and Color values for the render buffer.']
        };

        // console.group('OBJ Description:');
        console.groupCollapsed('OBJ-File:', ...objDescription.object_names[0]);
        for (const [key, [val, description]] of Object.entries(objDescription)) {
            const entryLength = val.length;
            // console.log(val, entryLength);
            if (entryLength == 0) {
                continue;
            }
            if (entryLength > 1) {
                console.groupCollapsed(key);
                console.info(description);
                console.info('Lenght:', val.length);
                console.table(val);
                console.groupEnd();
            } else {
                console.log(key + ':', ...val);
            }
        }
        console.groupEnd();
    }
}