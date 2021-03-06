process.env.NODE_ENV = "test";

const request = require("supertest");
const connection = require("../db/connection");
const app = require("../app");
const chai = require("chai");
const { expect } = chai;
chai.use(require("chai-sorted"));

const apiData = require("../endpoints.json");
beforeEach(() => connection.seed.run());
after(() => connection.destroy());

describe("/notARoute", () => {
  it("status 404: when route is not found", () => {
    return request(app)
      .get("/notARoute")
      .expect(404)
      .then(response => {
        const { msg } = response.body;
        expect(msg).to.equal("Route not found");
      });
  });
});

describe("/api", () => {
  describe("GET", () => {
    it("status 200: returns an json representation of all the available endpoints of the api", () => {
      return request(app)
        .get("/api")
        .expect(200)
        .then(response => {
          const { api } = response.body;
          expect(api).to.deep.equal(apiData);
        });
    });
  });

  describe("INVALID METHODS", () => {
    it("status 405: returns an error message when client uses an invalid message", () => {
      const methods = ["patch", "post", "delete", "put"];
      const promises = methods.map(method => {
        return request(app)
          [method]("/api")
          .expect(405)
          .then(response => {
            const { msg } = response.body;
            expect(msg).to.equal("Invalid method");
          });
      });
      return Promise.all(promises);
    });
  });

  describe("/topics", () => {
    describe("GET", () => {
      it("status 200: returns an array of topic objects with slug and description properties", () => {
        return request(app)
          .get("/api/topics")
          .expect(200)
          .then(response => {
            const { topics } = response.body;
            expect(topics).to.be.an("array");
            const [topic] = topics;
            expect(topic).to.have.all.keys(["slug", "description"]);
          });
      });
    });

    describe("INVALID METHODS", () => {
      it("status 405: returns an error message when client uses an invalid method", () => {
        const methods = ["patch", "post", "delete", "put"];
        const promises = methods.map(method => {
          return request(app)
            [method]("/api/topics")
            .expect(405)
            .then(response => {
              const { msg } = response.body;
              expect(msg).to.equal("Invalid method");
            });
        });
        return Promise.all(promises);
      });
    });
  });

  describe("/users", () => {
    // describe("GET", () => {
    //   it("status 200: returns an array of user objects", () => {
    //     return request(app)
    //       .get("/api/users")
    //       .expect(200)
    //       .then(response => {
    //         const { users } = response.body;
    //         const [user] = users;
    //         expect(user).to.have.all.keys([]);
    //       });
    //   });
    // });

    describe("/:username", () => {
      describe("GET", () => {
        it("status 200: returns a user object with username, avatar_url and name properties", () => {
          return request(app)
            .get("/api/users/lurker")
            .expect(200)
            .then(response => {
              const { user } = response.body;
              expect(user).to.have.all.keys(["username", "avatar_url", "name"]);
            });
        });

        it("status 404: returns an error message if the username does not exist", () => {
          return request(app)
            .get("/api/users/idonotexist")
            .expect(404)
            .then(response => {
              const { msg } = response.body;
              expect(msg).to.equal("User not found");
            });
        });
      });

      describe("INVALID METHODS", () => {
        it("status 405: returns an error message when client uses an invalid method", () => {
          const methods = ["patch", "post", "delete", "put"];
          const promises = methods.map(method => {
            return request(app)
              [method]("/api/users/lurker")
              .expect(405)
              .then(response => {
                const { msg } = response.body;
                expect(msg).to.equal("Invalid method");
              });
          });
          return Promise.all(promises);
        });
      });
    });
  });

  describe("/articles", () => {
    describe("GET", () => {
      it("status 200: returns an array of article objects which have specific properties", () => {
        return request(app)
          .get("/api/articles")
          .expect(200)
          .then(response => {
            const { articles } = response.body;
            expect(articles).to.be.an("array");
            const [article, secondArticle] = articles;
            expect(article).to.have.all.keys([
              "author",
              "title",
              "article_id",
              "topic",
              "created_at",
              "votes",
              "body",
              "comment_count"
            ]);
            expect(secondArticle.article_id).to.equal(2);
          });
      });

      it("status 200: has a total_count property that represents the total number of articles", () => {
        return request(app)
          .get("/api/articles")
          .expect(200)
          .then(response => {
            const { total_count } = response.body;
            expect(+total_count).to.equal(12);
          });
      });

      it("status 200: returns an array of article objects limited to 10 by default", () => {
        return request(app)
          .get("/api/articles")
          .expect(200)
          .then(response => {
            const { articles } = response.body;
            expect(articles.length).to.equal(10);
          });
      });

      it("status 200: returns an array of article objects limited by a limit query", () => {
        return request(app)
          .get("/api/articles?limit=12")
          .expect(200)
          .then(response => {
            const { articles } = response.body;
            expect(articles.length).to.equal(12);
          });
      });

      it("status 200: returns an array of article objects on a specific page", () => {
        return request(app)
          .get("/api/articles?p=2")
          .expect(200)
          .then(response => {
            const { articles } = response.body;
            const [firstArticle] = articles;
            expect(firstArticle.article_id).to.equal(11);
          });
      });

      it("status 200: returns an array of article objects sorted by created_at in descending order by default", () => {
        return request(app)
          .get("/api/articles")
          .expect(200)
          .then(response => {
            const { articles } = response.body;
            expect(articles).to.be.descendingBy("created_at");
          });
      });

      it("status 200: returns an array of article objects sorted by a sort_by query", () => {
        //"comment_count",
        const sorts = ["author"];
        const promises = sorts.map(sort => {
          return request(app)
            .get(`/api/articles?sort_by=${sort}`)
            .expect(200)
            .then(response => {
              const { articles } = response.body;
              // const commentCountToNumber/articles?sort = articles.map(article => ({
              //   ...article,
              //   comment_count: +article.comment_count
              // }));
              //commentCountToNumber
              expect(articles).to.be.descendingBy(sort);
            });
        });
        return Promise.all(promises);
      });

      it("status 200: returns an array of article objects sorted by created_at in the order specified by the query", () => {
        return request(app)
          .get("/api/articles?order=asc")
          .expect(200)
          .then(response => {
            const { articles } = response.body;
            expect(articles).to.be.ascendingBy("created_at");
          });
      });

      it("status 200: returns an array of article objects filtered by author", () => {
        const authors = ["butter_bridge", "icellusedkars"];
        const promises = authors.map(authorName => {
          return request(app)
            .get(`/api/articles?author=${authorName}`)
            .expect(200)
            .then(response => {
              const { articles } = response.body;
              const shouldHaveSameAuthor = articles.every(
                ({ author }) => author === authorName
              );
              expect(shouldHaveSameAuthor).to.be.true;
            });
        });
        return Promise.all(promises);
      });

      it("status 200: returns an array of article objects filtered by topic", () => {
        return request(app)
          .get("/api/articles?topic=mitch")
          .expect(200)
          .then(response => {
            const { articles } = response.body;
            const shouldHaveSameTopic = articles.every(
              ({ topic }) => topic === "mitch"
            );
            expect(shouldHaveSameTopic).to.be.true;
          });
      });

      it("status 400: returns an error message if limit is invalid", () => {
        return request(app)
          .get("/api/articles?limit=banana")
          .expect(400)
          .then(response => {
            const { msg } = response.body;
            expect(msg).to.equal("Invalid limit query");
          });
      });

      it("status 404: returns an error message if the author does not exist", () => {
        return request(app)
          .get("/api/articles?author=jimbo")
          .expect(404)
          .then(response => {
            const { msg } = response.body;
            expect(msg).to.deep.equal("User not found");
          });
      });

      it("status 404: returns an error message if the topic does not exist", () => {
        return request(app)
          .get("/api/articles?topic=bananas")
          .expect(404)
          .then(response => {
            const { msg } = response.body;
            expect(msg).to.deep.equal("Topic not found");
          });
      });

      it("status 200: handles multiple queries", () => {
        return request(app)
          .get("/api/articles?topic=mitch&sort_by=votes&order=asc")
          .expect(200)
          .then(response => {
            const { articles } = response.body;
            const shouldHaveSameTopic = articles.every(
              ({ topic }) => topic === "mitch"
            );
            expect(shouldHaveSameTopic).to.be.true;
            expect(articles).to.be.ascendingBy("votes");
          });
      });

      it("status 400: returns an error message if sort_by is invalid", () => {
        return request(app)
          .get("/api/articles?sort_by=invalid")
          .expect(400)
          .then(response => {
            const { msg } = response.body;
            expect(msg).to.equal("Invalid query parameter");
          });
      });

      it("status 400: returns an error message if order is invalid", () => {
        return request(app)
          .get("/api/articles?order=invalid")
          .expect(400)
          .then(response => {
            const { msg } = response.body;
            expect(msg).to.equal("Invalid order query");
          });
      });
    });

    describe("INVALID METHODS", () => {
      it("status 405: returns an error message when client uses an invalid method", () => {
        const methods = ["patch", "post", "delete", "put"];
        const promises = methods.map(method => {
          return request(app)
            [method]("/api/articles")
            .expect(405)
            .then(response => {
              const { msg } = response.body;
              expect(msg).to.equal("Invalid method");
            });
        });
        return Promise.all(promises);
      });
    });

    describe("/:article_id", () => {
      describe("GET", () => {
        it("status 200: returns an article object with specific properties", () => {
          return request(app)
            .get("/api/articles/2")
            .expect(200)
            .then(response => {
              const { article } = response.body;
              expect(article).to.have.all.keys([
                "author",
                "title",
                "article_id",
                "body",
                "topic",
                "created_at",
                "votes",
                "comment_count"
              ]);
            });
        });

        it("status 400: returns an error message when the article_id is invalid", () => {
          return request(app)
            .get("/api/articles/hello")
            .expect(400)
            .then(response => {
              const { msg } = response.body;
              expect(msg).to.equal("Invalid article id");
            });
        });

        it("status 404: returns an error message when the article_id does not exist", () => {
          return request(app)
            .get("/api/articles/9000")
            .expect(404)
            .then(response => {
              const { msg } = response.body;
              expect(msg).to.equal("Article not found");
            });
        });
      });

      describe("PATCH", () => {
        it("status 200: returns an article object with updated properties", () => {
          return request(app)
            .patch("/api/articles/1")
            .send({ inc_votes: 1 })
            .expect(200)
            .then(response => {
              const { article } = response.body;
              expect(article).to.have.all.keys([
                "article_id",
                "author",
                "title",
                "body",
                "topic",
                "created_at",
                "votes"
              ]);
            });
        });

        it("status 200: handles incrementing votes", () => {
          return request(app)
            .patch("/api/articles/1")
            .send({ inc_votes: 50 })
            .expect(200)
            .then(response => {
              const { article } = response.body;
              expect(article.votes).to.equal(150);
            });
        });

        it("status 200: handles decrementing votes", () => {
          return request(app)
            .patch("/api/articles/1")
            .send({ inc_votes: -50 })
            .expect(200)
            .then(response => {
              const { article } = response.body;
              expect(article.votes).to.equal(50);
            });
        });
        it("status 200: ignores extra properties on the body", () => {
          return request(app)
            .patch("/api/articles/1")
            .send({ inc_votes: 1, name: "Mitch" })
            .expect(200)
            .then(response => {
              const { article } = response.body;
              expect(article).to.have.all.keys([
                "article_id",
                "author",
                "title",
                "body",
                "topic",
                "created_at",
                "votes"
              ]);
            });
        });

        it("status 400: returns an error message if article id is not a number", () => {
          return request(app)
            .patch("/api/articles/notANumber")
            .send({ inc_votes: 50 })
            .expect(400)
            .then(response => {
              const { msg } = response.body;
              expect(msg).to.equal("Invalid article id");
            });
        });

        it("status 200: returns an unchanged article object if inc_votes is missing", () => {
          return request(app)
            .patch("/api/articles/1")
            .send({})
            .expect(200)
            .then(response => {
              const { article } = response.body;
              expect(article).to.have.all.keys([
                "article_id",
                "author",
                "title",
                "body",
                "topic",
                "created_at",
                "votes"
              ]);
              expect(article.votes).to.equal(100);
            });
        });

        it("status 400: returns an error message if inc_votes is not a number", () => {
          return request(app)
            .patch("/api/articles/1")
            .send({ inc_votes: "notANumber" })
            .expect(400)
            .then(response => {
              const { msg } = response.body;
              expect(msg).to.equal("inc_votes must be a number");
            });
        });

        it("status 404: returns an error message if article_id does not exist", () => {
          return request(app)
            .patch("/api/articles/9000")
            .send({ inc_votes: 50 })
            .expect(404)
            .then(response => {
              const { msg } = response.body;
              expect(msg).to.equal("Article not found");
            });
        });
      });

      describe("INVALID METHODS", () => {
        it("status 405: returns an error message when client uses an invalid method", () => {
          const methods = ["post", "delete", "put"];
          const promises = methods.map(method => {
            return request(app)
              [method]("/api/articles/1")
              .expect(405)
              .then(response => {
                const { msg } = response.body;
                expect(msg).to.equal("Invalid method");
              });
          });
          return Promise.all(promises);
        });
      });

      describe("/comments", () => {
        describe("POST", () => {
          it("status 201: returns an updated comment object", () => {
            return request(app)
              .post("/api/articles/1/comments")
              .send({ username: "lurker", body: "Fantastic article" })
              .expect(201)
              .then(response => {
                const { comment } = response.body;
                expect(comment).to.have.all.keys([
                  "comment_id",
                  "author",
                  "article_id",
                  "votes",
                  "created_at",
                  "body"
                ]);
              });
          });

          it("status 400: returns an error message if comment body is empty", () => {
            return request(app)
              .post("/api/articles/1/comments")
              .send({ username: "lurker", body: "" })
              .expect(400)
              .then(response => {
                const { msg } = response.body;
                expect(msg).to.equal("You can't post an empty comment!");
              });
          });

          it("status 400: returns an error message if username is empty", () => {
            return request(app)
              .post("/api/articles/1/comments")
              .send({ username: "", body: "Fantastic article" })
              .expect(400)
              .then(response => {
                const { msg } = response.body;
                expect(msg).to.equal(
                  "You can't post a comment without a username!"
                );
              });
          });

          it("status 400: returns an error message if the article_id is invalid", () => {
            return request(app)
              .post("/api/articles/invalid/comments")
              .send({ username: "lurker", body: "Fantastic article" })
              .expect(400)
              .then(response => {
                const { msg } = response.body;
                expect(msg).to.equal("Invalid article_id");
              });
          });

          it("status 404: returns an error message if the article_id does not exist", () => {
            return request(app)
              .post("/api/articles/9000/comments")
              .send({ username: "lurker", body: "Fantastic article" })
              .expect(404)
              .then(response => {
                const { msg } = response.body;
                expect(msg).to.equal("Article not found");
              });
          });

          it("status 422: returns an error message if the username does not exist", () => {
            return request(app)
              .post("/api/articles/1/comments")
              .send({ username: "Thanh", body: "Fantastic article" })
              .expect(422)
              .then(response => {
                const { msg } = response.body;
                expect(msg).to.equal("Unprocessable entity");
              });
          });
        });

        describe("GET", () => {
          it("status 200: returns an array of comment objects which have comment_id, votes, created_at, author and body properties", () => {
            return request(app)
              .get("/api/articles/1/comments")
              .expect(200)
              .then(response => {
                const { comments } = response.body;
                expect(comments).to.be.an("array");
                const [comment] = comments;
                expect(comment).to.have.all.keys([
                  "comment_id",
                  "votes",
                  "created_at",
                  "author",
                  "body"
                ]);
              });
          });

          it("status 200: returns an array of comment objects limited by a default of 10", () => {
            return request(app)
              .get("/api/articles/1/comments")
              .expect(200)
              .then(response => {
                const { comments } = response.body;
                expect(comments.length).to.equal(10);
              });
          });

          it("status 200: returns an array of comment objects limited by a limit query", () => {
            return request(app)
              .get("/api/articles/1/comments?limit=13")
              .expect(200)
              .then(response => {
                const { comments } = response.body;
                expect(comments.length).to.equal(13);
              });
          });

          it("status 200: returns an array of comments objects on a specific page", () => {
            return request(app)
              .get("/api/articles/1/comments?p=2")
              .expect(200)
              .then(response => {
                const { comments } = response.body;
                expect(comments.length).to.equal(3);
              });
          });

          it("status 200: returns an array of comment objects, sorted by created_at in descending order by default", () => {
            return request(app)
              .get("/api/articles/1/comments")
              .expect(200)
              .then(response => {
                const { comments } = response.body;
                expect(comments).to.be.descendingBy("created_at");
              });
          });

          it("status 200: returns an array of comment objects sorted by a sort_by query column", () => {
            return request(app)
              .get("/api/articles/1/comments?sort_by=votes")
              .expect(200)
              .then(response => {
                const { comments } = response.body;
                expect(comments).to.be.descendingBy("votes");
              });
          });

          it("status 200: returns an array of comment objects in an order specified by the query", () => {
            return request(app)
              .get("/api/articles/1/comments?order=asc")
              .expect(200)
              .then(response => {
                const { comments } = response.body;
                expect(comments).to.be.ascendingBy("created_at");
              });
          });

          it("status 200: handles multiple queries", () => {
            return request(app)
              .get("/api/articles/1/comments?order=asc&sort_by=author")
              .expect(200)
              .then(response => {
                const { comments } = response.body;
                expect(comments).to.be.ascendingBy("author");
              });
          });

          it("status 400: returns an error message if the article_id is invalid", () => {
            return request(app)
              .get("/api/articles/hello/comments")
              .expect(400)
              .then(response => {
                const { msg } = response.body;
                expect(msg).to.equal("Invalid article id");
              });
          });

          it("status 400: returns an error message if sort_by is invalid", () => {
            return request(app)
              .get("/api/articles/1/comments?sort_by=invalid")
              .expect(400)
              .then(response => {
                const { msg } = response.body;
                expect(msg).to.equal("Invalid query parameter");
              });
          });

          it("status 400: returns an error message if order is invalid", () => {
            return request(app)
              .get("/api/articles/1/comments?order=invalid")
              .expect(400)
              .then(response => {
                const { msg } = response.body;
                expect(msg).to.equal("Invalid order query");
              });
          });

          it("status 404: returns an error message if the article_id does not exist", () => {
            return request(app)
              .get("/api/articles/9000/comments")
              .expect(404)
              .then(response => {
                const { msg } = response.body;
                expect(msg).to.equal("Article not found");
              });
          });
        });

        describe("INVALID METHODS", () => {
          it("status 405: returns an error message when client uses an invalid method", () => {
            const methods = ["patch", "delete", "put"];
            const promises = methods.map(method => {
              return request(app)
                [method]("/api/articles/1/comments")
                .expect(405)
                .then(response => {
                  const { msg } = response.body;
                  expect(msg).to.equal("Invalid method");
                });
            });
            return Promise.all(promises);
          });
        });
      });
    });
  });

  describe("/comments", () => {
    describe("/:comment_id", () => {
      describe("PATCH", () => {
        it("status 200: returns an updated comment object with the expected properties", () => {
          return request(app)
            .patch("/api/comments/1")
            .send({ inc_votes: 1 })
            .expect(200)
            .then(response => {
              const { comment } = response.body;

              expect(comment).to.have.all.keys([
                "comment_id",
                "author",
                "article_id",
                "votes",
                "created_at",
                "body"
              ]);
            });
        });

        it("status 200: ignores extra properties on the body", () => {
          return request(app)
            .patch("/api/comments/1")
            .send({ inc_votes: 1, name: "Mitch" })
            .expect(200)
            .then(response => {
              const { comment } = response.body;

              expect(comment).to.have.all.keys([
                "comment_id",
                "author",
                "article_id",
                "votes",
                "created_at",
                "body"
              ]);
            });
        });

        it("status 200: returns an updated comment object with incremented votes", () => {
          return request(app)
            .patch("/api/comments/1")
            .send({ inc_votes: 200 })
            .expect(200)
            .then(response => {
              const { comment } = response.body;

              expect(comment.votes).to.equal(216);
            });
        });

        it("status 200: returns an updated comment object with decremented votes", () => {
          return request(app)
            .patch("/api/comments/1")
            .send({ inc_votes: -200 })
            .expect(200)
            .then(response => {
              const { comment } = response.body;

              expect(comment.votes).to.equal(-184);
            });
        });

        it("status 200: returns an unchanged message object if inc_votes is missing", () => {
          return request(app)
            .patch("/api/comments/1")
            .send({})
            .expect(200)
            .then(response => {
              const { comment } = response.body;
              expect(comment).to.have.all.keys([
                "comment_id",
                "author",
                "article_id",
                "votes",
                "created_at",
                "body"
              ]);
              expect(comment.votes).to.equal(16);
            });
        });

        it("status 400: returns an error message if inc_votes is invalid", () => {
          return request(app)
            .patch("/api/comments/1")
            .send({ inc_votes: "hello" })
            .expect(400)
            .then(response => {
              const { msg } = response.body;

              expect(msg).to.equal("Invalid body parameter inc_votes");
            });
        });

        it("status 400: returns an error message if comment_id is invalid", () => {
          return request(app)
            .patch("/api/comments/hello")
            .send({ inc_votes: 1 })
            .expect(400)
            .then(response => {
              const { msg } = response.body;

              expect(msg).to.equal("Invalid comment_id");
            });
        });

        it("status 404: returns an error message if comment_id does not exist", () => {
          return request(app)
            .patch("/api/comments/9000")
            .send({ inc_votes: 1 })
            .expect(404)
            .then(response => {
              const { msg } = response.body;

              expect(msg).to.equal("Comment not found");
            });
        });
      });

      describe("DELETE", () => {
        it("status 204: no content when a comment is successfully deleted", () => {
          return request(app)
            .delete("/api/comments/1")
            .expect(204);
        });

        it("status 400: returns an error message when the comment_id is invalid", () => {
          return request(app)
            .delete("/api/comments/hello")
            .expect(400)
            .then(response => {
              const { msg } = response.body;
              expect(msg).to.equal("Invalid comment_id");
            });
        });

        it("status 404: returns an error message when the comment_id does not exist", () => {
          return request(app)
            .delete("/api/comments/9000")
            .expect(404)
            .then(response => {
              const { msg } = response.body;
              expect(msg).to.equal("Comment not found");
            });
        });
      });

      describe("INVALID METHODS", () => {
        it("status 405: returns an error message when client uses an invalid method", () => {
          const methods = ["get", "post", "put"];
          const promises = methods.map(method => {
            return request(app)
              [method]("/api/comments/1")
              .expect(405)
              .then(response => {
                const { msg } = response.body;
                expect(msg).to.equal("Invalid method");
              });
          });
          return Promise.all(promises);
        });
      });
    });
  });
});
