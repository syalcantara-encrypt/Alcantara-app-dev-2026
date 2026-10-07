const User = require("../models/user.model");

// Never send passwordHash to the client
const toPublic = ({ id, name, username, email, bio }) => ({ id, name, username, email, bio });

exports.getMe = (req, res) => {
  const user = User.findById(req.user.userId); // req.user was set by the auth middleware
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json(toPublic(user));
};  

exports.getAllUsers = (req, res) => {
  res.json(User.findAll().map(toPublic));
};