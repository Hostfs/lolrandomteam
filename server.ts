import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // Ensure logs directory exists
  const logsDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }

  // API route for logging
  app.post("/api/log-result", (req, res) => {
    try {
      const { players, teamBlue, teamRed } = req.body;
      
      // Get IP address
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      
      const timestamp = new Date().toISOString();
      const logEntry = `
--------------------------------------------------
Time: ${timestamp}
IP: ${ip}
Input Players: ${JSON.stringify(players)}
Result:
  Blue Team: ${JSON.stringify(teamBlue)}
  Red Team: ${JSON.stringify(teamRed)}
--------------------------------------------------
`;

      fs.appendFileSync(path.join(logsDir, "usage.log"), logEntry);
      
      res.json({ status: "success" });
    } catch (error) {
      console.error("Error logging result:", error);
      res.status(500).json({ status: "error", message: "Failed to log result" });
    }
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
