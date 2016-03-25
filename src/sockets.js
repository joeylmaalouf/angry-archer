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
      socket.game = game;
      socket.emit("set game id", {
        gameID: socket.game.id
      });
    });

    socket.on("join game", function (data) {
      var game = coordinator.joinGame(socket, data.gameID);
      socket.game = game;
      if (game) {
        socket.emit("set game id", {
          gameID: socket.game.id
        });
        game.p1.emit("join game success", {/*TODO*/});
        game.p2.emit("join game success", {/*TODO*/});
      }
      else {
        socket.emit("join game failure", {/*TODO*/});
      }
    });

    socket.on("end game", function (data) {
      coordinator.endGame(socket.game.id);
    });
  });
};

module.exports = {
  bind: bindSockets
};
