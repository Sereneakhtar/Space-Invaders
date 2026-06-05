export class AudioManager {
    constructor() {
        this.shoot = new Audio("assets/shoot.wav");
        this.explosion = new Audio("assets/explosion.wav");
        this.invaderMove = new Audio("assets/invader-move.wav");
        this.ufo = new Audio("assets/ufo.wav");
    }

    play(sound) {
        if (this[sound]) {
            this[sound].currentTime = 0;
            this[sound].play().catch(() => {});
        }
    }
}
