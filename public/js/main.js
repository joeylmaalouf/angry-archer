var socket = io.connect();
var messageText, createGameText, joinGameText;
var createGameButton, joinGameButton, endGameButton;
var viewport;

$(document).ready(function () {
  messageText = $("#messageText");
  createGameText = $("#createGameText");
  joinGameText = $("#joinGameText");
  createGameButton = $("#createGameButton");
  joinGameButton = $("#joinGameButton");
  endGameButton = $("#endGameButton");
  viewport = $("#viewport");
  
  createGameButton.click(function () {
    socket.emit("create game", {});
  });

  joinGameButton.click(function () {
    socket.emit("join game", { gameID: joinGameText.val() });
  });

  endGameButton.click(function () {
    socket.emit("end game", {});
  });
  
  joinLobby({});
});

var joinLobby = function (data) {
  messageText.text("You are not currently in a game.");
  createGameText.text("");
  joinGameText.val("");
  createGameButton.prop("disabled", false);
  joinGameButton.prop("disabled", false);
  joinGameText.prop("disabled", false);
  endGameButton.prop("disabled", true);
};

var joinWaiting = function (data) {
  messageText.text("Your game ID is: " + data.gameID);
  createGameText.text("Waiting for player " + data.otherPlayer + "...");
  joinGameText.val("");
  createGameButton.prop("disabled", true);
  joinGameButton.prop("disabled", true);
  joinGameText.prop("disabled", true);
  endGameButton.prop("disabled", false);
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
