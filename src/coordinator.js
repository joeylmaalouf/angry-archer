var shortid = require("shortid");

var games = {};

var createGame = function (socket) {
  var gameID = shortid.generate();
  games[gameID] = {
    id: gameID,
    p1: socket,
    p2: null
  };
  console.log(socket.id + " created new game: " + gameID);
  return games[gameID];
};

var joinGame = function (socket, gameID) {
  if (gameID in games) {
    games[gameID].p2 = socket;
    console.log(socket.id + " joined existing game: " + gameID);
  }
  return games[gameID];
};

var endGame = function (gameID) {
  if (gameID in games) {
    console.log("Ended existing game: " + gameID);
    delete games[gameID];
  }
};

module.exports = {
  createGame: createGame,
  joinGame: joinGame,
  endGame: endGame
};
