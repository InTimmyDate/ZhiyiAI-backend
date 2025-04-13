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
app.post("/analyze-requirements", async (req, res) => {
  const { image } = req.body;

  // 检查请求体中是否包含图片
  if (!image) {
    return res.status(400).json({ success: false, message: "Image is required for analysis" });
  }

  try {
    // 调用 DeepSeek API
    const deepseekResponse = await fetch("https://api.deepseek.com/analyze", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `sk-68f819c08b5d4b8cb62725067e9a7543` // 替换为你的 DeepSeek API 密钥
      },
      body: JSON.stringify({ image }), // 将 Base64 图像传递给 DeepSeek
    });

    // 检查 DeepSeek API 的响应
    const data = await deepseekResponse.json();

    if (!deepseekResponse.ok || !data.success) {
      throw new Error(data.message || "Failed to analyze image with DeepSeek API");
    }

    // 从 DeepSeek API 的响应中提取分析结果
    const analysisResult = {
      pattern: data.analysis?.pattern || "unknown", // DeepSeek 返回的 pattern
      color: data.analysis?.color || "unknown",     // DeepSeek 返回的 color
      style: data.analysis?.style || "unknown",     // DeepSeek 返回的 style
    };

    // 返回分析结果
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