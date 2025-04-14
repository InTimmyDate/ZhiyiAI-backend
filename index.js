const express = require("express");
const cors = require("cors");
const http = require("http");
const fetch = require("node-fetch"); // Import fetch for server-side API calls
const bodyParser = require("body-parser");
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 5500;
const OpenAI = require("openai");

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));

const server = http.createServer(app);
server.setTimeout(600000); // Set timeout to 10 minutes (600000ms)

const openai = new OpenAI(
  {
      // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
      apiKey: "sk-3e46e4fae25e423d9037cac8379327a5",
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
  }
);

// Route: Analyze Requirements
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

    // Upload to ImgBB for a temporary URL
    const formData = new FormData();
    formData.append('image', image);
    formData.append('key', "341351e946486ead55be9faf36356aa2");
    formData.append('expiration', 120);
    const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?`, {
      method: 'POST',
      body: formData
    });

    if (!imgbbResponse.ok) {
      throw new Error(`ImgBB upload failed with status: ${imgbbResponse.status}`);
    }

    const imgbbData = await imgbbResponse.json();
    if (!imgbbData.success) {
      throw new Error('ImgBB upload failed: ' + imgbbData.error?.message);
    }
    const imageUrl = imgbbData.data.url;
    console.log("Image uploaded with URL: ", imageUrl)

    const response = await openai.chat.completions.create({
        model: "qwen-vl-max", // 此处以qwen-vl-max为例，可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
        messages: [{role: "user",content: [
            { type: "text", text: "你是一位经验丰富的纺织业设计师，擅长根据客户给出的需求文档或参考图分析出客户想要的花型种类/风格/和颜色。现在你收到了一份参考文件，请尝试对其进行分析，给出花型/风格/颜色三个方面的建议，字数控制在300字左右，可能的话在颜色方面给出几个pantone格式的颜色推荐4-8个左右。" },
            { type: "image_url",
              "image_url": {"url": imageUrl}}
        ]}]
    });
    console.log(JSON.stringify(response));

    let analysisResult;
    try {
      analysisResult = response.choices?.[0]?.message?.content;
    } catch (parseError) {
      console.error("Failed to parse content as JSON:", parseError);
      analysisResult = {};
    }

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