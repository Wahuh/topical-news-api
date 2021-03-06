const { selectTopics } = require("../models/topics-model");

const getTopics = (req, res, next) => {
  selectTopics()
    .then(topics => {
      res.status(200).json({ topics });
    })
    .catch(next);
};

module.exports = { getTopics };
