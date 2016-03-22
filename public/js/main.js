var socket = io.connect();

var clientID;

socket.on("set id", function (data) {
  clientID = data.id;
  $("#myID").html(clientID);
});

socket.on("chat message", function (data) {
  $("#messagelist").append($("<li>").text(data.id + ": " + data.text));
});

var sendMessage = function () {
  socket.emit("chat message", {
    "id": clientID,
    "text": $("#messagebox").val()
  });
  $("#messagebox").val("");
};
