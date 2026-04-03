const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const PORT = 3000;
const SECRET_KEY = "your-very-secure-secret";

app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"]
}));
app.use(express.json());

let nextUserId = 3;

let users = [
  {
    id: 1,
    username: "admin",
    firstname: "Admin",
    lastname: "User",
    email: "admin@example.com",
    password: bcrypt.hashSync("admin123", 10),
    verified: true,
    role: "admin"
  },
  {
    id: 2,
    username: "alice",
    firstname: "Alice",
    lastname: "Smith",
    email: "alice@example.com",
    password: bcrypt.hashSync("user123", 10),
    verified: true,
    role: "user"
  }
];

let departments = [
  { name: "Engineering", description: "Software team" },
  { name: "HR", description: "Human Resources" }
];

let employees = [
  {
    id: "EMP-001",
    email: "alice@example.com",
    position: "Developer",
    department: "Engineering",
    hireDate: "2025-01-15"
  }
];

let requests = [];

function createAuthUser(user) {
  return {
    id: user.id,
    username: user.username,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    verified: user.verified,
    role: user.role
  };
}

function getTokenPayload(user) {
  return {
    id: user.id,
    username: user.username,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    verified: user.verified,
    role: user.role
  };
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    const user = users.find(candidate => candidate.id === payload.id);

    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

function authorizeRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Access denied: insufficient permissions" });
    }
    next();
  };
}

function findUserByLogin(loginValue) {
  return users.find(user => user.username === loginValue || user.email === loginValue);
}

function sanitizeAccount(user) {
  return {
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    username: user.username,
    verified: user.verified,
    isAdmin: user.role === "admin"
  };
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeUsername(value) {
  return String(value || "").trim();
}

function getUserRouteEmail(req) {
  return decodeURIComponent(req.params.email || "");
}

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.post("/api/register", async (req, res) => {
  const firstname = String(req.body.firstname || "").trim();
  const lastname = String(req.body.lastname || "").trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "").trim();
  const username = normalizeUsername(req.body.username || email);

  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const existing = users.find(user => user.email === email || user.username === username);
  if (existing) {
    return res.status(409).json({ error: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: nextUserId++,
    username,
    firstname,
    lastname,
    email,
    password: hashedPassword,
    verified: false,
    role: "user"
  };

  users.push(newUser);

  res.status(201).json({
    message: "User registered",
    user: createAuthUser(newUser)
  });
});

app.post("/api/verify-email", (req, res) => {
  const email = normalizeEmail(req.body.email);
  const user = users.find(candidate => candidate.email === email);

  if (!user) {
    return res.status(404).json({ error: "Account not found" });
  }

  user.verified = true;
  res.json({
    message: "Email verified",
    user: createAuthUser(user)
  });
});

app.post("/api/login", async (req, res) => {
  const loginValue = normalizeUsername(req.body.username);
  const password = String(req.body.password || "");

  const user = findUserByLogin(loginValue);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (!user.verified) {
    return res.status(403).json({ error: "Account not verified yet" });
  }

  const token = jwt.sign(getTokenPayload(user), SECRET_KEY, { expiresIn: "1h" });

  res.json({
    token,
    user: createAuthUser(user)
  });
});

app.get("/api/profile", authenticateToken, (req, res) => {
  res.json({ user: createAuthUser(req.user) });
});

app.put("/api/profile", authenticateToken, (req, res) => {
  const firstname = String(req.body.firstname || "").trim();
  const lastname = String(req.body.lastname || "").trim();
  const email = normalizeEmail(req.body.email);

  if (!firstname || !lastname || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const duplicate = users.find(user => user.email === email && user.id !== req.user.id);
  if (duplicate) {
    return res.status(409).json({ error: "Email already exists" });
  }

  req.user.firstname = firstname;
  req.user.lastname = lastname;
  req.user.email = email;

  res.json({
    message: "Profile updated",
    user: createAuthUser(req.user)
  });
});

app.get("/api/accounts", authenticateToken, authorizeRole("admin"), (req, res) => {
  res.json({ accounts: users.map(sanitizeAccount) });
});

app.post("/api/accounts", authenticateToken, authorizeRole("admin"), async (req, res) => {
  const firstname = String(req.body.firstname || "").trim();
  const lastname = String(req.body.lastname || "").trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "").trim();
  const isAdmin = Boolean(req.body.isAdmin);
  const verified = Boolean(req.body.verified);
  const username = normalizeUsername(req.body.username || email);

  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const exists = users.find(user => user.email === email || user.username === username);
  if (exists) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: nextUserId++,
    username,
    firstname,
    lastname,
    email,
    password: hashedPassword,
    verified,
    role: isAdmin ? "admin" : "user"
  };

  users.push(newUser);
  res.status(201).json({ account: sanitizeAccount(newUser) });
});

app.put("/api/accounts/:email", authenticateToken, authorizeRole("admin"), async (req, res) => {
  const originalEmail = normalizeEmail(getUserRouteEmail(req));
  const account = users.find(user => user.email === originalEmail);

  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }

  const firstname = String(req.body.firstname || "").trim();
  const lastname = String(req.body.lastname || "").trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "").trim();
  const isAdmin = Boolean(req.body.isAdmin);
  const verified = Boolean(req.body.verified);
  const username = normalizeUsername(req.body.username || email);

  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const duplicate = users.find(user =>
    user.id !== account.id && (user.email === email || user.username === username)
  );
  if (duplicate) {
    return res.status(409).json({ error: "Email already exists" });
  }

  account.firstname = firstname;
  account.lastname = lastname;
  account.email = email;
  account.username = username;
  account.password = await bcrypt.hash(password, 10);
  account.verified = verified;
  account.role = isAdmin ? "admin" : "user";

  res.json({ account: sanitizeAccount(account) });
});

app.delete("/api/accounts/:email", authenticateToken, authorizeRole("admin"), (req, res) => {
  const email = normalizeEmail(getUserRouteEmail(req));
  const account = users.find(user => user.email === email);

  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }

  if (account.id === req.user.id) {
    return res.status(400).json({ error: "You cannot delete your own account" });
  }

  users = users.filter(user => user.id !== account.id);
  requests = requests.filter(request => request.employeeEmail !== email);
  employees = employees.filter(employee => employee.email !== email);

  res.json({ message: "Account deleted" });
});

app.patch("/api/accounts/:email/password", authenticateToken, authorizeRole("admin"), async (req, res) => {
  const email = normalizeEmail(getUserRouteEmail(req));
  const account = users.find(user => user.email === email);
  const password = String(req.body.password || "").trim();

  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  account.password = await bcrypt.hash(password, 10);
  res.json({ message: "Password reset successfully" });
});

app.get("/api/departments", authenticateToken, (req, res) => {
  res.json({ departments });
});

app.post("/api/departments", authenticateToken, authorizeRole("admin"), (req, res) => {
  const name = String(req.body.name || "").trim();
  const description = String(req.body.description || "").trim();

  if (!name) {
    return res.status(400).json({ error: "Department name required" });
  }

  const exists = departments.find(item => item.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    return res.status(409).json({ error: "Department already exists" });
  }

  const department = { name, description };
  departments.push(department);
  res.status(201).json({ department });
});

app.put("/api/departments/:name", authenticateToken, authorizeRole("admin"), (req, res) => {
  const originalName = decodeURIComponent(req.params.name || "");
  const department = departments.find(item => item.name === originalName);

  if (!department) {
    return res.status(404).json({ error: "Department not found" });
  }

  const name = String(req.body.name || "").trim();
  const description = String(req.body.description || "").trim();

  if (!name) {
    return res.status(400).json({ error: "Department name required" });
  }

  const duplicate = departments.find(item =>
    item.name.toLowerCase() === name.toLowerCase() && item.name !== originalName
  );
  if (duplicate) {
    return res.status(409).json({ error: "Department already exists" });
  }

  department.name = name;
  department.description = description;

  employees.forEach(employee => {
    if (employee.department === originalName) {
      employee.department = name;
    }
  });

  res.json({ department });
});

app.delete("/api/departments/:name", authenticateToken, authorizeRole("admin"), (req, res) => {
  const name = decodeURIComponent(req.params.name || "");
  const exists = departments.some(item => item.name === name);

  if (!exists) {
    return res.status(404).json({ error: "Department not found" });
  }

  departments = departments.filter(item => item.name !== name);
  res.json({ message: "Department deleted" });
});

app.get("/api/employees", authenticateToken, authorizeRole("admin"), (req, res) => {
  res.json({ employees });
});

app.post("/api/employees", authenticateToken, authorizeRole("admin"), (req, res) => {
  const employee = {
    id: String(req.body.id || "").trim(),
    email: normalizeEmail(req.body.email),
    position: String(req.body.position || "").trim(),
    department: String(req.body.department || "").trim(),
    hireDate: String(req.body.hireDate || "")
  };

  if (!employee.id || !employee.email || !employee.position || !employee.department) {
    return res.status(400).json({ error: "Please fill out all required fields" });
  }

  const exists = employees.find(item => item.id === employee.id);
  if (exists) {
    return res.status(409).json({ error: "Employee ID already exists" });
  }

  employees.push(employee);
  res.status(201).json({ employee });
});

app.put("/api/employees/:id", authenticateToken, authorizeRole("admin"), (req, res) => {
  const originalId = decodeURIComponent(req.params.id || "");
  const employee = employees.find(item => item.id === originalId);

  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  const updatedEmployee = {
    id: String(req.body.id || "").trim(),
    email: normalizeEmail(req.body.email),
    position: String(req.body.position || "").trim(),
    department: String(req.body.department || "").trim(),
    hireDate: String(req.body.hireDate || "")
  };

  if (!updatedEmployee.id || !updatedEmployee.email || !updatedEmployee.position || !updatedEmployee.department) {
    return res.status(400).json({ error: "Please fill out all required fields" });
  }

  const duplicate = employees.find(item => item.id === updatedEmployee.id && item.id !== originalId);
  if (duplicate) {
    return res.status(409).json({ error: "Employee ID already exists" });
  }

  Object.assign(employee, updatedEmployee);
  res.json({ employee });
});

app.delete("/api/employees/:id", authenticateToken, authorizeRole("admin"), (req, res) => {
  const id = decodeURIComponent(req.params.id || "");
  const exists = employees.some(item => item.id === id);

  if (!exists) {
    return res.status(404).json({ error: "Employee not found" });
  }

  employees = employees.filter(item => item.id !== id);
  res.json({ message: "Employee deleted" });
});

app.get("/api/requests", authenticateToken, (req, res) => {
  const visibleRequests = req.user.role === "admin"
    ? requests
    : requests.filter(request => request.employeeEmail === req.user.email);

  res.json({ requests: visibleRequests });
});

app.post("/api/requests", authenticateToken, (req, res) => {
  const type = String(req.body.type || "").trim() || "Equipment";
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const validItems = items
    .map(item => ({
      name: String(item.name || "").trim(),
      qty: Number.parseInt(item.qty, 10)
    }))
    .filter(item => item.name && Number.isInteger(item.qty) && item.qty > 0);

  if (validItems.length === 0) {
    return res.status(400).json({ error: "Please add at least one valid item" });
  }

  const request = {
    id: crypto.randomUUID(),
    type,
    items: validItems,
    status: "Pending",
    date: new Date().toISOString(),
    employeeEmail: req.user.email
  };

  requests.push(request);
  res.status(201).json({ request });
});

app.patch("/api/requests/:id/status", authenticateToken, authorizeRole("admin"), (req, res) => {
  const request = requests.find(item => item.id === req.params.id);
  const status = String(req.body.status || "");

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid request status" });
  }

  request.status = status;
  res.json({ request });
});

app.delete("/api/requests/:id", authenticateToken, authorizeRole("admin"), (req, res) => {
  const exists = requests.some(item => item.id === req.params.id);

  if (!exists) {
    return res.status(404).json({ error: "Request not found" });
  }

  requests = requests.filter(item => item.id !== req.params.id);
  res.json({ message: "Request deleted" });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log("Try logging in with:");
  console.log("  - Admin: username=admin, password=admin123");
  console.log("  - User: username=alice, password=user123");
});
