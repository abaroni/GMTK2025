import { Bounds } from "./components/Bounds.js";
export class Coin {
  constructor(x, y, size = 20) {
      this.x = x;
      this.y = y;
      this.size = size;
      this.bounds = new Bounds(this.size, this.size, 0, 0); // Initialize bounds with coin size
  }
  

    getPosition() {
        return { x: this.x, y: this.y };
    }


    getSize() {
        return this.size;
    }

}