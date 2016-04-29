var socket = io.connect();
var messageText, createGameText, joinGameText, IDText;
var createGameButton, joinGameButton, endGameButton;
var soldierButton, goldText, goldCount;
var viewport;
var inGame;
var gold, goldIntervalID;

$(document).ready(function () {
  messageText = $("#messageText");
  createGameText = $("#createGameText");
  joinGameText = $("#joinGameText");
  IDText = $("#IDText");
  createGameButton = $("#createGameButton");
  joinGameButton = $("#joinGameButton");
  endGameButton = $("#endGameButton");
  soldierButton = $("#soldierButton");
  goldText = $("#goldText");
  goldCount = $("#goldCount");
  viewport = $("#viewport");
  
  createGameButton.click(function () {
    socket.emit("create game", {});
  });

  joinGameButton.click(function () {
    socket.emit("join game", { gameID: joinGameText.val().replace(/\s+/g, "") });
  });

  endGameButton.click(function () {
    socket.emit("end game", {});
  });

  soldierButton.click(function () {
    if (inGame && gold >= 10) {
      gold -= 10;
      socket.emit("spawn entity", { type: "soldier" });
    }
  });

  gold = 0;
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
  IDText.hide().val("");
  createGameText.text("");
  joinGameText.val("");
  createGameButton.prop("disabled", false);
  joinGameButton.prop("disabled", false);
  joinGameText.prop("disabled", false);
  endGameButton.prop("disabled", true);
  soldierButton.hide();
  goldText.hide();
  viewport.hide();
  inGame = false;
  clearWorld();
};

var joinWaiting = function (data) {
  messageText.text("Your game ID is: ");
  IDText.show().val(data.gameID);
  createGameText.text("Waiting for player " + data.otherPlayer + "...");
  joinGameText.val("");
  createGameButton.prop("disabled", true);
  joinGameButton.prop("disabled", true);
  joinGameText.prop("disabled", true);
  endGameButton.prop("disabled", false);
  soldierButton.hide();
  goldText.hide();
  viewport.show();
  socket.emit("pause game", {});
  socket.emit("player ready", {});
  inGame = false;
};

var gainGold = function () {
  ++gold;
  goldCount.text("000".substring(0, 3 - gold.toString().length) + gold);
}

var startGame = function (data) {
  goldIntervalID = setInterval(gainGold, 1000);
  if (Physics) {
    Physics.util.ticker.start();
  }
};

var stopGame = function (data) {
  clearInterval(goldIntervalID);
  if (Physics) {
    Physics.util.ticker.stop();
  }
};

var beginWorld = function (data) {
  inGame = true;
  soldierButton.show();
  goldText.show();
  createWorld();
  createGameText.text("Welcome to Angry Archer!");
  socket.emit("play game", {});
};

var getWorld = function (data) {
  var getConfig = function (body) {
    return {
      uid: body.uid,
      team: body.team,
      category: body.category,
      name: body.name,
      state: body.state,
      x: body.state.pos.x,
      y: body.state.pos.y,
      vx: body.state.vel.vx,
      vy: body.state.vel.vy,
      angle: body.state.angular.pos,
      angularVelocity: body.state.angular.vel,
      width: body.width,
      height: body.height,
      radius: body.radius,
      vertices: body.vertices,
      mass: body.mass,
      cof: body.cof,
      restitution: body.restitution,
      treatment: body.treatment,
      styles: body.styles,
      children: $.map(body.children, getConfig)
    };
  };
  var state = $.map(world._bodies, getConfig);
  socket.emit("world state", {
    world: state
  });
};

var setWorld = function (data) {
  updateWorld(data.world);
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
socket.on("soldier spawned", hireSoldier);
socket.on("arrow spawned", fireArrow);
