const express = require("express");
const cors = require("cors");
const http = require("http");
const fetch = require("node-fetch"); // Import fetch for server-side API calls
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));

const server = http.createServer(app);
server.setTimeout(600000); // Set timeout to 10 minutes (600000ms)

// Route: Analyze Requirements
const fetch = require('node-fetch');

app.post("/analyze-requirements", async (req, res) => {
  let { image } = req.body;

  if (!image) {
    return res.status(400).json({ success: false, message: "Image is required for analysis" });
  }

  try {
    // Handle data URL format by extracting base64 string
    if (image.startsWith('data:image')) {
      const base64Match = image.match(/^data:image\/[a-z]+;base64,(.+)$/);
      if (!base64Match) {
        return res.status(400).json({ success: false, message: "Invalid base64 image format" });
      }
      image = base64Match[1]; // Extract the base64 part
    }

    // Call Tongyi Qianwen (Qwen) API for image analysis
    const response = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/vision-generation/generation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen-vl-plus",
        input: {
          image: image, // Base64-encoded image
          prompt: "Analyze the image and identify the pattern, color, and style. Return the result in JSON format with keys: pattern, color, style."
        },
        parameters: {
          output_format: "json"
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Qwen API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Extract pattern, color, and style from Qwen response
    // Adjust based on actual Qwen API response structure
    const analysisResult = {
      pattern: data.output?.pattern || "unknown",
      color: data.output?.color || "unknown",
      style: data.output?.style || "unknown",
    };

    res.json({
      success: true,
      requirements: analysisResult,
    });
  } catch (error) {
    console.error("Error analyzing requirements:", error);
    res.status(500).json({ success: false, message: "Failed to analyze requirements" });
  }
});

// Route: Generate Pattern
app.post("/generate-pattern", async (req, res) => {
  const { prompt, color, style, numImages, refImage } = req.body;

  if (!refImage || !prompt) {
    return res.status(400).json({ success: false, message: "Reference image and prompt are required" });
  }

  try {
    // Call external Python API (replace URL with your Python server endpoint)
    const pythonResponse = await fetch("https://select-seahorse-quickly.ngrok-free.app/generate/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        color,
        style,
        numImages,
        refImage,
      }),
    });

    const data = await pythonResponse.json();

    if (!data.success) {
      throw new Error("Error generating pattern");
    }

    // Return generated images to the frontend
    res.json({
      success: true,
      message: "Patterns generated successfully!",
      images: data.images.map((img) => `data:image/png;base64,${img}`), // Convert to Base64
    });
  } catch (error) {
    console.error("Error generating pattern:", error);
    res.status(500).json({ success: false, message: "Error generating patterns" });
  }
});

// Route: Post-Process (e.g., noise reduction and edge smoothing)
app.post("/post-process", async (req, res) => {
  const { image, denoise, smoothEdges, formats } = req.body;

  if (!image) {
    return res.status(400).json({ success: false, message: "Image is required for post-processing" });
  }

  try {
    // Call external Python API (replace URL with your Python server endpoint)
    const pythonResponse = await fetch("https://select-seahorse-quickly.ngrok-free.app/post-process/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image,
        denoise,
        smoothEdges,
        formats,
      }),
    });

    const data = await pythonResponse.json();

    if (!data.success) {
      throw new Error("Error during post-processing");
    }

    // Return processed images in requested formats
    res.json({
      success: true,
      message: "Post-processing completed successfully!",
      processedImages: data.processedImages.reduce((acc, img, index) => {
        acc[formats[index]] = `data:image/${formats[index].toLowerCase()};base64,${img}`;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Error during post-processing:", error);
    res.status(500).json({ success: false, message: "Error during post-processing" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});