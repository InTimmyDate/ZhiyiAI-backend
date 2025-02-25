const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(cors());
app.use(express.json());

// Simulated pattern generation endpoint
app.post("/generate-pattern", (req, res) => {
  const { prompt, complexity, resolution } = req.body;

  // Simulating pattern generation (replace this with your actual logic)
  console.log(`Received request: prompt=${prompt}, complexity=${complexity}, resolution=${resolution}`);
  
  // Fake image URL (replace with real generated image URL)
  const fakeImageUrl = "https://via.placeholder.com/512";

  // Send response back to the frontend
  res.json({
    success: true,
    message: "Pattern generated successfully!",
    imageUrl: fakeImageUrl,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});