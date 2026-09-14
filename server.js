const express = require("express");
const users = require("./users.js");

const app = express();

app.use(express.json());

const PORT = 3000;

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// GET all users
app.get("/users", (req, res) => {
    res.json(users);
});

// POST a new user
app.post("/users", (req, res) => {
    const { name, email } = req.body;

    // Validation
    if (!name || !email) {
        return res.status(400).json({
            message: "Name and email are required"
        });
    }

    // Create new user
    const newUser = {
        id: users.length + 1,
        name,
        email
    };

    // Add user to array
    users.push(newUser);

    // Return created user
    res.status(201).json(newUser);
});

// PUT update an existing user
app.put("/users/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const { name, email } = req.body;

    // Find user
    const user = users.find(user => user.id === id);

    // Check if user exists
    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    // Validation
    if (!name || !email) {
        return res.status(400).json({
            message: "Name and email are required"
        });
    }

    // Update user
    user.name = name;
    user.email = email;

    // Return updated user
    res.json(user);
});

// DELETE a user
app.delete("/users/:id", (req, res) => {
    const id = parseInt(req.params.id);

    // Find user index
    const userIndex = users.findIndex(user => user.id === id);

    // Check if user exists
    if (userIndex === -1) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    // Delete user
    const deletedUser = users.splice(userIndex, 1);

    // Return deleted user
    res.json({
        message: "User deleted successfully",
        user: deletedUser[0]
    });
});