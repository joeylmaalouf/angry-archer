var coordinator = require("./coordinator");

var bindSockets = function (io) {
  io.on("connection", function (socket) {

    var createGame = function (data) {
      socket.game = coordinator.createGame(socket);
      if (socket.game) {
        socket.emit("create game success", {
          gameID: socket.game.id,
          otherPlayer: "2"
        });
      }
      else {
        socket.emit("create game failure", {});
      }
    };

    var joinGame = function (data) {
      socket.game = coordinator.joinGame(socket, data.gameID);
      if (socket.game) {
        socket.game.p1.emit("join game success", {
          gameID: socket.game.id,
          otherPlayer: "2"
        });
        socket.game.p2.emit("join game success", {
          gameID: socket.game.id,
          otherPlayer: "1"
        });
      }
      else {
        socket.emit("join game failure", {});
      }
    };

    var endGame = function (data) {
      if (socket.game) {
        coordinator.endGame(socket.game.id);
        if (socket.game.p1) {
          socket.game.p1.emit("end game success", data);
          if (socket.game.p1.intervalID) {
            clearInterval(socket.game.p1.intervalID);
          }
        }
        if (socket.game.p2) {
          socket.game.p2.emit("end game success", data);
          if (socket.game.p2.intervalID) {
            clearInterval(socket.game.p2.intervalID);
          }
        }
        delete socket.game;
      }
      else {
        socket.emit("end game failure", {});
      }
    };

    var playGame = function (data) {
      if (socket.game) {
        if (socket.game.p1) {
          socket.game.p1.emit("play game success", {});
        }
        if (socket.game.p2) {
          socket.game.p2.emit("play game success", {});
        }
      }
      else {
        socket.emit("play game failure", {});
      }
    };

    var pauseGame = function (data) {
      if (socket.game) {
        if (socket.game.p1) {
          socket.game.p1.emit("pause game success", {});
        }
        if (socket.game.p2) {
          socket.game.p2.emit("pause game success", {});
        }
      }
      else {
        socket.emit("pause game failure", {});
      }
    };
    
    var beginWorld = function (data) {
      var delay = 1000;
      if (++socket.game.numReady == 2) {
        socket.game.p1.emit("begin simulation", {});
        socket.game.p2.emit("begin simulation", {});
        socket.game.p1.intervalID = setInterval(function () {
          if (socket.game && socket.game.p1) {
            socket.game.p1.emit("get world state", {});
          }
        }, delay);
        /* setTimeout(function () {
          socket.game.p2.intervalID = setInterval(function () {
            if (socket.game.p2) {
              socket.game.p2.emit("get world state", {});
            }
          }, delay);
        }, delay / 2); */
      }
    };

    var sendState = function (data) {
      if (socket.game) {
        if (socket.player == 1 && socket.game.p2) {
          socket.game.p2.emit("set world state", data);
        }
        /* else if (socket.player == 2 && socket.game.p1) {
          socket.game.p1.emit("set world state", data);
        } */
      }
    };

    var sendInput = function (data) {
      if (socket.game) {
        if (socket.game.p1) {
          socket.game.p1.emit("interaction", data);
        }
        if (socket.game.p2) {
          socket.game.p2.emit("interaction", data);
        }
      }
    };

    var makeEntity = function (data) {
      if (socket.game) {
        data.isLeft = (socket.player === 1);
        if (socket.game.p1) {
          socket.game.p1.emit(data.type + " spawned", data);
        }
        if (socket.game.p2) {
          socket.game.p2.emit(data.type + " spawned", data);
        }
      }
    };

    socket.on("create game", createGame);
    socket.on("join game", joinGame);
    socket.on("end game", endGame);
    socket.on("play game", playGame);
    socket.on("pause game", pauseGame);
    socket.on("player ready", beginWorld);
    socket.on("world state", sendState);
    socket.on("interaction", sendInput);
    socket.on("spawn entity", makeEntity)
    socket.on("disconnect", endGame);
  });
};

module.exports = {
  bind: bindSockets
};
