export class PhysarumManager {
    constructor(count, rotationAngle) {
        this.count = count;
        this.population = [];
        this.rotationAngle = rotationAngle || 45;

        // initialize the population
        this.createPopulation();
    }
    
    createPopulation() {
        for (let i = 0; i < this.count; i++) {
            const x = (Math.random() - 0.5) * 2; // * window.innerWidth);
            const y = (Math.random() - 0.5) * 2; // * window.innerHeight);
            const rot = Math.sign(Math.random() - 0.5) * this.rotationAngle * (Math.floor(Math.random()*360 / this.rotationAngle));
            this.population[i] = new Physarum(x, y, rot);
        }
    }

    update() {
        for (let i = 0; i < this.count; i++) {
            // move the physarum
            this.population[i].position.x += Math.sin(this.population[i].rotation)*0.002;
            this.population[i].position.y += Math.cos(this.population[i].rotation)*0.002;
            // rotate the physarum
            this.population[i].rotation += Math.sign(Math.random() - 0.5) * this.rotationAngle * (Math.floor(Math.random()*360 / this.rotationAngle));
        }
    }
}

class Physarum {
    constructor(x, y, rot) {
        this.position = { x: x, y: y };
        this.rotation = rot;
    }
}