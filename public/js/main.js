var socket = io.connect();
var gameIDText = $("#gameIDText");
var createGameText = $("#createGameText");
var joinGameText = $("#joinGameText");
var gameID;

socket.on("set game id", function (data) {
  gameID = data.gameID;
  gameIDText.text(gameID);
});

var createGame = function () {
  endGame();
  socket.emit("create game", {});
  createGameText.text("Waiting for player 2...");
};

var joinGame = function () {
  endGame();
  socket.emit("join game", {
    gameID: joinGameText.val()
  });
  createGameText.text("Waiting for player 1...");
  joinGameText.val("");
};

var endGame = function () {
  socket.emit("end game", {});
  gameID = null;
  gameIDText.text("You are not currently in a game.");
  createGameText.text("");
};
