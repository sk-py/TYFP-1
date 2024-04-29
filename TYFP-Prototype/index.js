const express = require("express");
const app = express();

const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));

app.get("/api/user", (req, res) => {
  res.send("User route hitted");
});
