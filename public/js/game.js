var colors = [
  ['0x268bd2', '0x0d394f']
  ,['0xc93b3b', '0x561414']
  ,['0xe25e36', '0x79231b']
  ,['0x6c71c4', '0x393f6a']
  ,['0x58c73c', '0x30641c']
  ,['0xcac34c', '0x736a2c']
];
var viewXOffset, viewScale;
function initWorld(world, Physics) {
  var aspectRatio = 3/1;
  var worldWidth = 1200;
  var worldHeight = worldWidth/aspectRatio;
  var viewWidthPercentage = .95;
  viewXOffset = window.innerWidth * ((1 - viewWidthPercentage) / 2);
  // bounds of the window
  var viewWidth = window.innerWidth * viewWidthPercentage
    ,viewHeight = viewWidth/aspectRatio
    ,boundingBox = Physics.aabb(0, 0, worldWidth, worldHeight)
    ,edgeBounce
    ,renderer
    ,styles = {
      'circle': {
        fillStyle: colors[0][0],
        lineWidth: 1,
        strokeStyle: colors[0][1],
        angleIndicator: colors[0][1]
      }
      ,'rectangle': {
        fillStyle: colors[1][0],
        lineWidth: 1,
        strokeStyle: colors[1][1],
        angleIndicator: colors[1][1]
      }
      ,'convex-polygon': {
        fillStyle: colors[2][0],
        lineWidth: 1,
        strokeStyle: colors[2][1],
        angleIndicator: colors[2][1]
      }
    };

  // add the renderer
  makeRenderer(Physics);
  renderer = Physics.renderer('pixi-scalable', { el: 'viewport', styles: styles, worldsize: {w: worldWidth, h: worldHeight} });
  renderer.resize(viewWidth, viewHeight);
  viewScale = 1/renderer.viewScale;
  world.add(renderer);
  // render on each step
  world.on('step', function () {
    world.render();
  });
  
  // constrain objects to these bounds
  edgeBounce = Physics.behavior('edge-collision-detection', {
    aabb: boundingBox
    ,restitution: 0.2
    ,cof: 0.8
  });

  // resize events
  window.addEventListener('resize', function () {
    viewWidth = window.innerWidth * viewWidthPercentage;
    viewHeight = viewWidth/aspectRatio;
    renderer.resize(viewWidth, viewHeight);
    viewScale = 1/renderer.viewScale;
  }, true);

  // add behaviors to the world
  world.add([
    Physics.behavior('constant-acceleration')
    ,Physics.behavior('body-impulse-response')
    ,Physics.behavior('body-collision-detection')
    ,Physics.behavior('sweep-prune')
    ,edgeBounce
  ]);  
}

function startWorld (world, Physics) {
  // subscribe to ticker to advance the simulation
  Physics.util.ticker.on(function( time ) {
    world.step( time );
  });
  window.world = world;
}

// Add some interaction
function addInteraction (world, Physics) {
  // add the mouse interaction
  world.add(Physics.behavior('interactive', { el: world.renderer().container }));
  // add some fun extra interaction
  var attractor = Physics.behavior('attractor', {
    order: 0,
    strength: 0.002
  });
  
  world.on({
    'interact:poke': function( pos ){
      console.log("Literal Mousepos", pos);
      pos.x = (pos.x * viewScale) - viewXOffset;
      pos.y = pos.y * viewScale;
      console.log("Shifted Mousepos", pos);
      if (pos.body) {
        console.log("Body pos", pos.body.state.pos);
      }
      
      world.wakeUpAll();
      attractor.position( pos );
      world.add( attractor );
    }
    ,'interact:move': function( pos ){
      pos.x = (pos.x * viewScale) - viewXOffset;
      pos.y = pos.y * viewScale;
      attractor.position( pos );
    }
    ,'interact:release': function(){
      world.wakeUpAll();
      world.remove( attractor );
    }
  });
}

// helper function (bind "this" to Physics)
function makeBody (obj) { 
  return this.body(obj.name, obj);
}

// Add bodies to the world
function addBodies (world, Physics) {
  var v = Physics.geometry.regularPolygonVertices;
  var bodies = [
    { name: 'circle', x: 100, y: 100, vx: 0.1, radius: 60 }
    ,{ name: 'rectangle', x: 400, y: 100, vx: -0.1, width: 130, height: 130 }
    ,{ name: 'convex-polygon', x: 150, y: 300, vertices: v( 5, 90 ) }
  ];
  
  // functional programming FTW
  world.add( bodies.map(makeBody.bind(Physics)) );
}

// Load the libraries with requirejs and create the simulation
require.config({
  baseUrl: 'js/lib'
});

require(['physicsjs-full.min', 'pixi.min'],
function (Physics, PIXI) {
  window.PIXI = PIXI;
  var worldConfig = {
    // timestep
    timestep: 6,
    // maximum number of iterations per step
    maxIPF: 4,
    // default integrator
    integrator: 'verlet',
    // is sleeping disabled?
    sleepDisabled: false,
    // speed at which bodies wake up
    sleepSpeedLimit: 0.1,
    // variance in position below which bodies fall asleep
    sleepVarianceLimit: 2,
    // time (ms) before sleepy bodies fall asleep
    sleepTimeLimit: 500
  };
  Physics(worldConfig, [
    initWorld,
    addInteraction,
    addBodies,
    startWorld
  ]);
});
