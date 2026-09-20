const express = require("express");
const path = require("path");
const users = require("./users.js");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ==================== SIGNUP ====================

app.post("/signup", (req, res) => {
    const { email, username, password } = req.body;

    // Check if any field is empty
    if (!email || !username || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    // Check if username already exists
    const existingUser = users.find(
        user => user.username === username
    );

    if (existingUser) {
        return res.status(409).json({
            message: "Username already exists"
        });
    }

    // Create new user
    const newUser = {
        id: users.length + 1,
        email: email,
        username: username,
        password: password
    };

    // Store new user
    users.push(newUser);

    // Successful signup
    res.status(201).json({
        message: "Signup successful",
        user: newUser
    });
});

// ==================== LOGIN ====================

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Check if any field is empty
    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }

    // Find existing user
    const user = users.find(
        user =>
            user.username === username &&
            user.password === password
    );

    // User does not exist / wrong credentials
    if (!user) {
        return res.status(401).json({
            message: "Invalid username or password"
        });
    }

    // Successful login
    res.status(200).json({
        message: "Login successful",
        user: user
    });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});