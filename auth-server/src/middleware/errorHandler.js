// Express knows this is an error handler because it has 4 parameters.
module.exports = (err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
};