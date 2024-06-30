export class PhysarumManager {
    constructor(count, rotationAngle) {
        this.count = count || 250;
        this.population = [];
        this.rotationAngle = rotationAngle || 22.5;
        this.stepWidth = 0.01;

        // initialize the population
        this.createPopulation();
    }
    
    createPopulation() {
        for (let i = 0; i < this.count; i++) {
            const x = (Math.random() * 2) -1; // * window.innerWidth);
            const y = (Math.random() * 2) -1; // * window.innerHeight);
            const rot = Math.sign(Math.random() - 0.5) * this.rotationAngle * (Math.floor(Math.random()*360 / this.rotationAngle));
            this.population[i] = new Physarum(x, y, rot);
        }
    }


    update() {
        for (let i = 0; i < this.count; i++) {
            // move the physarum
            this.population[i].position.x += this.stepWidth * Math.cos(this.population[i].rotation);
            this.population[i].position.y += this.stepWidth * Math.sin(this.population[i].rotation);

            // keep the physarum within the bounds of the screen
            this.population[i].position.x = Math.min(1, Math.max(-1, this.population[i].position.x));
            this.population[i].position.y = Math.min(1, Math.max(-1, this.population[i].position.y));

            // rotate the physarum
            const randRot = Math.sign(Math.random() - 0.5) * this.rotationAngle * (Math.floor(Math.random()*360 / this.rotationAngle));
            this.population[i].rotation = (this.population[i].rotation + randRot) % 360;
        }
    }
}

class Physarum {
    constructor(x, y, rot) {
        this.position = { x: x, y: y };
        this.rotation = rot;
    }
}