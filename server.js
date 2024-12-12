// server.js
require("dotenv").config();
const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");
const User = require("./models/userModel");
const jwt = require("jsonwebtoken");


// Initialize express
const app = express();

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

// File upload endpoint
app.post("/api/upload", async (req, res) => {
  try {
    await connectDB();

    // Use Promise to handle multer upload
    await new Promise((resolve, reject) => {
      handleFileUpload(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const writeStream = gfs.openUploadStream(file.originalname);
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
app.get("/api/files", async (req, res) => {
  try {
    await connectDB();
    const files = await gfs.find().toArray();
    res.json(
      files.map((file) => ({
        _id: file._id,
        filename: file.filename,
        size: file.length,
        uploadDate: file.uploadDate,
      }))
    );
  } catch (error) {
    console.error("Error getting files:", error);
    res.status(500).json({ error: "Error getting files" });
  }
});

// Download file
app.get("/api/files/:id/download", async (req, res) => {
  try {
    await connectDB();
    const file = await gfs.find({ _id: new ObjectId(req.params.id) }).toArray();
    if (!file || file.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    res.set("Content-Type", "application/octet-stream");
    res.set(
      "Content-Disposition",
      `attachment; filename="${file[0].filename}"`
    );

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
app.delete("/api/files/:id", validateFileId, async (req, res) => {
  try {
    await connectDB();
    const file = await gfs.find({ _id: new ObjectId(req.params.id) }).toArray();
    if (!file || file.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

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
    const { username, password, name } = req.body;

    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ error: "User already exists" });

    const newUser = new User({ username, password, name });
    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Sign-Up Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Login Route
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// Export the Express API
module.exports = app;
