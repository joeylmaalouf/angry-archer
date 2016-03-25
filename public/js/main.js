var socket = io.connect();

var gameID;

socket.on("set game id", function (data) {
  gameID = data.gameID;
  $("#gameID").text(gameID);
});

var createGame = function () {
  endGame();
  socket.emit("create game", {});
  $("#createGameID").text("Waiting for player 2 to join...");
};

var joinGame = function () {
  socket.emit("join game", {
    gameID: $("#joinGameID").val()
  });
  $("#joinGameID").val("");
};

var endGame = function () {
  socket.emit("end game", {
    gameID: gameID
  });
  gameID = null;
  $("#gameID").text("You are not currently in a game.");
  $("#createGameID").text("");
};
