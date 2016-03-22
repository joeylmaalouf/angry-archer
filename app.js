var express = require("express");
var http = require("http");
var socketio = require("socket.io");
var path = require("path");
var routes = require("./src/routes");
var sockets = require("./src/sockets");

var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);

var PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", routes.home);

sockets(io);

server.listen(PORT, function () {
  console.log("Application running on port:", PORT);
});
