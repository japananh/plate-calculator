const express = require("express");
const app = express();

// use the express-static middleware
app.use(express.static("public"));

// define the first route
app.get("/", function (_, res) {
  res.send("/pubic/index.html");
});

// start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is running on port ${port}.`));
