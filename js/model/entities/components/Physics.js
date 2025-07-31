export class Physics {
    constructor(gravity,jumpPower) {
        this.gravity = gravity;
        this.onGround = false; // Is the entity on the ground?
        this.jumpPower = jumpPower; 
    }

}