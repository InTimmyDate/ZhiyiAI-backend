const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.post("/generate-pattern", async (req, res) => {
  const { genType, prompt, width, height } = req.body;

  try {
    // Call Python API
    const pythonResponse = await fetch("https://select-seahorse-quickly.ngrok-free.app/generate/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        genType,
        prompt,
        width,
        height,
      }),
    });

    const data = await pythonResponse.json();

    if (!data.success) {
      throw new Error("Error generating pattern");
    }

    // Return the generated image to the frontend
    res.json({
      success: true,
      message: "Pattern generated successfully!",
      image: `data:image/png;base64,${data.image}`, // Return Base64 image
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Error generating pattern" });
  }
});

app.post("/reduce-color", async (req, res) => {
  const { num_color, uploadedImage } = req.body;

  try {
    // Call Python API
    const pythonResponse = await fetch("https://select-seahorse-quickly.ngrok-free.app/reduce/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        num_color,
        uploadedImage,
      }),
    });

    const data = await pythonResponse.json();

    if (!data.success) {
      throw new Error("Error generating pattern");
    }

    // Return the generated image to the frontend
    res.json({
      success: true,
      message: "Pattern generated successfully!",
      image: `data:image/png;base64,${data.image}`, // Return Base64 image
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Error generating pattern" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});