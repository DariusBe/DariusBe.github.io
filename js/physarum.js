export class PhysarumManager {
    constructor(count, rotationAngle) {
        this.count = count;
        this.population = [];
        this.rotationAngle = rotationAngle || 22.5;

        // initialize the population
        this.createPopulation();
    }
    
    createPopulation() {
        for (let i = 0; i < this.count; i++) {
            const x = (Math.random() - 0.5) * 2; // * window.innerWidth);
            const y = (Math.random() - 0.5) * 2; // * window.innerHeight);
            const rot = Math.sign(Math.random() - 0.5) * this.rotationAngle * (Math.floor(Math.random()*360 / this.rotationAngle));
            const rand = Math.random();
            this.population[i] = new Physarum(x, y, 0.0);
        }
    }

    update() {
        for (let i = 0; i < this.count; i++) {
            // // move the physarum
            // this.population[i].position.x += Math.cos(this.population[i].rotation * Math.PI / 180);
            // this.population[i].position.y += Math.sin(this.population[i].rotation * Math.PI / 180);
            // // rotate the physarum
            // this.population[i].rotation += Math.sign(Math.random() - 0.5) * this.rotationAngle;
        }
    }
}

class Physarum {
    constructor(x, y, rot) {
        this.position = { x: x, y: y };
        this.rotation = rot;
    }
}