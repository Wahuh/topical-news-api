const usersRouter = require("express").Router();
const { getUserByUsername } = require("../controllers/users-controller");
const { handle405Errors } = require("../errors");

usersRouter
  .route("/:username")
  .get(getUserByUsername)
  .all(handle405Errors);

module.exports = usersRouter;
