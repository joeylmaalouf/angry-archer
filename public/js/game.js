var colors = [
  ["0x268bd2", "0x0d394f"],
  ["0xc93b3b", "0x561414"],
  ["0xe25e36", "0x79231b"],
  ["0x6c71c4", "0x393f6a"],
  ["0x58c73c", "0x30641c"],
  ["0xcac34c", "0x736a2c"]
];
var viewXOffset, viewScale, worldHeight;
var worldWidth = 1200;
function initWorld(world, Physics) {
  var aspectRatio = 3 / 1;
  worldHeight = worldWidth / aspectRatio;
  var viewWidthPercentage = .95;
  viewXOffset = window.innerWidth * ((1 - viewWidthPercentage) / 2);
  // bounds of the window
  var viewWidth = window.innerWidth * viewWidthPercentage,
    viewHeight = viewWidth / aspectRatio,
    boundingBox = Physics.aabb(0, 0, worldWidth, worldHeight),
    edgeBounce,
    renderer,
    styles = {
      "circle": {
        fillStyle: colors[0][0],
        lineWidth: 1,
        strokeStyle: colors[0][1],
        angleIndicator: colors[0][1]
      },
      "rectangle": {
        fillStyle: colors[1][0],
        lineWidth: 1,
        strokeStyle: colors[1][1],
        angleIndicator: colors[1][1]
      },
      "convex-polygon": {
        fillStyle: colors[2][0],
        lineWidth: 1,
        strokeStyle: colors[2][1],
        angleIndicator: colors[2][1]
      }
    };

  // add the renderer
  makeRenderer(Physics);
  renderer = Physics.renderer("pixi-scalable", { el: "viewport", styles: styles, worldsize: {w: worldWidth, h: worldHeight} });
  renderer.resize(viewWidth, viewHeight);
  viewScale = 1 / renderer.viewScale;
  world.add(renderer);
  // render on each step
  world.on("step", function () {
    world.render();
  });
  
  // constrain objects to these bounds
  edgeBounce = Physics.behavior("edge-collision-detection", {
    aabb: boundingBox,
    restitution: 0.2,
    cof: 0.8
  });

  // resize events
  window.addEventListener("resize", function () {
    viewWidth = window.innerWidth * viewWidthPercentage;
    viewHeight = viewWidth/aspectRatio;
    renderer.resize(viewWidth, viewHeight);
    viewScale = 1 / renderer.viewScale;
  }, true);

  // add behaviors to the world
  world.add([
    Physics.behavior("constant-acceleration", {acc: {x: 0, y: 0.0008}}),
    Physics.behavior("body-impulse-response"),
    Physics.behavior("body-collision-detection"),
    Physics.behavior("sweep-prune"),
    edgeBounce
  ]);  
}

function startWorld (world, Physics) {
  // subscribe to ticker to advance the simulation
  Physics.util.ticker.on(function (time) {
    world.step(time);
  });
  window.world = world;
}

// Add some interaction
function addInteraction (world, Physics) {
  // add the mouse interaction
  world.add(Physics.behavior("interactive", { el: world.renderer().container }));

  world.on({
    "interact:release": function (pos) {
      pos.x *= viewScale;
      pos.y *= viewScale;
      if (0 < pos.x && pos.x < worldWidth && 0 < pos.y && pos.y < worldHeight) {
        socket.emit("spawn entity", { type: "arrow", target: pos });
      }
    }
  });
}

// helper function (bind "this" to Physics)
function makeBody (obj) { 
  return this.body(obj.name, obj);
}

/*
  copyBodyState({src}, {dst}) -> void
  given two state objects, copy attributes from one to another
*/
function copyBodyState (src, dst) {
  dst.pos.clone(src.pos);
  dst.vel.clone(src.vel);
  dst.acc.clone(src.acc);
  dst.angular.pos = src.angular.pos;
  dst.angular.vel = src.angular.vel;
  dst.angular.acc = src.angular.acc;
};

/*
  updateWorld(Array[{uid: Number, state: {}}]) -> undefined

  Update/add/remove bodies to synchronize game state between clients
  Assumptions:
    uid is identical for bodies between clients
*/
function updateWorld(theirBodies) {
  // Sort by ascending uid
  theirBodies.sort(function(a,b) {return a.uid - b.uid});

  // Add/Update Bodies
  theirBodies.map(function(theirBody) {
    var myBody;
    if (world._bodies.some(function(el) {myBody = el; return el.uid == theirBody.uid})) {
      copyBodyState(theirBody.state, myBody.state);
      copyBodyState(theirBody.state.old, myBody.state.old);
    } else {
      world.add(theirBody);
    }
  });

  // Remove Bodies
  for (var i = world._bodies.length - 1; i >= 0; --i) {
    var myBody = world._bodies[i];
    var theirBody;
    if (!theirBodies.some(function(el) {theirBody = el; return el.uid == myBody.uid})) {
      world.remove(myBody);
    }
  };
}

// Add bodies to the world
function addBodies (bodies, world, Physics) {
  world.add(bodies.map(makeBody.bind(Physics)));
}

function addForts (world, Physics) {
  var bodies = [];
  $.merge(bodies, makeFort(true));
  $.merge(bodies, makeFort(false));
  addBodies(bodies, world, Physics);
}

var makeFort = function (isLeft) {
  var offset = function (x) { return isLeft ? x : worldWidth - x; };
  return [
    { name: 'rectangle', x: offset(10), y: worldHeight - 50, width: 20, height: 100 },
    { name: 'rectangle', x: offset(10), y: worldHeight - 130, width: 20, height: 40 },
    { name: 'rectangle', x: offset(90), y: worldHeight - 50, width: 20, height: 100 },
    { name: 'rectangle', x: offset(50), y: worldHeight - 110, width: 100, height: 20 },
    { name: 'rectangle', x: offset(110), y: worldHeight - 30, width: 20, height: 60 },
    { name: 'rectangle', x: offset(170), y: worldHeight - 30, width: 20, height: 60 },
    { name: 'rectangle', x: offset(140), y: worldHeight - 70, width: 80, height: 20 },
    { name: 'rectangle', x: offset(170), y: worldHeight - 121, width: 20, height: 80 },
    { name: 'rectangle', x: offset(85), y: worldHeight - 175, width: 190, height: 20 },
    { name: 'rectangle', x: offset(85), y: worldHeight - 140, width: 20, height: 10, styles: { fillStyle: '0xffcc00' } },
    { name: 'rectangle', x: offset(65), y: worldHeight - 140, width: 20, height: 10, styles: { fillStyle: '0xffcc00' } },
    { name: 'rectangle', x: offset(75), y: worldHeight - 150, width: 20, height: 10, styles: { fillStyle: '0xffcc00' } }
  ];
}

var hireSoldier = function (data) {
  world.add(Physics.body('circle', { x: (data.isLeft ? 220 : worldWidth - 220), y: worldHeight - 30, radius: 20 }));
};

var fireArrow = function (data) {
  var origin = {x: (data.isLeft ? 200 : worldWidth - 200), y: worldHeight - 200};
  var trace = {x: data.target.x - origin.x, y: data.target.y - origin.y};
  var ang = data.isLeft ? Math.atan(trace.y / trace.x) : Math.atan(trace.y / trace.x) + Math.PI;
  var vel = Math.sqrt(Math.pow(trace.x, 2) + Math.pow(trace.y, 2)) * 0.005;

  world.add(Physics.body('compound', {
    x: origin.x,
    y: origin.y,
    vx: vel * Math.cos(ang),
    vy: vel * Math.sin(ang),
    angle: ang,
    treatment: 'dynamic',
    styles: {fillStyle: '0xffffff'},
    children: [
      Physics.body('rectangle', {
        x: 0,
        y: 0,
        width: 60,
        height: 4,
        mass: 5
      }),
      Physics.body('convex-polygon', {
        x: 30,
        y: 0,
        mass: 1,
        vertices: [
          {x: 0, y: 15},
          {x: 5, y: 0},
          {x: -5, y: 0}
        ],
        angle: Math.PI / -2
      }),
      Physics.body('convex-polygon', {
        x: -25,
        y: 3,
        mass: 1,
        vertices: [
          {x: 0, y: 15},
          {x: 0, y: 0},
          {x: -5, y: 0}
        ],
        angle: Math.PI / -1.8
      }),
      Physics.body('convex-polygon', {
        x: -25,
        y: -3,
        mass: 1,
        vertices: [
          {x: 0, y: 15},
          {x: 0, y: 0},
          {x: 5, y: 0}
        ],
        angle: Math.PI / -2.2
      })
    ]
  }));
}

// Load the libraries with requirejs and create the simulation
require.config({
  baseUrl: "js/lib"
});

// Set global access variables for Physics.js and PIXI renderer
require(["physicsjs-full.min", "pixi.min"],
function (Physics, PIXI) {
  window.Physics = Physics;
  window.PIXI = PIXI;
});

/*
  createWorld -> void
  configure and initialize physics world
*/
var createWorld = function() {
  var worldConfig = {
    // timestep
    timestep: 6,
    // maximum number of iterations per step
    maxIPF: 4,
    // default integrator
    integrator: "verlet",
    // is sleeping disabled?
    sleepDisabled: false,
    // speed at which bodies wake up
    sleepSpeedLimit: 0.1,
    // variance in position below which bodies fall asleep
    sleepVarianceLimit: 5,
    // time (ms) before sleepy bodies fall asleep
    sleepTimeLimit: 2000
  };
  Physics(worldConfig, [
    initWorld,
    addInteraction,
    addForts,
    startWorld
  ]);
}

/*
  clearWorld() -> void
  If a physics world exists, destroy it and remove its canvas element from the page
*/
var clearWorld = function() {
  if (window.world) {
    world.destroy();
    $("#viewport").children(0).remove();
  }
}
