const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;  

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect("mongodb+srv://sherylabiju:xJ6mO99MJR8T6GjA@cluster0.nalmr.mongodb.net/movie_database")
.then(() => console.log("Connected to MongoDB"))
.catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);  
});

// Define User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    genre: { type: String, required: true }
});

// Create User Model
const User = mongoose.model("User", userSchema, "users");

// **Login Route**
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("Received email:", email);
    console.log("Received password:", password);

    try {
        const user = await User.findOne({ email });

        if (user) {
            console.log("User found:", user);
            if (user.password === password) {
                res.status(200).json({ message: "Login successful", success: true, genres: user.genre });
            } else {
                res.status(401).json({ message: "Invalid email or password", success: false });
            }
        } else {
            res.status(401).json({ message: "Invalid email or password", success: false });
        }
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error", success: false });
    }
});


app.post("/signup", async (req, res) => {
    const { email, password, genre } = req.body;

    // Check if the email already exists
    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "Email already exists", success: false });
        }

        // Create a new user
        const newUser = new User({
            email,
            password,
            genre
        });

        // Save the new user to the database
        await newUser.save();
        res.status(201).json({ message: "User registered successfully", success: true });
    } catch (err) {
        console.error("Sign-up error:", err);
        res.status(500).json({ message: "Server error", success: false });
    }
});

const movieSchema = new mongoose.Schema({
    Title: String,
    Genre: String,
    Director: String,
    Actors: String,
    Poster_url: String,
    Imdb_link: String
});

const Movie = mongoose.model("Movie", movieSchema, "movies");
app.get("/movies", async (req, res) => {
    let { genre, random } = req.query;

    if (!genre || genre.length === 0) {
        return res.status(400).json({ message: "Genre is required" });
    }

    try {
        genre = JSON.parse(genre);
        const regexQueries = genre.map(g => new RegExp(`\\b${g}\\b`, "i"));

        let movies;
        if (random === "true") {
            // Use aggregation to get random movies
            movies = await Movie.aggregate([
                { $match: { Genre: { $in: regexQueries } } },
                { $sample: { size: 4 } } // Select 4 random movies
            ]);
        } else {
            // Standard find query without randomization
            movies = await Movie.find({ Genre: { $in: regexQueries } }).limit(4);
        }

        res.json(movies);
    } catch (err) {
        console.error("Error fetching movies:", err);
        res.status(500).json({ message: "Server error" });
    }
});



// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
