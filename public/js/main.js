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
  
  createGameButton.click(function () {
    socket.emit("create game", {});
  });

  joinGameButton.click(function () {
    socket.emit("join game", { gameID: joinGameText.val() });
  });

  endGameButton.click(function () {
    socket.emit("end game", {});
  });
  
  joinLobby();
});

var joinLobby = function (data) {
  gameID = null;
  gameIDText.text("You are not currently in a game.");
  createGameText.text("");
  joinGameText.val("");
  createGameButton.show();
  joinGameButton.show();
  joinGameText.show();
  endGameButton.hide();
};

var joinWaiting = function (data) {
  gameID = data.gameID;
  gameIDText.text(gameID);
  createGameText.text("Waiting for player " + data.otherPlayer + "...");
  joinGameText.val("");
  createGameButton.hide();
  joinGameButton.hide();
  joinGameText.hide();
  endGameButton.show();
};

socket.on("create game success", joinWaiting);
socket.on("join game success", joinWaiting);
socket.on("end game success", joinLobby);

socket.on("create game failure", function (data) {
  // TODO
});

socket.on("join game failure", function (data) {
  // TODO
});

socket.on("end game failure", function (data) {
  // TODO
});
