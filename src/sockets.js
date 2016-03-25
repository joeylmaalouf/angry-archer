var coordinator = require("./coordinator");

var sockets = {};

var bindSockets = function (io) {
  io.on("connection", function (socket) {
    sockets[socket.id] = socket;
    console.log("User connected: " + socket.id);

    socket.on("disconnect", function (data) {
      console.log("User disconnected: " + socket.id);
      delete sockets[socket.id];
    });

    socket.on("create game", function (data) {
      var game = coordinator.createGame(socket);
      socket.emit("set game id", {
        gameID: game.id
      });
    });

    socket.on("join game", function (data) {
      var game = coordinator.joinGame(socket, data.gameID);
      if (game) {
        socket.emit("set game id", {
          gameID: game.id
        });
        socket.emit("join game success", {/*TODO*/});
      }
      else {
        socket.emit("join game failure", {/*TODO*/});
      }
    });

    socket.on("end game", function (data) {
      coordinator.endGame(data.gameID);
    });
  });
};

module.exports = {
  bind: bindSockets
};
