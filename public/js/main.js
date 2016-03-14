var socket = io.connect();

var sendMessage = function () {
  socket.emit("chat message", $("#messagebox").val());
  $("#messagebox").val("");
};

socket.on("chat message", function (data) {
  $("#messagelist").append($("<li>").text(data));
});
