var shortid = require("shortid");
shortid.characters("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@");

var games = {};

var createGame = function (socket) {
  var gameID = shortid.generate();
  games[gameID] = {
    id: gameID,
    p1: socket,
    p2: null
  };
  return games[gameID];
};

var joinGame = function (socket, gameID) {
  if (gameID in games) {
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
