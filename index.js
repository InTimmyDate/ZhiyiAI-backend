const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(cors());
app.use(express.json());

// Simulated pattern generation endpoint
app.post("/generate-pattern", async (req, res) => {
  const { prompt, complexity, resolution } = req.body;

  try {
    // Call Python API
    const pythonResponse = await fetch("https://select-seahorse-quickly.ngrok-free.app/generate/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        num_color: 8,
        size: 1200, // Fixed guidance scale
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