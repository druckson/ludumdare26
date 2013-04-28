var express = require("express");
var path = require("path");
var app = express();
app.use(express.logger());
app.use(express.static(path.join(__dirname, 'site'), {maxAge: 300000}));

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

