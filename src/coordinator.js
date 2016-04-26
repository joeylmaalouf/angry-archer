var shortid = require("shortid");
shortid.characters("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_");

var games = {};

var createGame = function (socket) {
  var gameID = shortid.generate();
  socket.player = 1;
  games[gameID] = {
    id: gameID,
    p1: socket,
    p2: null,
    numReady: 0
  };
  return games[gameID];
};

var joinGame = function (socket, gameID) {
  if (gameID in games) {
    socket.player = 2;
    games[gameID].p2 = socket;
  }
  return games[gameID];
};

var endGame = function (gameID) {
  if (gameID in games) {
    delete games[gameID];
  }
};

module.exports = {
  createGame: createGame,
  joinGame: joinGame,
  endGame: endGame
};
