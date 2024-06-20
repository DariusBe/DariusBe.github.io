import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

// Get the canvas element from the HTML
const canvas = document.getElementById('webgl-canvas');

// Create a WebGL renderer
const renderer = new THREE.WebGLRenderer({ canvas });

renderer.setClearColor(0xFFFFFF); // Set the background color
renderer.setPixelRatio(window.devicePixelRatio); // Set the pixel ratio
renderer.setSize(window.innerWidth, window.innerHeight); // Set the size of the renderer

// Set the size of the renderer
renderer.setSize(window.innerWidth, window.innerHeight);

// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(15, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create a plane
const geometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight); // width, height 


const loader = new THREE.FileLoader();

// Load the fragment shader file
const fragmentShader = await loader.loadAsync('js/shaders/fragment.glsl');
const vertexShader = await loader.loadAsync('js/shaders/vertex.glsl');

// Create a shader material
var material = new THREE.ShaderMaterial({
    fragmentShader: fragmentShader,
    vertexShader: vertexShader,
    uniforms: {
        u_time: { value: 1.0 },
        u_resolution: { value: new THREE.Vector2() },
        u_mouse: { value: new THREE.Vector2() }
    }
});




// Create a plane
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// Update the u_mouse uniform whenever the mouse moves
document.onmousemove = function(e) {
    material.uniforms.u_mouse.value.x = 2*e.pageX;
    material.uniforms.u_mouse.value.y = window.innerHeight*2 - (2*e.pageY);
}

// Set up an animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update the u_time uniform every frame
    material.uniforms.u_time.value += 0.01;

    renderer.render(scene, camera);
}

animate();
// // Animation loop
// function animate() {
//     requestAnimationFrame(animate);
//     // Rotate the cube
//     plane.rotation.x += 0.01;
//     plane.rotation.y += 0.01;
//     // Render the scene with the camera
//     renderer.render(scene, camera);
// }
// // Start the animation loop
// animate();



// async function createMaterial() {
//     const loader = new THREE.FileLoader();

//     // Load the fragment shader file
//     const fragmentShader = await loader.loadAsync('js/shaders/fragment.glsl');
//     const vertexShader = await loader.loadAsync('js/shaders/vertex.glsl');

//     // Create a shader material
//     const material = new THREE.ShaderMaterial({
//         fragmentShader: fragmentShader,
//         vertexShader: vertexShader
//     });

//     return material;
// }