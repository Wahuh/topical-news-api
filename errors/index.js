const handle400Errors = (err, req, res, next) => {
  console.log(err);
  const { status, msg } = err;
  if (status === 400) {
    res.status(status).json({ msg });
  } else {
    next(err);
  }
};

const handle404Errors = (err, req, res, next) => {
  const codes = ["23503"];
  const { status, msg, code } = err;
  // if (codes.includes(code)) {
  //   res.status(status).json({ msg: err.message });
  // }
  if (status === 404) {
    res.status(status).json({ msg });
  } else {
    next(err);
  }
};

const handle422Errors = (err, req, res, next) => {
  const codes = ["23503"];
  const { status, msg, code } = err;
  if (codes.includes(code)) {
    res.status(422).json({ msg: "Unprocessable entity" });
  } else {
    next(err);
  }
};

const handle405Errors = (req, res, next) => {
  res.status(405).json({ msg: "invalid method" });
};

module.exports = { handle404Errors, handle400Errors, handle422Errors };