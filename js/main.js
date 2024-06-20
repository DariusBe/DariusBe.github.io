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
// since size can change, place listener on the window
window.addEventListener('resize', function() {
    // Update the size of the renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Update the size of the camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    // Update the resolution of the shader
    material.uniforms.u_resolution.value.x = window.innerWidth*2;
    material.uniforms.u_resolution.value.y = window.innerHeight*2;
});

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

let points = [new THREE.Vector2(0.5, 0.5), new THREE.Vector2(1.0, 1.0)];

// Create a shader material
var material = new THREE.ShaderMaterial({
    fragmentShader: fragmentShader,
    vertexShader: vertexShader,
    uniforms: {
        u_time: { value: 1.0 },
        u_resolution: { value: new THREE.Vector2() },
        u_mouse: { value: new THREE.Vector2() },
        u_points: { value: points }
    }
});

// forward the resolution of the canvas to the shader
material.uniforms.u_resolution.value.x = window.innerWidth*2;
material.uniforms.u_resolution.value.y = window.innerHeight*2;

// Log the shader code to the console or print error
console.log(fragmentShader);
console.log(vertexShader);

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