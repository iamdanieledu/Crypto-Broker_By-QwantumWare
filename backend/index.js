
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

const dbPath = './db.json';

app.use(cors());
app.use(bodyParser.json());

// Helper function to read the database
const readDB = () => {
  const dbData = fs.readFileSync(dbPath);
  return JSON.parse(dbData);
};

// Helper function to write to the database
const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Signup endpoint
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, phone } = req.body;

  if (!email || !password || !phone) {
    return res.status(400).json({ message: 'Email, password, and phone number are required.' });
  }

  const db = readDB();

  if (db.users.find(user => user.email === email)) {
    return res.status(400).json({ message: 'User with this email already exists.' });
  }

  if (db.users.find(user => user.phone === phone)) {
    return res.status(400).json({ message: 'User with this phone number already exists.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now(), email, password: hashedPassword, phone };

  db.users.push(newUser);
  writeDB(db);

  res.status(201).json({ message: 'User created successfully.' });
});

// Signin endpoint
app.post('/api/auth/signin', async (req, res) => {
  const { email, phone, password } = req.body;

  if ((!email && !phone) || !password) {
    return res.status(400).json({ message: 'Email or phone number and password are required.' });
  }

  const db = readDB();
  let user;
  if (email) {
    user = db.users.find(user => user.email === email);
  } else if (phone) {
    user = db.users.find(user => user.phone === phone);
  }

  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Invalid credentials.' });
  }

  // In a real application, you would return a JWT here
  res.status(200).json({ message: 'Login successful.' });
});


app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
