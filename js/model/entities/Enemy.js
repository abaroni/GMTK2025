import { Bounds } from "./components/Bounds.js";
export class Enemy {
  constructor(x, y, size = 20) {
      this.x = x;
      this.y = y;
      this.size = size;
      this.bounds = new Bounds();
  }
  
}