var Matter = require("../lib/matter.js");
// var engine = Matter.Engine.create();
// var engine2 = Matter.Engine.create();

// var boxA = Matter.Bodies.rectangle(400, 200, 80, 80);
// var boxB = Matter.Bodies.rectangle(450, 50, 80, 80);
// var ground = Matter.Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

// Matter.World.add(engine.world, [boxA, ground]);
// Matter.World.add(engine2.world, [boxB, ground]);

// console.log('boxA', boxA.position);
// console.log('boxB', boxB.position);

// for (var i = 0; i < 100; i++) {
//     Matter.Events.trigger(engine, 'tick', { timestamp: engine.timing.timestamp });
//     Matter.Engine.update(engine, engine.timing.delta);
//     Matter.Events.trigger(engine, 'afterTick', { timestamp: engine.timing.timestamp });
// }

// console.log('boxA', boxA.position);
// console.log('boxB', boxB.position);

function World() {
  this.engine = Matter.Engine.create();

  this.add = function(bodies) {
    Matter.World.add(this.engine.world, bodies);
  }

  this.step = function(steps) {
    if (!steps) {
      steps = 1;
    }
    for (var i = 0; i < steps; i++) {
      Matter.Events.trigger(this.engine, 'tick', { timestamp: this.engine.timing.timestamp });
      Matter.Engine.update(this.engine, this.engine.timing.delta);
      Matter.Events.trigger(this.engine, 'afterTick', { timestamp: this.engine.timing.timestamp });
    }
  }
}

module.exports = World;