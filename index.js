const express = require("express");
const multer = require("multer");
const { MozJPEG, Steps, FromBuffer, FromFile } = require("@imazen/imageflow");
const fs = require("fs");
const app = express();
require("dotenv").config();
const API_KEYS = [process.env.API_KEYS]; // Store your valid API keys here
const cors = require("cors");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path"); // Ensure path is required if not already

app.use(
  cors({
    origin: "*",
  })
);

console.log(API_KEYS);
// Multer configuration
const upload = multer({ storage: multer.memoryStorage() }); // Store image in memory

// Add this variable to store the FFmpeg path
let ffmpegPath = null;

// Update the FFmpeg path configuration to store the path in a variable
try {
  // Define common locations where FFmpeg might be installed
  const possibleFfmpegPaths = [
    "/usr/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/opt/homebrew/bin/ffmpeg",
    "/opt/ffmpeg/bin/ffmpeg",
    "C:\\ffmpeg\\bin\\ffmpeg.exe",
    "D:\\ffmpeg\\bin\\ffmpeg.exe", // Added Windows D: drive path
  ];

  let ffmpegFound = false;

  // Try setting ffmpeg path from potential locations
  for (const possiblePath of possibleFfmpegPaths) {
    if (fs.existsSync(possiblePath)) {
      console.log(`Found FFmpeg at: ${possiblePath}`);
      ffmpeg.setFfmpegPath(possiblePath);
      ffmpegPath = possiblePath; // Store the path in our variable
      ffmpegFound = true;
      break;
    }
  }

  if (!ffmpegFound) {
    console.log(
      "FFmpeg not found in common locations. Trying to find from PATH..."
    );
    // Try to get FFmpeg path from the system
    const which = require("which");
    try {
      const ffmpegPathFromSystem = which.sync("ffmpeg");
      console.log(`Found FFmpeg in PATH: ${ffmpegPathFromSystem}`);
      ffmpeg.setFfmpegPath(ffmpegPathFromSystem);
      ffmpegPath = ffmpegPathFromSystem; // Store the path in our variable
      ffmpegFound = true;
    } catch (whichErr) {
      console.warn("Could not find FFmpeg in PATH:", whichErr.message);
    }
  }

  // Log the configured FFmpeg path
  console.log("Current FFmpeg path:", ffmpegPath || "Not configured");
} catch (error) {
  console.warn("Could not set FFmpeg path:", error.message);
}

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



// Update the video route to check multiple possible locations
app.get("/video/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);

  // Check multiple possible locations for video files
  const possiblePaths = [
    `./uploads/video/${filename}`, // Original path (singular directory)
    `./uploads/videos/${filename}`, // Plural directory
    `./uploads/${filename}`, // Root uploads directory
    `./uploads/compressed-${filename}`, // Compressed videos in root directory
  ];

  console.log(`Looking for video: ${filename}`);

  // Try each path until we find the file
  let fileFound = false;

  for (const videoPath of possiblePaths) {
    console.log(`Checking path: ${videoPath}`);

    if (fs.existsSync(videoPath)) {
      console.log(`Video found at: ${videoPath}`);
      fileFound = true;
      return res.sendFile(videoPath, { root: __dirname });
    }
  }

  // If we've tried all paths and found nothing
  if (!fileFound) {
    console.log(`Video not found: ${filename}`);
    return res.status(404).json({ error: "Video not found" });
  }
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


// Route to get all media (both images and videos) with pagination
app.get("/media", (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Get sort parameter
    const sortBy = req.query.sort || "newest";
    // Get filter parameter (optional)
    const filterType = req.query.type || "all"; // 'all', 'image', or 'video'

    // Get all media files from both directories
    Promise.all([
      new Promise((resolve, reject) => {
        fs.readdir(imageDir, (err, files) => {
          if (err) {
            console.error("Error reading image directory:", err);
            reject(err);
            return;
          }

          // Filter to include only image files
          const imageFiles = files.filter((file) => {
            const ext = path.extname(file).toLowerCase();
            return [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext);
          });

          // Map files to details
          const imageDetails = imageFiles.map((file) => {
            const filePath = path.join(imageDir, file);
            const stats = fs.statSync(filePath);

            return {
              filename: file,
              url: `https://${req.get("host")}/image/${file}`,
              created: stats.birthtime,
              size: stats.size,
              type: "image",
            };
          });

          resolve(imageDetails);
        });
      }),
      new Promise((resolve, reject) => {
        fs.readdir(videoDir, (err, files) => {
          if (err) {
            console.error("Error reading video directory:", err);
            reject(err);
            return;
          }

          // Filter to include only video files
          const videoFiles = files.filter((file) => {
            const ext = path.extname(file).toLowerCase();
            return [".mp4", ".avi", ".mov", ".webm", ".mkv"].includes(ext);
          });

          // Map files to details
          const videoDetails = videoFiles.map((file) => {
            const filePath = path.join(videoDir, file);
            const stats = fs.statSync(filePath);

            return {
              filename: file,
              url: `https://${req.get("host")}/video/${file}`,
              created: stats.birthtime,
              size: stats.size,
              type: "video",
            };
          });

          resolve(videoDetails);
        });
      }),
    ])
      .then((results) => {
        let [imageDetails, videoDetails] = results;
        let allMedia = [];

        // Apply type filter if specified
        if (filterType === "image") {
          allMedia = imageDetails;
        } else if (filterType === "video") {
          allMedia = videoDetails;
        } else {
          // Default: all media
          allMedia = [...imageDetails, ...videoDetails];
        }

        // Sort the media based on the sort parameter
        if (sortBy === "oldest") {
          allMedia.sort((a, b) => a.created - b.created);
        } else if (sortBy === "name") {
          allMedia.sort((a, b) => a.filename.localeCompare(b.filename));
        } else if (sortBy === "size") {
          allMedia.sort((a, b) => b.size - a.size);
        } else if (sortBy === "type") {
          allMedia.sort((a, b) => a.type.localeCompare(b.type));
        } else {
          // Default: newest
          allMedia.sort((a, b) => b.created - a.created);
        }

        // Paginate the results
        const paginatedResults = paginateResults(allMedia, page, limit);

        res.json(paginatedResults);
      })
      .catch((error) => {
        console.error("Error retrieving media files:", error);
        res.status(500).json({ error: "Failed to retrieve media files" });
      });
  } catch (error) {
    console.error("Error processing media list request:", error);
    res.status(500).json({ error: "Failed to retrieve media" });
  }
});

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
    const responseimge = `image/${image}`;

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

// Fix the upload-video route to maintain the original response format
app.post("/upload-video", videoUpload.single("video"), async (req, res) => {
  let responseHasBeenSent = false; // Flag to track if we've responded already

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video provided" });
    }

    // Get video buffer and metadata
    const videoBuffer = req.file.buffer;
    const videoName = `${
      req.file.originalname.split(".")[0]
    }-${Date.now()}.mp4`;

    // Always store videos in the same location for consistency
    const videoDir = "./uploads/video"; // Use singular form consistently
    const videoPath = `${videoDir}/${videoName}`;
    const compressedVideoPath = `${videoDir}/compressed-${videoName}`;
    const responseVideoPath = `${process.env.BASE_URL}/video/${videoName}`;

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync("./uploads")) {
      fs.mkdirSync("./uploads", { recursive: true });
    }

    // Create video directory if it doesn't exist
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }

    // Save the video buffer to a temporary file
    fs.writeFileSync(videoPath, videoBuffer);
    console.log(`Saved original video to: ${videoPath}`);

    // Use our stored path variable instead of the non-existent getter function
    if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
      console.warn("FFmpeg not available or not found at path:", ffmpegPath);

      // Simple fallback - copy file and respond
      fs.copyFileSync(videoPath, compressedVideoPath);
      console.log(
        `FFmpeg not available - copied video without compression to: ${compressedVideoPath}`
      );

      responseHasBeenSent = true; // Mark that we're sending a response
      return res.send("video/" + `compressed-${videoName}`);
    }

    // FFmpeg is available, proceed with compression
    const ffmpegCommand = ffmpeg(videoPath)
      .outputOptions([
        "-c:v libx264", // Video codec
        "-crf 28", // Quality level
        "-preset medium", // Encoding speed/compression ratio
        "-c:a aac", // Audio codec
        "-b:a 128k", // Audio bitrate
        "-vf scale=iw*0.5:ih*0.5", // Scale to 50%
      ])
      .output(compressedVideoPath);

    // Add event handlers
    ffmpegCommand
      .on("start", (commandLine) => {
        console.log("FFmpeg started with command:", commandLine);
      })
      .on("progress", (progress) => {
        console.log(`FFmpeg Progress: ${JSON.stringify(progress)}`);
      })
      .on("end", () => {
        // Only respond if we haven't already
        if (responseHasBeenSent) return;

        console.log("Video compression complete");

        // Optional: Remove the original video after compression
        try {
          fs.unlinkSync(videoPath);
          console.log("Original video removed after compression");
        } catch (err) {
          console.warn("Could not remove original video:", err.message);
        }

        // Send response with the same format as original code
        responseHasBeenSent = true;
        res.send("video/" + `compressed-${videoName}`);
      })
      .on("error", (err) => {
        // Only respond if we haven't already
        if (responseHasBeenSent) return;

        console.error("Error compressing video:", err);

        // Attempt to use the original video as fallback
        try {
          fs.copyFileSync(videoPath, compressedVideoPath);
          console.log(`Compression failed - copied original video as fallback`);

          responseHasBeenSent = true;
          res.send({
            url: responseVideoPath.replace(
              videoName,
              `compressed-${videoName}`
            ),
          });
        } catch (copyErr) {
          if (!responseHasBeenSent) {
            responseHasBeenSent = true;
            res.status(500).json({
              error: "Failed to compress video",
              details: err.message,
            });
          }
        }
      });

    // Run the FFmpeg command directly
    try {
      ffmpegCommand.run();
    } catch (runError) {
      // Only respond if we haven't already
      if (responseHasBeenSent) return;

      console.error("Error executing FFmpeg command:", runError);

      // Fallback if FFmpeg fails to run
      fs.copyFileSync(videoPath, compressedVideoPath);
      console.log(`FFmpeg run failed - copied original video as fallback`);

      responseHasBeenSent = true;
      res.send("video/" + `compressed-${videoName}`);
    }
  } catch (error) {
    // Only respond if we haven't already
    if (responseHasBeenSent) return;

    console.error("Error uploading video:", error);
    res.status(500).json({ error: "Failed to process video" });
  }
});

// Improved DELETE route with better path checking
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
    console.log(`Attempting to delete ${type}: ${decodedFilename}`);

    // Initialize array of paths to check based on file type
    let possiblePaths = [];

    if (type === "image") {
      // Check all possible image paths
      possiblePaths = [
        `./uploads/${decodedFilename}`,
        `./uploads/images/${decodedFilename}`,
        `./uploads/image/${decodedFilename}`,
      ];
    } else {
      // Check all possible video paths
      possiblePaths = [
        // Check compressed versions
        `./uploads/video/compressed-${decodedFilename}`,
        `./uploads/videos/compressed-${decodedFilename}`,
        `./uploads/compressed-${decodedFilename}`,
        // Check original versions
        `./uploads/video/${decodedFilename}`,
        `./uploads/videos/${decodedFilename}`,
        `./uploads/${decodedFilename}`,
      ];

      // If filename already starts with "compressed-", also check without prefix
      if (decodedFilename.startsWith("compressed-")) {
        const originalFilename = decodedFilename.substring(11); // Remove "compressed-" prefix
        possiblePaths.push(
          `./uploads/video/${originalFilename}`,
          `./uploads/videos/${originalFilename}`,
          `./uploads/${originalFilename}`
        );
      }
    }

    console.log(
      `Checking ${possiblePaths.length} possible locations for ${type}`
    );

    // Check each path and delete the first file found
    let fileFound = false;

    // Function to check next path or return not found
    const checkNextPath = (index) => {
      if (index >= possiblePaths.length) {
        // We've checked all paths and found nothing
        console.log(`${type} not found in any of the expected locations`);
        return res.status(404).json({
          error: `${type.charAt(0).toUpperCase() + type.slice(1)} not found`,
        });
      }

      const currentPath = possiblePaths[index];
      console.log(`Checking path: ${currentPath}`);

      fs.access(currentPath, fs.constants.F_OK, (err) => {
        if (err) {
          // File not found at this path, try next one
          return checkNextPath(index + 1);
        }

        // File found, delete it
        console.log(`Found ${type} at: ${currentPath}, deleting...`);
        fs.unlink(currentPath, (unlinkErr) => {
          if (unlinkErr) {
            console.error(`Error deleting ${type}:`, unlinkErr);
            return res.status(500).json({ error: `Failed to delete ${type}` });
          }

          console.log(`Successfully deleted ${type}: ${currentPath}`);
          res.json({
            message: `${
              type.charAt(0).toUpperCase() + type.slice(1)
            } deleted successfully`,
            path: currentPath,
          });

          // For videos, try to also delete any related files
          if (type === "video" && decodedFilename.startsWith("compressed-")) {
            const originalFilename = decodedFilename.substring(11); // Remove "compressed-" prefix

            // Try to delete the original file if it exists
            [
              `./uploads/video/${originalFilename}`,
              `./uploads/videos/${originalFilename}`,
              `./uploads/${originalFilename}`,
            ].forEach((origPath) => {
              if (fs.existsSync(origPath)) {
                try {
                  fs.unlinkSync(origPath);
                  console.log(`Also deleted related file: ${origPath}`);
                } catch (cleanupErr) {
                  console.warn(
                    `Could not delete related file ${origPath}:`,
                    cleanupErr.message
                  );
                }
              }
            });
          }
        });
      });
    };

    // Start checking paths from index 0
    checkNextPath(0);
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
