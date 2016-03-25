var path = require("path");

var home = function (req, res) {
  res.sendFile("main.html", { root: path.join(__dirname, "../public") });
};

module.exports = {
  home: home
};
