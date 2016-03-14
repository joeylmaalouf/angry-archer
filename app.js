var express = require("express");
var http = require("http");
var socketio = require("socket.io");
var path = require("path");
var index = require("./routes/index");

var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);

var PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", index.home);

io.on("connection", function (socket) {
  console.log("User connected.");
  
  socket.on("disconnect", function (data) {
    console.log("User disconnected.");
  });
  
  socket.on("chat message", function (data) {
    console.log("New chat message: " + data);
    io.emit("chat message", data);
  });
});

server.listen(PORT, function () {
  console.log("Application running on port:", PORT);
});
