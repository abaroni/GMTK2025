import { Bounds } from "./entities/components/Bounds.js";
export class CollisionEngine {

    constructor() {
        this.entities = [];
        this.subscriptions = [];
    }
    register(entity) {
        // Register an entity for collision detection
        if( entity && entity.bounds && entity.bounds instanceof Bounds) {
          this.entities.push(entity);
        }else{
          console.warn("Entity must have bounds to be registered in CollisionEngine ", entity);
        }
    }
    unregister(entity) {
        // Unregister an entity
        this.entities = this.entities.filter(e => e !== entity);
    }

    subscribe(entity, callback) {
        this.subscriptions.push({ entity, callback });
    }
    unsubscribe(entity) {
        // Unsubscribe an entity from collision notifications
        this.subscriptions = this.subscriptions.filter(sub => sub.entity !== entity);
    }

    clear() {
        // Clear all entities and subscriptions
        this.entities = [];
        this.subscriptions = [];
    }

    checkCollisions() {
        // Check for collisions between registered entities
        for (let i = 0; i < this.entities.length; i++) {
            for (let j = i + 1; j < this.entities.length; j++) {
                const entityA = this.entities[i];
                const entityB = this.entities[j];

                if (this.isColliding(entityA, entityB)) {
                    this.handleCollision(entityA, entityB);
                }
            }
        }
    }
    isColliding(entityA, entityB) {
        // Use static Bounds collision detection
        return Bounds.intersects(entityA, entityB);
    }
    handleCollision(entityA, entityB) {
        // Handle collision between two entities
        for (const sub of this.subscriptions) {
            if (sub.entity === entityA) {
                sub.callback(entityB);
            }
            if( sub.entity === entityB) {
                sub.callback(entityA);
            }
        }
    }
  }