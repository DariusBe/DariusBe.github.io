import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

export class PhysarumManager {
    constructor(count) {
        this.count = count;
        this.population = [];

        // initialize the population
        this.createPopulation();
    }
    
    createPopulation() {
        for (let i = 0; i < this.count; i++) {
            const x = Math.random() * window.innerWidth*2;
            const y = Math.random() * window.innerHeight*2;
            this.population.push(new Physarum(x, y));
        }
    }

    update() {
        for (let i = 0; i < this.count; i++) {
            const physarum = this.population[i];
            // update the position
            physarum.position.x += Math.cos(physarum.rotation);
            physarum.position.y += Math.sin(physarum.rotation);

            if (physarum.position.x < 0 || physarum.position.x > window.innerWidth*2) {
                physarum.rotation += 180;
            }
            if (physarum.position.y < 0 || physarum.position.y > window.innerHeight*2) {
                physarum.rotation += 180;
            }
        }
    }
}

class Physarum {
    constructor(x, y) {
        this.position = new THREE.Vector2(x, y);
        this.rotation = Math.random() * Math.PI * 2;
    }
}