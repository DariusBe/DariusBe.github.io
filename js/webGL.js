import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { PhysarumManager } from './physarum.js';

// to provide an export for the class, we can use the export keyword before the class definition

export class WebGLRenderer {
    constructor(canvasId, physarumManager) {
        // Get the canvas element from the HTML
        this.canvas = document.getElementById(canvasId);
        this.physarumManager = physarumManager;
        // Create a WebGL renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.points = [];
        this.renderer.setClearColor(0xFFFFFF); // Set the background color
        this.renderer.setPixelRatio(window.devicePixelRatio); // Set the pixel ratio
        this.renderer.setSize(window.innerWidth, window.innerHeight); // Set the size of the renderer

        // Create a scene
        this.scene = new THREE.Scene();

        // Create a camera
        this.camera = new THREE.PerspectiveCamera(15, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;

        // Create a plane
        this.geometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight); // width, height 

        this.loader = new THREE.FileLoader();

        this.fillArray();


        // Load the fragment shader file
        this.loadShaders().then(([fragmentShader, vertexShader]) => {
        this.createMaterial(fragmentShader, vertexShader);
        this.createPlane();
        this.addEventListeners();
        this.animate();
        });
    }

    fillArray() {
        for (let i = 0; i < this.physarumManager.count; i++) {
            this.points.push(
                new THREE.Vector2(
                    this.physarumManager.population[i].position.x,
                    this.physarumManager.population[i].position.y
                )
            );
        }
    }

    async loadShaders() {
        const fragmentShader = await this.loader.loadAsync('js/shaders/fragment.glsl');
        const vertexShader = await this.loader.loadAsync('js/shaders/vertex.glsl');
        return [fragmentShader, vertexShader];
    }

    createMaterial(fragmentShader, vertexShader) {
        // Create a shader material
        this.material = new THREE.ShaderMaterial({
            fragmentShader: fragmentShader,
            vertexShader: vertexShader,
            uniforms: {
                u_time: { value: 0.0 },
                u_resolution: { value: new THREE.Vector2() },
                u_mouse: { value: new THREE.Vector2() },
                // pass size of points as uniform
                u_population: { value: this.physarumManager.count },
                u_points: { value: this.points },
            }
        });

        // forward the resolution of the canvas to the shader
        this.material.uniforms.u_resolution.value.x = window.innerWidth * 2;
        this.material.uniforms.u_resolution.value.y = window.innerHeight * 2;
    }

    createPlane() {
        // Create a plane
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    addEventListeners() {
        // since size can change, place listener on the window
        window.addEventListener('resize', () => {
            // Update the size of the renderer
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            // Update the size of the camera
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            // Update the resolution of the shader
            this.material.uniforms.u_resolution.value.x = window.innerWidth * 2;
            this.material.uniforms.u_resolution.value.y = window.innerHeight * 2;
        });

        // Update the u_mouse uniform whenever the mouse moves
        document.onmousemove = (e) => {
            this.material.uniforms.u_mouse.value.x = 2 * e.pageX;
            this.material.uniforms.u_mouse.value.y = window.innerHeight * 2 - (2 * e.pageY);
        };
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        // Update the u_time uniform every frame
        this.material.uniforms.u_time.value += 0.01;
        // Update the points uniform every frame
        this.physarumManager.update();

        // Update u_points uniform
        this.material.uniforms.u_points.value = this.physarumManager.population.map(physarum => new THREE.Vector2(physarum.position.x, physarum.position.y));    
        
        this.renderer.render(this.scene, this.camera);
    }
}