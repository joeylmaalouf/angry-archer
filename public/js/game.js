var SOLDIER_MAX_VEL = 2;
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
  var aspectRatio = 2 / 1;
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
    $.each(world._bodies, function(index, body) {
      if (body.category === "soldier" && Math.abs(body.state.angular.vel) < SOLDIER_MAX_VEL) {
        body.state.angular.acc = body.team === 1 ? 1 : -1;
      }
    });
    world.render();
  });
  
  world.on("collisions:detected", function (data) {
    $.each(data.collisions, function (index, collision) {
      var A = collision.bodyA;
      var B = collision.bodyB;
      if (A.category === "arrow") {
        if (B.uid === 1) {
          world.remove(A);
        } else if (B.category === "soldier" && A.team != B.team) {
          world.remove(A);
          world.remove(B);
        }
      } else if (B.category === "arrow") {
        if (A.uid === 1) {
          world.remove(B);
        } else if (A.category === "soldier" && A.team != B.team) {
          world.remove(A);
          world.remove(B);
        }
      }
      if (A.category === 'player' || B.category === 'player') { // If one of the bodies is a player
        if (A.category === "soldier" || B.category === "soldier") { // If a soldier touches a player, remove both
          if (A.team != B.team) {
            world.remove(A);
            world.remove(B);
            endGame();
          }
        }
      }
    });
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
    Physics.behavior("body-collision-detection"),
    edgeBounce
  ]);  
}

function startWorld (world, Physics) {
  // subscribe to ticker to advance the simulation
  Physics.util.ticker.on(function (time) {
    if (world != null) {
      world.step(time);
    }
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
  updateWorld(Array[{uid: Number, state: {}, config: {}}]) -> undefined

  Update/add/remove bodies to synchronize game state between clients
  Assumptions:
    uid is identical for bodies between clients
*/
function updateWorld (theirBodies) {
  // Sort by ascending uid
  theirBodies.sort(function (a, b) { return a.uid - b.uid; });

  // Add/Update Bodies
  $.map(theirBodies, function (theirBody) {
    var myBody;
    if (world._bodies.some(function (el) {myBody = el; return el.uid == theirBody.uid; })) {
      copyBodyState(theirBody.state, myBody.state);
      copyBodyState(theirBody.state.old, myBody.state.old);
    } else {
      theirBody.children = $.map(theirBody.children, function (child) {
        return Physics.body(child.name, child);
      });
      var newBody = Physics.body(theirBody.name, theirBody);
      copyBodyState(theirBody.state, newBody.state);
      copyBodyState(theirBody.state.old, newBody.state.old);
      newBody.uid = theirBody.uid;
      newBody.team = theirBody.team;
      newBody.category = theirBody.category;
      world.add(newBody);
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

function addForts (world, Physics) {
  var bodies = [];
  $.merge(bodies, makeFort(true));
  $.merge(bodies, makeFort(false));
  $.map(bodies, function (b) { world.add(Physics.body(b.name, b)); });
}

var makeFort = function (isLeft) {
  var offset = function (x) { return isLeft ? x : worldWidth - x; };
  var res = 0;
  var cof = 1;
  return [
    // tower 1
    { name: 'rectangle', x: offset(10), y: worldHeight - 85, width: 20, height: 170, mass: 20*170, cof: cof, restitution: res},
    { name: 'rectangle', x: offset(90), y: worldHeight - 85, width: 20, height: 170, mass: 20*170, cof: cof, restitution: res},
    { name: 'rectangle', x: offset(50), y: worldHeight - 180, width: 100, height: 20, mass: 100*20, cof: cof, restitution: res},
    { name: 'rectangle', x: offset(50), y: worldHeight - 10, width: 60, height: 20, mass: 60*20, cof: cof, restitution: res},
    
    // tower 2
    { name: 'rectangle', x: offset(10 + 120), y: worldHeight - 115, width: 20, height: 230, mass: 20*230, cof: cof, restitution: res},
    { name: 'rectangle', x: offset(130 + 120), y: worldHeight - 115, width: 20, height: 230, mass: 20*230, cof: cof, restitution: res},
    { name: 'rectangle', x: offset(70 + 120), y: worldHeight - 240, width: 140, height: 20, mass: 140*20, cof: cof, restitution: res},
    { name: 'rectangle', x: offset(70 + 120), y: worldHeight - 10, width: 100, height: 20, mass: 100*20, cof: cof, restitution: res},
    { name: 'rectangle', x: offset(70 + 120), y: worldHeight - 265, width: 20, height: 30, mass: 20*30, cof: cof, restitution: res, category: 'player', team: isLeft ? 1 : 2, styles: { fillStyle: isLeft ? '0x00dd44' : '0x0044dd' } },
    
    // tower 3
    { name: 'rectangle', x: offset(10 + 120 + 160), y: worldHeight - 75, width: 20, height: 150, mass: 20*150, cof: cof, restitution: res},
    { name: 'rectangle', x: offset(70 + 120 + 160), y: worldHeight - 75, width: 20, height: 150, mass: 20*150, cof: cof, restitution: res},
    { name: 'rectangle', x: offset(40 + 120 + 160), y: worldHeight - 160, width: 80, height: 20, mass: 80*20, cof: cof, restitution: res},
    { name: 'rectangle', x: offset(40 + 120 + 160), y: worldHeight - 10, width: 40, height: 20, mass: 40*20, cof: cof, restitution: res}
  ];
}

var hireSoldier = function (data) {
  var soldier = { x: (data.isLeft ? 380 : worldWidth - 380), y: worldHeight - 30, radius: 20, mass: Math.PI * 20 * 20, category: 'soldier', team: data.isLeft ? 1 : 2, styles: { fillStyle: data.isLeft ? '0x00dd44' : '0x0044dd' } };
  world.add(Physics.body('circle', soldier));
};

var fireArrow = function (data) {
  var origin = {x: (data.isLeft ? 200 : worldWidth - 200), y: worldHeight - 200}; // Default positions
  $.each(world._bodies, function(index, body) { // Update firing position to player position
    if (body.category === 'player') {
      if ((data.isLeft && body.team === 1) || (!data.isLeft && body.team === 2)) {
        origin = {x: body.state.pos.x + (data.isLeft ? 30 : -30), y: body.state.pos.y - 40};
      }
    }
  });
  
  var trace = {x: data.target.x - origin.x, y: data.target.y - origin.y};
  var ang = data.isLeft ? Math.atan(trace.y / trace.x) : Math.atan(trace.y / trace.x) + Math.PI;
  var vel = Math.sqrt(Math.pow(trace.x, 2) + Math.pow(trace.y, 2)) * 0.002;

  world.add(Physics.body('compound', {
    x: origin.x,
    y: origin.y,
    vx: vel * Math.cos(ang),
    vy: vel * Math.sin(ang),
    angle: ang,
    treatment: 'dynamic',
    styles: { fillStyle: data.isLeft ? '0x99ffcc' : '0x99ccff' },
    team: data.isLeft ? 1 : 2,
    category: 'arrow',
    children: [
      Physics.body('rectangle', {
        x: 0,
        y: 0,
        width: 60,
        height: 4,
        mass: 60*4
      }),
      Physics.body('convex-polygon', {
        x: 30,
        y: 0,
        mass: 5*15,
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
        mass: 5*15*.5,
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
        mass: 5*15*.5,
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
    sleepDisabled: true,
    // speed at which bodies wake up
    sleepSpeedLimit: 0.05,
    // variance in position below which bodies fall asleep
    sleepVarianceLimit: 2,
    // time (ms) before sleepy bodies fall asleep
    sleepTimeLimit: 3000
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
    Physics.util.ticker.stop();
    window.world.destroy();
    $("#viewport").children(0).remove();
  }
}

var endGame = function() {
  var numWinners = 0;
  var winningTeam;
  $.each(world._bodies, function(index, body) {
    if (body.category === 'player') {
      numWinners++;
      winningTeam = body.team;
    }
  });
  if (numWinners > 1 || numWinners === 0) {
    winningTeam = 'nobody';
  }
  winGame(winningTeam);
}
