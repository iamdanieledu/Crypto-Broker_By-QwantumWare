
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
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const db = readDB();

  if (db.users.find(user => user.email === email)) {
    return res.status(400).json({ message: 'User already exists.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now(), email, password: hashedPassword };

  db.users.push(newUser);
  writeDB(db);

  res.status(201).json({ message: 'User created successfully.' });
});

// Signin endpoint
app.post('/api/auth/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const db = readDB();
  const user = db.users.find(user => user.email === email);

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
