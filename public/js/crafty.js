Crafty.init(window.innerWidth, window.innerHeight, document.getElementById("game"));

Crafty.background("#000000");

player = Crafty.e("2D, DOM, Color, Fourway")
               .attr({x: 0, y: 0, w: 100, h: 100})
               .color("#FF0000")
               .fourway(200);
