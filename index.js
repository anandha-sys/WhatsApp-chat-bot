const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: false }));

// WhatsApp webhook
app.post("/whatsapp", (req, res) => {
  const msg = req.body.Body;

  let reply = "🤖 Bot is working!";

  if (msg && msg.toLowerCase().includes("hi")) {
    reply = "Hello 👋 Conan!";
  }

  if (msg && msg.toLowerCase().includes("help")) {
    reply = "Type anything, I will reply 😎";
  }

  res.set("Content-Type", "text/xml");
  res.send(`<Response><Message>${reply}</Message></Response>`);
});

// Test route
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// IMPORTANT for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started on " + PORT));
