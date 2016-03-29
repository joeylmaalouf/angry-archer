"use strict"
var express = require("express");
var path = require("path");
var http = require("http");
var socketio = require("socket.io");
var routes = require("./src/routes");
var sockets = require("./src/sockets");
var World = require("./src/world");
var Matter = require("./lib/matter.js");
var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);

var PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", routes.home);

sockets.bind(io);

var boxA = Matter.Bodies.rectangle(400, 200, 80, 80);
var boxB = Matter.Bodies.rectangle(450, 50, 80, 80);

var world1 = new World();
var world2 = new World();

console.log("Box A Position", boxA.position);
console.log("Box B Position", boxB.position);
world1.add([boxA]);
world2.add([boxB]);
world1.step(100);
console.log("Box A Position", boxA.position);
console.log("Box B Position", boxB.position);
world2.step(100);
console.log("Box A Position", boxA.position);
console.log("Box B Position", boxB.position);

server.listen(PORT, function () {
  console.log("Application running on port:", PORT);
});
