var P = require('../lib/physicsjs/physicsjs-full.js');

P(function (world) {
  P.util.ticker.tickrate(64); // Ticks/second
  world.add(P.behavior('constant-acceleration'), {
    acc: { x : 0, y: 0.0004 } // Standard gravity
  });
  world.add(P.behavior('body-collision-detection'));
  world.add(P.behavior('sweep-prune'));
  world.add(P.behavior('body-impulse-response'));

  // Fire world step event on ticker step
  P.util.ticker.on(function (time, dt) {
    world.step(time);
  });

  // Function callback on physics engine step
  world.on('step', function(){
    
  });

  /*
    loadStage() -> null
    Clear the world, add a set of objects to the world
  */
  function loadScene (stage) {
    world.remove(world.getBodies());
    world.add(stage.bodies);
  }

  world.fireArrow = function (pos, vel) {
    world.add(P.body('convex-polygon', {
      x: pos.x,
      y: pos.y,
      vx: vel.x,
      vy: vel.y,
      vertices: [
        {x: -10, y: 0},
        {x: -7, y: 2},
        {x: -7, y: 1},
        {x: 10, y: 1},
        {x: 10, y: -1},
        {x: -7, y: -1},
        {x: -7, y: -2},
      ]
    }));
  }

  // API
  module.exports = {
    start: P.util.ticker.start,
    stop: P.util.ticker.stop,
    scene: world,
    loadScene: loadScene
  }
});
