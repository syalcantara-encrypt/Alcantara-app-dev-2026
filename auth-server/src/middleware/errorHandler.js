// 4 arguments = Express knows this is the error handler
module.exports = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error(err);                       // show the real error in the terminal only
    return res.status(500).json({ error: "Server error" });
  }
  res.status(status).json({ error: err.message });
};