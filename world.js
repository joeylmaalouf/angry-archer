var P = require('./lib/physicsjs/physicsjs-full.js');
// require('./lib/physicsjs/bodies/convex-polygon.js');

P(function (world) {
  var square = P.body('rectangle', {
    x: 250,
    y: 250,
    vx: 0.01,
    width: 50,
    height: 50
  });
  world.add(square);

  P.util.ticker.on(function (time, dt) {
    world.step(time);
  });

  world.on('step', function(){
    console.log(square.state);
  });

});

module.exports = {
  startWorld: function () {
    console.log("World Started");
    P.util.ticker.start();
  },
  stopWorld: function () {
    P.util.ticker.stop();
  }
}
