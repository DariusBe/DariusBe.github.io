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
const material = new THREE.ShaderMaterial({
    fragmentShader: fragmentShader,
    vertexShader: vertexShader
});

// Create a plane
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

renderer.render(scene, camera);
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