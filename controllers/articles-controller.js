const {
  selectArticles,
  selectArticleById,
  updateArticle
} = require("../models/articles-model");

const getArticles = (req, res, next) => {
  selectArticles(req.query)
    .then(({ articles, total_count }) => {
      res.status(200).json({ articles, total_count });
    })
    .catch(next);
};

const getArticleById = (req, res, next) => {
  const { article_id } = req.params;
  selectArticleById({ article_id })
    .then(article => {
      res.status(200).json({ article });
    })
    .catch(next);
};

const patchArticle = (req, res, next) => {
  const { article_id } = req.params;
  updateArticle({ body: req.body, article_id })
    .then(article => {
      res.status(200).json({ article });
    })
    .catch(next);
};

module.exports = { getArticles, getArticleById, patchArticle };
