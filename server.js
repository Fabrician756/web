// server.js - Complete version with enhanced admin system
const express = require("express");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = "supersecret123";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// APK storage folder
const apkFolder = path.join(__dirname, "apks");
app.use("/apks/files", express.static(apkFolder));

const usersFile = path.join(__dirname, "users.json");
function readUsers() {
  if (!fs.existsSync(usersFile)) return [];
  try { return JSON.parse(fs.readFileSync(usersFile, "utf8") || "[]"); } catch { return []; }
}
function writeUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// ==================== ENHANCED ADMIN SYSTEM ====================

const adminFile = path.join(__dirname, "admins.json");

// Initialize admin file with owner account
function initializeAdminFile() {
  if (!fs.existsSync(adminFile)) {
    const ownerAdmin = [{
      email: "owner@fabby.icu",
      password: "owner123", // Change this to a secure password
      role: "owner",
      createdAt: new Date().toISOString()
    }];
    fs.writeFileSync(adminFile, JSON.stringify(ownerAdmin, null, 2));
    console.log("Owner admin account created");
  }
}

function readAdmins() {
  if (!fs.existsSync(adminFile)) return [];
  try { 
    return JSON.parse(fs.readFileSync(adminFile, "utf8") || "[]"); 
  } catch { 
    return []; 
  }
}

function writeAdmins(admins) {
  fs.writeFileSync(adminFile, JSON.stringify(admins, null, 2));
}

// Initialize admin system on server start
initializeAdminFile();

// ---------------- ADMIN AUTHENTICATION ----------------
app.post("/admin/login", (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password required" });
  }

  const admins = readAdmins();
  const admin = admins.find(a => a.email === email && a.password === password);
  
  if (admin) {
    const token = jwt.sign({ 
      email: admin.email, 
      role: admin.role 
    }, SECRET_KEY, { expiresIn: "1d" });
    
    res.json({ 
      success: true, 
      token,
      role: admin.role
    });
  } else {
    res.status(401).json({ success: false, message: "Invalid email or password" });
  }
});

// ---------------- ADMIN VERIFICATION ----------------
app.get("/api/admin/verify", (req, res) => {
  let auth = req.headers["authorization"];
  if (!auth && req.query && req.query.token) auth = "Bearer " + req.query.token;
  if (!auth) return res.json({ isAdmin: false });

  try {
    const payload = jwt.verify(auth.split(" ")[1], SECRET_KEY);
    const admins = readAdmins();
    const admin = admins.find(a => a.email === payload.email);
    
    if (admin) {
      res.json({ 
        isAdmin: true,
        role: admin.role,
        email: admin.email
      });
    } else {
      res.json({ isAdmin: false });
    }
  } catch (err) {
    res.json({ isAdmin: false });
  }
});

// ---------------- CREATE ADMIN (OWNER ONLY) ----------------
app.post("/admin/create", (req, res) => {
  let auth = req.headers["authorization"];
  if (!auth) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const payload = jwt.verify(auth.split(" ")[1], SECRET_KEY);
    const admins = readAdmins();
    const currentAdmin = admins.find(a => a.email === payload.email);
    
    // Only owner can create admins
    if (!currentAdmin || currentAdmin.role !== "owner") {
      return res.status(403).json({ success: false, message: "Only owner can create admins" });
    }

    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    // Check if admin already exists
    if (admins.find(a => a.email === email)) {
      return res.status(400).json({ success: false, message: "Admin already exists" });
    }

    // Create new admin
    const newAdmin = {
      email,
      password,
      role: "admin",
      createdAt: new Date().toISOString(),
      createdBy: currentAdmin.email
    };

    admins.push(newAdmin);
    writeAdmins(admins);

    res.json({ 
      success: true, 
      message: "Admin created successfully" 
    });
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
});

// ---------------- LIST ADMINS (OWNER ONLY) ----------------
app.get("/admin/list", (req, res) => {
  let auth = req.headers["authorization"];
  if (!auth) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const payload = jwt.verify(auth.split(" ")[1], SECRET_KEY);
    const admins = readAdmins();
    const currentAdmin = admins.find(a => a.email === payload.email);
    
    // Only owner can list admins
    if (!currentAdmin || currentAdmin.role !== "owner") {
      return res.status(403).json({ success: false, message: "Only owner can view admin list" });
    }

    // Return admins without passwords
    const adminList = admins.map(admin => ({
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt,
      createdBy: admin.createdBy
    }));

    res.json({ success: true, admins: adminList });
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
});

// ---------------- DELETE ADMIN (OWNER ONLY) ----------------
app.delete("/admin/delete/:email", (req, res) => {
  let auth = req.headers["authorization"];
  if (!auth) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const payload = jwt.verify(auth.split(" ")[1], SECRET_KEY);
    const admins = readAdmins();
    const currentAdmin = admins.find(a => a.email === payload.email);
    
    // Only owner can delete admins
    if (!currentAdmin || currentAdmin.role !== "owner") {
      return res.status(403).json({ success: false, message: "Only owner can delete admins" });
    }

    const targetEmail = req.params.email;
    
    // Prevent owner from deleting themselves
    if (targetEmail === currentAdmin.email) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    }

    const filteredAdmins = admins.filter(admin => admin.email !== targetEmail);
    
    if (filteredAdmins.length === admins.length) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    writeAdmins(filteredAdmins);
    res.json({ success: true, message: "Admin deleted successfully" });
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
});

// ---------------- SIGNUP ----------------
app.post("/signup", (req, res) => {
  const { name, email, phone, age, password } = req.body;
  if (!email || !password || !name) return res.status(400).json({ success: false, message: "Missing fields" });

  const users = readUsers();
  if (users.find(u => u.email === email)) return res.status(400).json({ success: false, message: "Email exists" });

  users.push({ name, email, phone, age, password });
  writeUsers(users);

  const token = jwt.sign({ email, name }, SECRET_KEY, { expiresIn: "1d" });
  res.json({ success: true, token });
});

// ---------------- LOGIN ----------------
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ success: false, message: "ERROR: CREDS NOT MATCH" });

  const token = jwt.sign({ email, name: user.name }, SECRET_KEY, { expiresIn: "1d" });
  res.json({ success: true, token });
});

// ---------------- VERIFY ----------------
app.get("/api/verify", (req, res) => {
  let auth = req.headers["authorization"];
  if (!auth && req.query && req.query.token) auth = "Bearer " + req.query.token;
  if (!auth) return res.json({ loggedIn: false });

  try {
    const payload = jwt.verify(auth.split(" ")[1], SECRET_KEY);
    res.json({ loggedIn: true, email: payload.email, name: payload.name });
  } catch (err) {
    res.json({ loggedIn: false });
  }
});

// ---------------- UPLOAD APK ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create apks folder if it doesn't exist
    if (!fs.existsSync(apkFolder)) {
      fs.mkdirSync(apkFolder, { recursive: true });
    }
    cb(null, apkFolder);
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension)
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase();
    cb(null, baseName + extension);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/vnd.android.package-archive" || 
        file.originalname.toLowerCase().endsWith(".apk")) {
      cb(null, true);
    } else {
      cb(new Error("Only APK files are allowed"), false);
    }
  }
});

app.post("/admin/upload", (req, res) => {
  let auth = req.headers["authorization"];
  if (!auth) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    jwt.verify(auth.split(" ")[1], SECRET_KEY);
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  upload.single("apk")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    res.json({ 
      success: true, 
      message: "APK uploaded successfully",
      filename: req.file.filename
    });
  });
});

// ---------------- UPLOAD ICON ----------------
const iconUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(apkFolder)) {
        fs.mkdirSync(apkFolder, { recursive: true });
      }
      cb(null, apkFolder);
    },
    filename: (req, file, cb) => {
      const { apkName } = req.body;
      cb(null, apkName + ".png");
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  }
});

app.post("/admin/upload-icon", (req, res) => {
  let auth = req.headers["authorization"];
  if (!auth) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    jwt.verify(auth.split(" ")[1], SECRET_KEY);
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  iconUpload.single("icon")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No icon uploaded" });
    }

    res.json({ 
      success: true, 
      message: "Icon uploaded successfully",
      filename: req.file.filename
    });
  });
});

// ---------------- DELETE APK ----------------
app.delete("/admin/apk/:name", (req, res) => {
  let auth = req.headers["authorization"];
  if (!auth) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    jwt.verify(auth.split(" ")[1], SECRET_KEY);
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const apkName = req.params.name;
  const apkPath = path.join(apkFolder, apkName + ".apk");
  const iconPath = path.join(apkFolder, apkName + ".png");

  try {
    if (fs.existsSync(apkPath)) {
      fs.unlinkSync(apkPath);
    }

    if (fs.existsSync(iconPath)) {
      fs.unlinkSync(iconPath);
    }

    res.json({ success: true, message: "APK deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting APK" });
  }
});

// ---------------- LIST APKs ----------------
app.get("/api/apks", (req, res) => {
  let auth = req.headers["authorization"];
  if (!auth && req.query && req.query.token) auth = "Bearer " + req.query.token;
  if (!auth) return res.status(401).json({ success: false });

  try {
    jwt.verify(auth.split(" ")[1], SECRET_KEY);
  } catch {
    return res.status(401).json({ success: false });
  }

  const files = fs.existsSync(apkFolder) ? fs.readdirSync(apkFolder) : [];
  const apkFiles = files.filter(f => f.toLowerCase().endsWith(".apk"));
  const list = apkFiles.map(file => {
    const base = path.parse(file).name;
    const iconFile = files.includes(base + ".png") ? base + ".png" : null;
    return { name: base, apk: file, icon: iconFile };
  });

  res.json({ success: true, apks: list });
});

// ---------------- DOWNLOAD APK ----------------
app.get("/download/:name", (req, res) => {
  let auth = req.headers["authorization"];
  if (!auth && req.query && req.query.token) auth = "Bearer " + req.query.token;
  if (!auth) return res.status(401).send("Unauthorized");

  try {
    jwt.verify(auth.split(" ")[1], SECRET_KEY);
  } catch {
    return res.status(401).send("Unauthorized");
  }

  const fileName = req.params.name;
  const filePath = path.join(apkFolder, fileName);
  if (!fs.existsSync(filePath)) return res.status(404).send("APK not found");
  res.download(filePath);
});

// ---------------- PAGE ROUTES ----------------
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/signup", (req, res) => res.sendFile(path.join(__dirname, "signup", "index.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "login", "index.html")));
app.get("/home", (req, res) => res.sendFile(path.join(__dirname, "home", "index.html")));
app.get("/apks", (req, res) => res.sendFile(path.join(__dirname, "apks", "index.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "admin", "index.html")));
app.get("/admin/dashboard", (req, res) => res.sendFile(path.join(__dirname, "admin", "dashboard.html")));
app.get("/admin/manage", (req, res) => res.sendFile(path.join(__dirname, "admin", "manage-admins.html"))); // NEW: Admin management page

// fallback
app.use((req, res) => res.redirect("/"));

app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));