require.config({
  baseUrl: 'http://wellcaffeinated.net/PhysicsJS/assets/scripts/vendor/',
  packages: [
    {
      name: 'physicsjs',
      location: 'physicsjs-current',
      main: 'physicsjs-full.min'
    }
  ]
});

var colors = [
  ['0x268bd2', '0x0d394f']
  ,['0xc93b3b', '0x561414']
  ,['0xe25e36', '0x79231b']
  ,['0x6c71c4', '0x393f6a']
  ,['0x58c73c', '0x30641c']
  ,['0xcac34c', '0x736a2c']
];
var rendererContainer;
function initWorld(world, Physics) {

  var stage = new PIXI.Stage(0x01d1f20);
  var viewWidth = window.innerWidth * .95;
  var viewHeight = viewWidth * .33;
  var renderer = PIXI.autoDetectRenderer(viewWidth, viewHeight, { antialias: true, resolution: 1 });

  var graphics = new PIXI.Graphics();
  stage.addChild(graphics);
  rendererContainer = document.getElementById("viewport");
  rendererContainer.appendChild(renderer.view);

  
  // ,viewportBounds = Physics.aabb(0, 0, window.innerWidth, window.innerHeight)
  var viewportBounds = Physics.aabb(0, 0, viewWidth, viewHeight);
  var edgeBounce;
  var renderer;
  var styles = {
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

  // render on each step
  var x = 10, y = 10;
  world.on('step', function () {
    graphics.clear();
    for (index in world._bodies) {
      var body = world._bodies[index];
      graphics.beginFill(0xe74c3c);
      if (body.name == "circle") {
        graphics.drawCircle(body.state.pos.x, body.state.pos.y, body.radius);
      } else if (body.name == "rectangle") {
        graphics.drawRect(body.state.pos.x - body.width/2, body.state.pos.y - body.height/2, body.width, body.height);
      } else if (body.name == "convex-polygon") {
        var path = [];
        for (index in body.vertices) {
          path.push(new PIXI.Point(body.state.pos.x + body.vertices[index].x, body.state.pos.y + body.vertices[index].y));
        }
        graphics.drawPolygon(path);
        console.log(body);
      }
      graphics.endFill();
      // console.log(index, world._bodies[thing]);

    }
    renderer.render(stage);
  });
  
  // constrain objects to these bounds
  edgeBounce = Physics.behavior('edge-collision-detection', {
    aabb: viewportBounds
    ,restitution: 0.2
    ,cof: 0.8
  });

  // resize events
  window.addEventListener('resize', function () {
    // renderer.resize(viewWidth, viewHeight);
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

function startWorld( world, Physics ){
  // subscribe to ticker to advance the simulation
  Physics.util.ticker.on(function( time ) {
    world.step( time );
    // console.log(world._bodies[0].state.pos.x);
  });
}

//
// Add some interaction
//
function addInteraction( world, Physics ){
  // add the mouse interaction
  world.add(Physics.behavior('interactive', { el: rendererContainer }));
  // add some fun extra interaction
  var attractor = Physics.behavior('attractor', {
    order: 0,
    strength: 0.002
  });
  
  world.on({
    'interact:poke': function( pos ){
      world.wakeUpAll();
      attractor.position( pos );
      world.add( attractor );
    }
    ,'interact:move': function( pos ){
      attractor.position( pos );
    }
    ,'interact:release': function(){
      world.wakeUpAll();
      world.remove( attractor );
    }
  });
}

// helper function (bind "this" to Physics)
function makeBody( obj ){ 
  return this.body( obj.name, obj );
}

//
// Add bodies to the world
//
function addBodies( world, Physics ){
  var v = Physics.geometry.regularPolygonVertices;
  var bodies = [
    { name: 'circle', x: 100, y: 100, vx: 0.1, radius: 60 }
    ,{ name: 'rectangle', x: 400, y: 100, vx: -0.1, width: 130, height: 130 }
    ,{ name: 'convex-polygon', x: 150, y: 300, vertices: v( 5, 90 ) }
  ];
  
  // functional programming FTW
  world.add( bodies.map(makeBody.bind(Physics)) );
}

//
// Load the libraries with requirejs and create the simulation
//
require([
  'physicsjs',
  'pixi'
], function( Physics, PIXI ){
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
  
  Physics( worldConfig, [
    initWorld,
    addInteraction,
    addBodies,
    startWorld
  ]);
  
});