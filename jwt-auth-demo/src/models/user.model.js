// In-memory "database" for demo purposes. Data resets when the server restarts.
const users = [];
let nextId = 1;

module.exports = {
  findByEmail: (email) => users.find((u) => u.email === email),
  findByUsername: (username) => users.find((u) => u.username === username),
  findById: (id) => users.find((u) => u.id === id),
  findAll: () => users,
  create: ({ name, username, email, bio, passwordHash }) => {
    const user = { id: nextId++, name, username, email, bio: bio || "", passwordHash };
    users.push(user);
    return user;
  },
};