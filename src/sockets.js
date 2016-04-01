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
      socket.player = "1";
      if (game) {
        socket.emit("create game success", {
          gameID: socket.game.id,
          otherPlayer: "2"
        });
      }
      else {
        socket.emit("create game failure", {});
      }
    });

    socket.on("join game", function (data) {
      var game = coordinator.joinGame(socket, data.gameID);
      socket.game = game;
      socket.player = "2";
      if (game) {
        game.p1.emit("join game success", {
          gameID: socket.game.id,
          otherPlayer: p2.player
        });
        game.p2.emit("join game success", {
          gameID: socket.game.id,
          otherPlayer: p1.player
        });
      }
      else {
        socket.emit("join game failure", {});
      }
    });

    socket.on("end game", function (data) {
      if (socket.game) {
        coordinator.endGame(socket.game.id);
        if (socket.game.p1) {
          socket.game.p1.emit("end game success", {});
          delete socket.game.p1.game;
        }
        if (socket.game.p2) {
          socket.game.p2.emit("end game success", {});
          delete socket.game.p2.game;
        }
      }
      else {
        socket.emit("end game failure", {});
      }
    });
  });
};

module.exports = {
  bind: bindSockets
};
