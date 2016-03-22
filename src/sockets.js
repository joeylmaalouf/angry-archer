var bindSockets = function (io) {
  io.on("connection", function (socket) {
    var clientID = socket.id.substr(2);
    console.log("User connected:    " + clientID);
    socket.emit("set id", {"id": clientID});

    socket.on("disconnect", function (data) {
      console.log("User disconnected: " + clientID);
    });

    socket.on("chat message", function (data) {
      console.log("New chat message:  " + data.id + ": " + data.text);
      io.emit("chat message", data);
    });
  });
};

module.exports = bindSockets;
