// server.js
require("dotenv").config();


const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");
const User = require("./models/userModel.js");
const jwt = require("jsonwebtoken");
const path = require("path");


// Initialize express
const app = express();
app.use(express.json());

// MongoDB connection handling
let gfs;
const connectDB = async () => {

  if (mongoose.connections[0].readyState) {
    return; // Already connected
  }

  try {

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const conn = mongoose.connection;
    gfs = new GridFSBucket(conn.db, {
      bucketName: "uploads",
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to handle file upload
const handleFileUpload = upload.array("files");


// middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user ID and other data to req.user
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// app.use(authenticate);

// File upload endpoint
app.post("/api/upload", authenticate, async (req, res) => {
  try {
    await connectDB();

    // Use Promise to handle multer upload
    await new Promise((resolve, reject) => {
      handleFileUpload(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Validate user data from token
    if (!req.user || !req.user.id) {
      return res.status(400).json({ error: "Invalid user information" });
    }

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        // const writeStream = gfs.openUploadStream(file.originalname);
        const writeStream = gfs.openUploadStream(file.originalname, {
          metadata: {
            userId: req.user.id, // Store user ID in metadata
            username: req.user.username, // Optionally store username
          },
        });
        const readStream = require("stream").Readable.from(file.buffer);

        readStream
          .pipe(writeStream)
          .on("finish", () => resolve())
          .on("error", reject);
      });
    });

    await Promise.all(uploadPromises);
    res.status(200).json({ message: "Files uploaded successfully" });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Error uploading files" });
  }
});

// Get all files
app.get("/api/files", authenticate, async (req, res) => {
  try {
    await connectDB();
    // const files = await gfs.find().toArray();
    const files = await gfs
      .find({ "metadata.userId": req.user.id }) // Filter by user ID
      .toArray();

    res.json(
      files.map((file) => ({
        _id: file._id,
        filename: file.filename,
        size: file.length,
        uploadDate: file.uploadDate,
      }))
    )
  } catch (error) {
    console.error("Error getting files:", error);
    res.status(500).json({ error: "Error getting files" });
  }
});

// Download file
app.get("/api/files/:id/download", authenticate, async (req, res) => {
  try {
    await connectDB();

    // Fetch the file from the database
    const file = await gfs.find({ _id: new ObjectId(req.params.id) }).toArray();

    if (!file || file.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    // Check if the logged-in user uploaded the file
    if (file[0].metadata.userId !== req.user.id) {
      return res.status(403).json({ error: "You are not authorized to download this file" });
    }

    // Set response headers for file download
    res.set("Content-Type", "application/octet-stream");
    res.set(
      "Content-Disposition",
      `attachment; filename="${file[0].filename}"`
    );

    // Create a stream to download the file
    const downloadStream = gfs.openDownloadStream(new ObjectId(req.params.id));
    downloadStream.pipe(res);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Error downloading file" });
  }
});


// Middleware to validate ObjectId
const validateFileId = (req, res, next) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid file ID" });
  }
  next();
};

// Delete file
app.delete("/api/files/:id", validateFileId, authenticate, async (req, res) => {
  try {
    await connectDB();

    // Fetch the file from the database
    const file = await gfs.find({ _id: new ObjectId(req.params.id) }).toArray();

    if (!file || file.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    // Check if the logged-in user uploaded the file
    if (file[0].metadata.userId !== req.user.id) {
      return res.status(403).json({ error: "You are not authorized to delete this file" });
    }

    // Proceed to delete the file
    await gfs.delete(new ObjectId(req.params.id));
    res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Error deleting file" });
  }
});

// Sign-Up Route
app.post("/api/signup", async (req, res) => {
  try {
    await connectDB();
    const { username, password, name } = req.body;

    const errors = {};

    // Validate username
    if (!username || username.length < 3) {
      errors.username = "Username must be at least 3 characters long.";
    }

    // Validate password
    if (!password || password.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
    }

    // 'name' field is optional, no validation if it's empty
    if (name && name.length < 3) {
      errors.name = "Name must be at least 3 characters long.";
    }


    // Check for existing user (case-insensitive)
    const existingUser = await User.findOne({
      username: username.toLowerCase()
    });

    if (existingUser) {
      return res.status(400).json({ error: { username: "Username already exists." } });
    }
    // More specific error handling
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // Create new user
    const newUser = new User({
      username: username.toLowerCase(),
      password,
      name: name || ""
    });

    // Validate input before saving
    newUser.validateInput();

    // Save user
    await newUser.save();

    // Respond with success (avoid sending sensitive information)
    res.status(201).json({
      message: "User created successfully",
      userId: newUser._id
    });

  } catch (error) {
    console.error("Sign-Up Error:", error);
    // Generic server error
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login Route
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid username" });
    }
    const match = await user.comparePassword(password, user.password)
    if (!match) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    console.log(process.env.JWT_SECRET)
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      token, user: {
        id: user._id,
        username: user.username,
        name: user.name
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// Export the Express API
// module.exports = app;

// localhost Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

