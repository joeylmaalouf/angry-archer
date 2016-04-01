var socket = io.connect();
var gameIDText, createGameText, joinGameText;
var createGameButton, joinGameButton, endGameButton;
var gameID;

$(document).ready(function () {
  gameIDText = $("#gameIDText");
  createGameText = $("#createGameText");
  joinGameText = $("#joinGameText");
  createGameButton = $("#createGameButton");
  joinGameButton = $("#joinGameButton");
  endGameButton = $("#endGameButton");
  
  createGameButton.click(createGame);
  joinGameButton.click(joinGame);
  endGameButton.click(endGame);
  
  inLobby();
});

var createGame = function () {
  socket.emit("create game", {});
};

var joinGame = function () {
  socket.emit("join game", {
    gameID: joinGameText.val()
  });
  joinGameText.val("");
};

var endGame = function () {
  socket.emit("end game", {});
};

var inLobby = function (data) {
  gameID = null;
  gameIDText.text("You are not currently in a game.");
  createGameText.text("");
  createGameButton.show();
  joinGameButton.show();
  joinGameText.show();
  endGameButton.hide();
};

var inWaiting = function (data) {
  gameID = data.gameID;
  gameIDText.text(gameID);
  createGameText.text("Waiting for player " + data.otherPlayer + "...");
  createGameButton.hide();
  joinGameButton.hide();
  joinGameText.hide();
  endGameButton.show();
};

socket.on("create game success", inWaiting);
socket.on("join game success", inWaiting);
socket.on("end game success", inLobby);

socket.on("join game failure", function (data) {
});
