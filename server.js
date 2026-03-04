import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("sccms.db");
const JWT_SECRET = process.env.JWT_SECRET || "sccms-secret-key";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'admin', 'staff')) NOT NULL,
    department TEXT
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    status TEXT CHECK(status IN ('pending', 'in-progress', 'resolved')) DEFAULT 'pending',
    assigned_to INTEGER,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed Admin if not exists
const adminExists = db
  .prepare("SELECT * FROM users WHERE role = ?")
  .get("admin");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
  ).run("System Admin", "admin@gmail.com", hashedPassword, "admin");
}

const app = express();
app.use(express.json());

// File Upload Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });
app.use("/uploads", express.static("uploads"));

// Auth Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// --- API ROUTES ---

// Auth
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role, department } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db
      .prepare(
        "INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)",
      )
      .run(name, email, hashedPassword, role || "student", department || null);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    JWT_SECRET,
  );
  res.json({
    token,
    user: { id: user.id, name: user.name, role: user.role, email: user.email },
  });
});

// Complaints
app.post(
  "/api/complaints",
  authenticate,
  upload.single("image"),
  (req, res) => {
    const { title, description, category, priority } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const result = db
      .prepare(
        `
    INSERT INTO complaints (student_id, title, description, category, priority, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
      )
      .run(
        req.user.id,
        title,
        description,
        category,
        priority || "medium",
        imageUrl,
      );
    res.status(201).json({ id: result.lastInsertRowid });
  },
);

app.get("/api/complaints", authenticate, (req, res) => {
  let complaints;
  if (req.user.role === "admin") {
    complaints = db
      .prepare(
        `
      SELECT c.*, u.name as student_name, s.name as staff_name 
      FROM complaints c 
      JOIN users u ON c.student_id = u.id
      LEFT JOIN users s ON c.assigned_to = s.id
      ORDER BY c.created_at DESC
    `,
      )
      .all();
  } else if (req.user.role === "staff") {
    complaints = db
      .prepare(
        `
      SELECT c.*, u.name as student_name 
      FROM complaints c 
      JOIN users u ON c.student_id = u.id
      WHERE c.assigned_to = ?
      ORDER BY c.created_at DESC
    `,
      )
      .all(req.user.id);
  } else {
    complaints = db
      .prepare(
        "SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC",
      )
      .all(req.user.id);
  }
  res.json(complaints);
});

app.get("/api/complaints/:id", authenticate, (req, res) => {
  const complaint = db
    .prepare(
      `
    SELECT c.*, u.name as student_name, s.name as staff_name 
    FROM complaints c 
    JOIN users u ON c.student_id = u.id
    LEFT JOIN users s ON c.assigned_to = s.id
    WHERE c.id = ?
  `,
    )
    .get(req.params.id);

  const comments = db
    .prepare(
      `
    SELECT c.*, u.name as user_name, u.role as user_role
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.complaint_id = ?
    ORDER BY c.created_at ASC
  `,
    )
    .all(req.params.id);

  res.json({ ...complaint, comments });
});

app.patch("/api/complaints/:id/status", authenticate, (req, res) => {
  const { status } = req.body;
  db.prepare(
    "UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  ).run(status, req.params.id);
  res.json({ success: true });
});

app.patch("/api/complaints/:id/assign", authenticate, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  const { staff_id } = req.body;
  db.prepare(
    'UPDATE complaints SET assigned_to = ?, status = "in-progress", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
  ).run(staff_id, req.params.id);
  res.json({ success: true });
});

app.post("/api/complaints/:id/comments", authenticate, (req, res) => {
  const { comment } = req.body;
  db.prepare(
    "INSERT INTO comments (complaint_id, user_id, comment) VALUES (?, ?, ?)",
  ).run(req.params.id, req.user.id, comment);
  res.status(201).json({ success: true });
});

// User Management (Admin)
app.get("/api/users/staff", authenticate, (req, res) => {
  const staff = db
    .prepare('SELECT id, name, department FROM users WHERE role = "staff"')
    .all();
  res.json(staff);
});

app.get("/api/stats", authenticate, (req, res) => {
  const stats = {
    total: db.prepare("SELECT COUNT(*) as count FROM complaints").get().count,
    pending: db
      .prepare(
        'SELECT COUNT(*) as count FROM complaints WHERE status = "pending"',
      )
      .get().count,
    resolved: db
      .prepare(
        'SELECT COUNT(*) as count FROM complaints WHERE status = "resolved"',
      )
      .get().count,
    inProgress: db
      .prepare(
        'SELECT COUNT(*) as count FROM complaints WHERE status = "in-progress"',
      )
      .get().count,
  };
  res.json(stats);
});

// --- VITE MIDDLEWARE ---
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) =>
    res.sendFile(path.join(__dirname, "dist/index.html")),
  );
}

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`SCCMS Server running on http://localhost:${PORT}`);
});
