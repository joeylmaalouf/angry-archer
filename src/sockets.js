var sockets = {};

var bindSockets = function (io) {
  io.on("connection", function (socket) {
    sockets[socket.id] = socket;
    console.log("User connected:    " + socket.id);
    socket.emit("set id", {id: socket.id});

    socket.on("disconnect", function (data) {
      console.log("User disconnected: " + socket.id);
      for (var id in sockets) {
        if (socket.id === id) {
          delete sockets[id];
        }
      }
    });

    socket.on("chat message", function (data) {
      console.log("New chat message:  " + data.id + ": " + data.text);
      io.emit("chat message", data);
    });
  });
};

module.exports = {
  bind: bindSockets
};
