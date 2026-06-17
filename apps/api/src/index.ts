import "dotenv/config"
import express from "express"
import cors from "cors"
import path from "path"
import rateLimit from "express-rate-limit"

import authRoutes from "./routes/auth"
import documentRoutes from "./routes/documents"

const app = express()
const PORT = process.env.PORT || 4000

const allowedOrigin = (
  process.env.FRONTEND_URL || "http://localhost:3000"
).replace(/\/$/, "")

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many requests, please try again later",
})

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later",
})

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin.replace(/\/$/, "") === allowedOrigin) {
        callback(null, true)
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`))
      }
    },
    credentials: true,
  }),
)

app.use("/api/auth", authLimiter)
app.use("/api", limiter)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")))

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.use("/api/auth", authRoutes)
app.use("/api/documents", documentRoutes)

// Generic error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err.stack)
    res.status(500).json({ error: err.message || "Internal server error" })
  },
)

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`)
  })
}

export default app
