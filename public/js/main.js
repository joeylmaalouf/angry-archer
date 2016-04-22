var socket = io.connect();
var messageText, createGameText, joinGameText;
var createGameButton, joinGameButton, endGameButton;
var viewport;
var isHost, inGame;

$(document).ready(function () {
  messageText = $("#messageText");
  createGameText = $("#createGameText");
  joinGameText = $("#joinGameText");
  createGameButton = $("#createGameButton");
  joinGameButton = $("#joinGameButton");
  endGameButton = $("#endGameButton");
  viewport = $("#viewport");
  
  createGameButton.click(function () {
    isHost = true;
    socket.emit("create game", {});
  });

  joinGameButton.click(function () {
    isHost = false;
    socket.emit("join game", { gameID: joinGameText.val().replace(/\s+/g, "") });
  });

  endGameButton.click(function () {
    isHost = undefined;
    socket.emit("end game", {});
  });
  
  joinLobby({});
});

$(document).keydown(function (event) {
  if (inGame) {
    switch (event.keyCode) {
      case 32: // space
        socket.emit("play game", {});
        break;
      case 27: // esc
        socket.emit("pause game", {});
        break;
      default:
    }
  }
});

var joinLobby = function (data) {
  messageText.text("You are not currently in a game.");
  createGameText.text("");
  joinGameText.val("");
  createGameButton.prop("disabled", false);
  joinGameButton.prop("disabled", false);
  joinGameText.prop("disabled", false);
  endGameButton.prop("disabled", true);
  viewport.hide();
  inGame = false;
};

var joinWaiting = function (data) {
  messageText.text("Your game ID is: " + data.gameID);
  createGameText.text("Waiting for player " + data.otherPlayer + "...");
  joinGameText.val("");
  createGameButton.prop("disabled", true);
  joinGameButton.prop("disabled", true);
  joinGameText.prop("disabled", true);
  endGameButton.prop("disabled", false);
  viewport.show();
  socket.emit("pause game", {});
  socket.emit("player ready", {});
  inGame = true;
};

var startGame = function (data) {
  if (Physics) {
    Physics.util.ticker.start();
  }
};

var stopGame = function (data) {
  if (Physics) {
    Physics.util.ticker.stop();
  }
};

var beginWorld = function (data) {
  createGameText.text("Welcome to Angry Archer!");
  socket.emit("play game", {});
};

var getWorld = function (data) {
  var state = $.map(world._bodies, function (value) {
    return {
      uid: value.uid,
      name: value.name,
      radius: value.radius,
      height: value.height,
      width: value.width,
      state: value.state
    };
  });
  socket.emit("world state", {
    player: data.player,
    world: state
  });
};

var setWorld = function (data) {
  updateWorld(data.world);
};

var parseInput = function (data) {
  switch (data.type) {
    case "poke":
      interactionPoke(data.pos);
      break;
    case "move":
      interactionMove(data.pos);
      break;
    case "release":
      interactionRelease();
      break;
    default:
  }
};
var attractor, attractorIndex;
setInterval(function () {
  attractor = Physics.behavior("attractor", {
    order: 0,
    strength: 0.00
  });
}, 500);
var interactionPoke = function (pos) {
  world.wakeUpAll();
  attractor.position(pos);
  world.add(attractor);
  attractorIndex = world._behaviors.length-1;
};
var interactionMove = function (pos) {
  attractor.position(pos);
};
var interactionRelease = function () {
  world.wakeUpAll();
  world.remove(world._behaviors[attractorIndex]);
};

socket.on("create game success", joinWaiting);
socket.on("create game failure", function (data) { alert("Error: failed to create game."); });
socket.on("join game success", joinWaiting);
socket.on("join game failure", function (data) { alert("Error: failed to join game."); });
socket.on("end game success", joinLobby);
socket.on("end game failure", function (data) { alert("Error: failed to end game."); });
socket.on("play game success", startGame);
socket.on("play game failure", function (data) { alert("Error: failed to play game."); });
socket.on("pause game success", stopGame);
socket.on("pause game failure", function (data) { alert("Error: failed to pause game."); });
socket.on("begin simulation", beginWorld);
socket.on("get world state", getWorld);
socket.on("set world state", setWorld);
socket.on("interaction", parseInput);
