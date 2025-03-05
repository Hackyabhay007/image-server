const express = require("express");
const multer = require("multer");
const { MozJPEG, Steps, FromBuffer, FromFile } = require("@imazen/imageflow");
const fs = require("fs");
const path = require("path");
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

// Create directories if they don't exist
const imageDir = path.join(__dirname, "uploads", "images");
const videoDir = path.join(__dirname, "uploads", "videos");

// Create directories if they don't exist
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

// Helper function for pagination
const paginateResults = (items, page, limit) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const results = {};

  // Add pagination metadata
  if (endIndex < items.length) {
    results.next = {
      page: page + 1,
      limit: limit,
    };
  }

  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit: limit,
    };
  }

  results.total = items.length;
  results.pages = Math.ceil(items.length / limit);
  results.currentPage = page;
  results.results = items.slice(startIndex, endIndex);

  return results;
};

// Helper function to generate a clean filename
const generateCleanFilename = (originalName, extension) => {
  // Remove file extension from original name if it exists
  let baseName = originalName.replace(/\.[^/.]+$/, "");

  // Replace spaces and special characters with underscores or hyphens
  baseName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-") // Replace multiple hyphens with a single one
    .replace(/^-|-$/g, ""); // Remove leading and trailing hyphens

  // Add timestamp to make it unique
  const timestamp = Date.now();

  // If the basename became empty after sanitization, use a default name
  if (!baseName) {
    baseName = "file";
  }

  return `${baseName}-${timestamp}${extension}`;
};

// Public routes that don't need authentication
app.get("/image/:filename", async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const quality = parseInt(req.query.quality, 10) || null; // Get quality from query parameter
    const imagePath = path.join(imageDir, filename);

    console.log(`Looking for image at: ${imagePath}`);

    // Check if file exists first
    if (!fs.existsSync(imagePath)) {
      console.log(`Image not found: ${filename}`);
      return res.status(404).json({ error: "Image not found" });
    }

    // If quality parameter is provided, process the image with the specified quality
    if (quality && quality >= 1 && quality <= 100) {
      try {
        const imageBuffer = fs.readFileSync(imagePath);

        // Process the image with the specified quality
        const steps = new Steps(new FromBuffer(imageBuffer))
          .constrainWithin(1000, 1000)
          .encode(new FromBuffer(null), new MozJPEG(quality));

        steps
          .executeToBuffer()
          .then((resultBuffer) => {
            res.set("Content-Type", "image/jpeg");
            res.send(resultBuffer);
          })
          .catch((error) => {
            console.error("Error processing image quality:", error);
            // Fallback to original file
            res.sendFile(imagePath);
          });
      } catch (error) {
        console.error("Error reading image file:", error);
        res.sendFile(imagePath);
      }
    } else {
      // Just serve the original file if no quality specified or quality is invalid
      res.sendFile(imagePath);
    }
  } catch (error) {
    console.error("Error handling image request:", error);
    res.status(500).json({ error: "Failed to process image request" });
  }
});

// Fix path resolution in the video serving route
app.get("/video/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const videoPath = path.resolve(videoDir, filename);

  console.log(`Request for video: ${filename} at path: ${videoPath}`);

  if (!fs.existsSync(videoPath)) {
    console.log(`Video not found: ${filename}`);
    return res.status(404).json({ error: "Video not found" });
  }

  res.sendFile(videoPath);
});

// Middleware to check API key
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.header("Authorization")?.split(" ")[1]; // Extract key from Authorization header
  if (!apiKey || !API_KEYS.includes(apiKey)) {
    return res.status(401).json({ message: "Unauthorized: Invalid API Key" });
  }
  next(); // Continue to the requested route
};

// Routes that need authentication
// Add the authentication middleware to the routes that need protection
app.use(
  ["/images", "/videos", "/media", "/upload", "/upload-video"],
  authenticateApiKey
);

// Route to get all images with pagination
app.get("/images", (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Get sort parameter
    const sortBy = req.query.sort || "newest";

    // Read all files from the images directory
    fs.readdir(imageDir, (err, files) => {
      if (err) {
        console.error("Error reading image directory:", err);
        return res.status(500).json({ error: "Failed to retrieve images" });
      }

      // Filter to include only image files
      const imageFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext);
      });

      // Get file details including creation date
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

      // Sort the images based on the sort parameter
      if (sortBy === "oldest") {
        imageDetails.sort((a, b) => a.created - b.created);
      } else if (sortBy === "name") {
        imageDetails.sort((a, b) => a.filename.localeCompare(b.filename));
      } else if (sortBy === "size") {
        imageDetails.sort((a, b) => b.size - a.size);
      } else {
        // Default: newest
        imageDetails.sort((a, b) => b.created - a.created);
      }

      // Paginate the results
      const paginatedResults = paginateResults(imageDetails, page, limit);

      res.json(paginatedResults);
    });
  } catch (error) {
    console.error("Error processing image list request:", error);
    res.status(500).json({ error: "Failed to retrieve images" });
  }
});

// Route to get all videos with pagination
app.get("/videos", (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Get sort parameter
    const sortBy = req.query.sort || "newest";

    // Read all files from the videos directory
    fs.readdir(videoDir, (err, files) => {
      if (err) {
        console.error("Error reading video directory:", err);
        return res.status(500).json({ error: "Failed to retrieve videos" });
      }

      // Filter to include only video files
      const videoFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return [".mp4", ".avi", ".mov", ".webm", ".mkv"].includes(ext);
      });

      // Get file details including creation date
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

      // Sort the videos based on the sort parameter
      if (sortBy === "oldest") {
        videoDetails.sort((a, b) => a.created - b.created);
      } else if (sortBy === "name") {
        videoDetails.sort((a, b) => a.filename.localeCompare(b.filename));
      } else if (sortBy === "size") {
        videoDetails.sort((a, b) => b.size - a.size);
      } else {
        // Default: newest
        videoDetails.sort((a, b) => b.created - a.created);
      }

      // Paginate the results
      const paginatedResults = paginateResults(videoDetails, page, limit);

      res.json(paginatedResults);
    });
  } catch (error) {
    console.error("Error processing video list request:", error);
    res.status(500).json({ error: "Failed to retrieve videos" });
  }
});

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

// Fix the path resolution in the image upload handler too for consistency
app.post("/upload/:quality?", upload.single("image"), async (req, res) => {
  try {
    const { quality } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Keep quality high by default (90-100 is considered high quality)
    const qualityValue = parseInt(quality, 10) || 90;

    const imageBuffer = req.file.buffer;

    // Get the file extension from original name or default to jpg
    const originalExt =
      path.extname(req.file.originalname).toLowerCase() || ".jpg";
    const cleanExt = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(
      originalExt
    )
      ? originalExt
      : ".jpg"; // Default to jpg if not a recognized image extension

    // Generate a clean filename with no spaces
    const cleanFilename = generateCleanFilename(
      req.file.originalname,
      cleanExt
    );

    // Use path.resolve for correct absolute path resolution
    const imagePath = path.resolve(imageDir, cleanFilename);
    const responseImage = `image/${cleanFilename}`;

    console.log(`Saving image to: ${imagePath} with quality: ${qualityValue}`);

    // Focus on reducing dimensions rather than quality
    // Use a more aggressive resizing approach to save space
    let step = new Steps(new FromBuffer(imageBuffer))
      // First resize the image to a reasonable maximum size
      .constrainWithin(1200, 1200) // Maximum dimension allowed
      .encode(new FromFile(imagePath), new MozJPEG(qualityValue));

    await step.execute();

    // Verify file was saved correctly
    if (!fs.existsSync(imagePath)) {
      console.error(`Failed to save image file at: ${imagePath}`);
      return res.status(500).json({ error: "Failed to save image" });
    }

    res.send(responseImage);
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Failed to process image" });
  }
});

// Multer configuration for video
const videoUpload = multer({ storage: multer.memoryStorage() }); // Store video in memory

// Improved video upload endpoint with correct syntax
app.post("/upload-video", videoUpload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video provided" });
    }

    // Get video buffer and metadata
    const videoBuffer = req.file.buffer;

    // Get the file extension from original name or default to mp4
    const originalExt = path.extname(req.file.originalname).toLowerCase() || ".mp4";
    const cleanExt = [".mp4", ".avi", ".mov", ".webm", ".mkv"].includes(originalExt)
      ? originalExt
      : ".mp4"; // Default to mp4 if not a recognized video extension

    // Generate a clean filename with no spaces
    const cleanFilename = generateCleanFilename(
      req.file.originalname,
      cleanExt
    );
    const compressedFilename = `compressed-${cleanFilename}`;

    // Fix path resolution by using absolute paths without concatenation
    const videoPath = path.resolve(videoDir, cleanFilename);
    const compressedVideoPath = path.resolve(videoDir, compressedFilename);
    const responseVideoPath = `video/${compressedFilename}`;

    console.log(`Original video path: ${videoPath}`);
    console.log(`Compressed video path: ${compressedVideoPath}`);

    // Ensure the video directory exists
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }

    console.log(`Saving video to: ${videoPath}`);

    // Save the video buffer to a temporary file
    fs.writeFileSync(videoPath, videoBuffer);

    // Check if the file was saved correctly
    if (!fs.existsSync(videoPath)) {
      return res.status(500).json({ 
        error: "Failed to save video file",
        details: "Could not write temporary video file to disk"
      });
    }
    
    // Check file size to ensure it's not empty
    const stats = fs.statSync(videoPath);
    if (stats.size === 0) {
      return res.status(400).json({ 
        error: "Invalid video file",
        details: "The uploaded video file is empty"
      });
    }

    console.log(`Starting FFmpeg compression for ${videoPath}`);
    
    // Use ffmpeg with more controlled settings and better error handling
    const ffmpegCommand = ffmpeg(videoPath)
      .outputOptions([
        '-c:v libx264',          // Video codec
        '-crf 28',               // Quality level (23-28 is a good balance)
        '-preset medium',         // Encoding speed/compression ratio
        '-c:a aac',              // Audio codec
        '-b:a 128k',             // Audio bitrate
        '-vf scale=iw*0.5:ih*0.5' // Scale to 50%
      ])
      .output(compressedVideoPath)
      .on("start", (commandLine) => {
        console.log("FFmpeg started with command:", commandLine);
      })
      .on("progress", (progress) => {
        // Log progress to help with debugging
        console.log(`FFmpeg Processing: ${JSON.stringify(progress)}`);
      })
      .on("end", () => {
        console.log("Video compression complete");
        console.log(`Checking compressed file at: ${compressedVideoPath}`);

        // Verify the compressed file exists and is not empty
        if (fs.existsSync(compressedVideoPath) && fs.statSync(compressedVideoPath).size > 0) {
          // Optional: Remove the original video after compression
          try {
            fs.unlinkSync(videoPath);
            console.log(`Successfully deleted original video: ${videoPath}`);
          } catch (deleteError) {
            console.error("Warning: Could not delete original video file:", deleteError);
            // Non-critical error, continue
          }

          // Send the URL of the compressed video
          res.send(responseVideoPath);
        } else {
          console.error(`Compressed file not found or empty at: ${compressedVideoPath}`);
          res.status(500).json({ 
            error: "Failed to compress video",
            details: "FFmpeg completed but produced no output file"
          });
        }
      })
      .on("error", (err, stdout, stderr) => {
        console.error("FFmpeg error:", err);
        console.error("FFmpeg stdout:", stdout || "No stdout");
        console.error("FFmpeg stderr:", stderr || "No stderr");
        
        // If compression fails, we can try to serve the original file as fallback
        try {
          console.log(`Attempting fallback: copying ${videoPath} to ${compressedVideoPath}`);
          // Copy the original file to the compressed path as a fallback
          fs.copyFileSync(videoPath, compressedVideoPath);
          console.log("Compression failed, using original file as fallback");
          
          // Send the URL even though we just copied the original
          res.send(responseVideoPath);
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
          res.status(500).json({ 
            error: "Failed to compress video",
            details: err.message || "FFmpeg encountered an error during compression"
          });
        }
      });
    
    // Run the FFmpeg command
    ffmpegCommand.run();
  } catch (error) {
    console.error("Error processing video upload:", error);
    res.status(500).json({ 
      error: "Failed to process video",
      details: error.message || "An unknown error occurred"
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
