// A damped spring in Apple's terms (WWDC 2018, "Designing Fluid Interfaces"):
// dampingRatio 1 settles without overshoot, below 1 overshoots; response is roughly the settle period in seconds.
// Springs keep their position and velocity, so a new target picks up from wherever the motion is.
export function createSpring(value = 0, precision = 0.5) {
  let target = value;
  let velocity = 0;
  let stiffness = 0;
  let damping = 0;
  return {
    get value() { return value; },
    get velocity() { return velocity; },
    get settled() { return Math.abs(value - target) < precision && Math.abs(velocity) < precision * 10; },
    // Jump to a value and hold it there (used while a finger is driving the motion).
    set(next, nextVelocity = 0) {
      value = next;
      target = next;
      velocity = nextVelocity;
    },
    to(next, { dampingRatio = 1, response = 0.35, velocity: nextVelocity } = {}) {
      target = next;
      if (nextVelocity !== undefined) velocity = nextVelocity;
      stiffness = (2 * Math.PI / response) ** 2;
      damping = (4 * Math.PI * dampingRatio) / response;
    },
    step(seconds) {
      if (this.settled) { value = target; velocity = 0; return; }
      // Small fixed substeps keep the integration stable at any frame rate.
      const steps = Math.max(1, Math.ceil(seconds * 240));
      const h = seconds / steps;
      for (let i = 0; i < steps; i += 1) {
        velocity += (-stiffness * (value - target) - damping * velocity) * h;
        value += velocity * h;
      }
      // Land exactly on the target once at rest, so no sub-pixel offset is left behind.
      if (this.settled) { value = target; velocity = 0; }
    },
  };
}

// Where a flick would come to rest with scroll-like deceleration (Apple's projection, not v²/2a).
export function project(velocity, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

// Resistance past a boundary: the further the pull, the less the element follows.
export function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
