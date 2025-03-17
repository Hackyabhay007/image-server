const express = require("express");
const multer = require("multer");
const { MozJPEG, Steps, FromBuffer, FromFile } = require("@imazen/imageflow");
const fs = require("fs");
const app = express();
require("dotenv").config();
const API_KEYS = [process.env.API_KEYS]; // Store your valid API keys here
const cors = require("cors");
const ffmpeg = require("fluent-ffmpeg");

app.use(
  cors({
    origin: "*",
  })
);

console.log(API_KEYS);
// Multer configuration
const upload = multer({ storage: multer.memoryStorage() }); // Store image in memory

// Route to handle image upload and processing

app.get("/image/:filename", (req, res) => {
  const filename = req.params.filename;
  const imagePath = `./uploads/${filename}`;

  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.sendFile(imagePath, { root: __dirname });
  });
});

// Route to serve compressed videos
app.get("/video/:filename", (req, res) => {
  const filename = req.params.filename;
  const videoPath = `./uploads/video/${filename}`;

  fs.access(videoPath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.sendFile(videoPath, { root: __dirname });
  });
});

// Middleware to check API key
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.header("Authorization")?.split(" ")[1]; // Extract key from Authorization header
  if (!apiKey || !API_KEYS.includes(apiKey)) {
    return res.status(401).json({ message: "Unauthorized: Invalid API Key" });
  }
  next(); // Continue to the requested route
};

app.use(authenticateApiKey); // Use this middleware for all routes

app.post("/upload/:quality?", upload.single("image"), async (req, res) => {
  try {
    const { quality } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }
    const qualityValue = parseInt(quality, 10) || 80; // Default to 80 if not provided
    if (qualityValue < 1 || qualityValue > 100) {
      return res
        .status(400)
        .json({ error: "Quality must be between 1 and 100" });
    }

    const imageBuffer = req.file.buffer;
    const image = `${req.file.originalname}-${Date.now()}.jpg`;
    const imagePath = `./uploads/${image}`;
    const responseimge = `${process.env.BASE_URL}/image/${image}`;

    let step = new Steps(new FromBuffer(imageBuffer))
      .constrainWithin(1000, 1000)
      .branch((step) =>
        step
          .constrainWithin(900, 900)
          .constrainWithin(800, 800)
          .encode(new FromFile(imagePath), new MozJPEG(qualityValue))
      )
      .constrainWithin(100, 100);

    const result = await step
      .encode(new FromBuffer(null, "key"), new MozJPEG(80))
      .execute();

    res.send(responseimge);
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Failed to process image" });
  }
});

// Multer configuration for video
const videoUpload = multer({ storage: multer.memoryStorage() }); // Store video in memory

// Route to handle video upload and compression
app.post("/upload-video", videoUpload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video provided" });
    }

    // Get video buffer and metadata
    const videoBuffer = req.file.buffer;
    const videoName = `${
      req.file.originalname.split(".")[0]
    }-${Date.now()}.mp4`;
    const videoPath = `./uploads/${videoName}`;
    const compressedVideoPath = `./uploads/compressed-${videoName}`;
    const responseVideoPath = `${process.env.BASE_URL}/video/${videoName}`;

    // Save the video buffer to a temporary file
    fs.writeFileSync(videoPath, videoBuffer);

    // Use ffmpeg to compress the video
    ffmpeg(videoPath)
      .output(compressedVideoPath)
      .videoCodec("libx264")
      .size("50%") // Reduce video size to 50% of the original
      .on("end", () => {
        console.log("Video compression complete");

        // Optional: Remove the original video after compression
        fs.unlinkSync(videoPath);

        // Send the URL of the compressed video
        res.send({
          url: responseVideoPath.replace(videoName, `compressed-${videoName}`),
        });
      })
      .on("error", (err) => {
        console.error("Error compressing video:", err);
        res.status(500).json({ error: "Failed to compress video" });
      })
      .run();
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ error: "Failed to process video" });
  }
});

// Updated DELETE route that matches the actual directory structure
app.delete("/delete/:type/:filename", (req, res) => {
  try {
    const { type, filename } = req.params;

    // Validate type parameter
    if (type !== "image" && type !== "video") {
      return res
        .status(400)
        .json({ error: "Invalid media type. Type must be 'image' or 'video'" });
    }

    // Decode the filename to handle URL-encoded characters
    const decodedFilename = decodeURIComponent(filename);

    // Determine file path based on type and actual directory structure used in the app
    let filePath;
    if (type === "image") {
      // Images are stored directly in ./uploads/ folder
      filePath = `./uploads/${decodedFilename}`;
      console.log(`Checking for image at path: ${filePath}`);
    } else {
      // For videos, check if it's a compressed video (they are stored with "compressed-" prefix)
      if (decodedFilename.startsWith("compressed-")) {
        // Compressed videos are stored in the main uploads directory
        filePath = `./uploads/${decodedFilename}`;
      } else {
        // If not a compressed video, it might be in video subdirectory
        // Try both possible locations
        filePath = `./uploads/${decodedFilename}`;
        if (!fs.existsSync(filePath)) {
          filePath = `./uploads/video/${decodedFilename}`;
        }
      }
      console.log(`Checking for video at path: ${filePath}`);
    }

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.log(`${type} not found at: ${filePath}`);

        // For videos, try one more path with compressed- prefix if not already tried
        if (type === "video" && !decodedFilename.startsWith("compressed-")) {
          const compressedPath = `./uploads/compressed-${decodedFilename}`;
          console.log(`Trying compressed path: ${compressedPath}`);

          fs.access(compressedPath, fs.constants.F_OK, (compErr) => {
            if (compErr) {
              return res.status(404).json({
                error: `${
                  type.charAt(0).toUpperCase() + type.slice(1)
                } not found`,
              });
            }

            // Found at compressed path, delete it
            fs.unlink(compressedPath, (unlinkErr) => {
              if (unlinkErr) {
                console.error(`Error deleting ${type}:`, unlinkErr);
                return res
                  .status(500)
                  .json({ error: `Failed to delete ${type}` });
              }

              console.log(
                `Successfully deleted compressed video: ${compressedPath}`
              );
              res.json({
                message: `${
                  type.charAt(0).toUpperCase() + type.slice(1)
                } deleted successfully`,
              });
            });
          });
          return;
        }

        return res.status(404).json({
          error: `${type.charAt(0).toUpperCase() + type.slice(1)} not found`,
        });
      }

      // Delete the file
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting ${type}:`, err);
          return res.status(500).json({ error: `Failed to delete ${type}` });
        }

        console.log(`Successfully deleted ${type}: ${filePath}`);
        res.json({
          message: `${
            type.charAt(0).toUpperCase() + type.slice(1)
          } deleted successfully`,
        });
      });
    });
  } catch (error) {
    console.error("Error processing delete request:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
