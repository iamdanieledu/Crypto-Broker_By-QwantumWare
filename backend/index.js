
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


// Dashboard endpoints
app.get('/api/dashboard/overview', (req, res) => {
  res.json({
    totalPortfolioValue: 81800,
    pnl: {
      value: 1234.56,
      percentage: 1.53
    }
  });
});

app.get('/api/dashboard/portfolio', async (req, res) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
    const data = await response.json();

    const portfolio = {
      assetBreakdown: [
        { asset: 'Bitcoin (BTC)', price: data.bitcoin.usd, holdings: 0.5, value: data.bitcoin.usd * 0.5, change: data.bitcoin.usd_24h_change, chartData: [5,10,15,20,15,10,5] },
        { asset: 'Ethereum (ETH)', price: data.ethereum.usd, holdings: 10, value: data.ethereum.usd * 10, change: data.ethereum.usd_24h_change, chartData: [10,15,10,5,10,15,10] },
        { asset: 'EUR/USD', price: 1.18, holdings: 10000, value: 11800, change: 0.1, chartData: [1,2,3,2,1,2,3] }
      ],
      allocation: {
        labels: ['Bitcoin', 'Ethereum', 'EUR/USD'],
        data: [data.bitcoin.usd * 0.5, data.ethereum.usd * 10, 11800]
      }
    };

    res.json(portfolio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching portfolio data.' });
  }
});

app.get('/api/dashboard/copy-trading', (req, res) => {
  res.json({
    myCopiedTraders: [
      { name: 'TraderX', overallPnl: 15, myPnl: 500 },
      { name: 'TraderY', overallPnl: -5, myPnl: -100 }
    ],
    discoverTraders: [
      { name: 'TraderZ', overallPnl: 25, followers: 1234 },
      { name: 'TraderW', overallPnl: 10, followers: 567 }
    ]
  });
});

app.get('/api/dashboard/market-data', async (req, res) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false');
    const data = await response.json();

    const watchlist = data.map(coin => ({
      asset: `${coin.symbol.toUpperCase()}/USD`,
      price: coin.current_price,
      change: coin.price_change_percentage_24h
    }));

    const topMoversResponse = await fetch('https://api.coingecko.com/api/v3/search/trending');
    const topMoversData = await topMoversResponse.json();

    const topMovers = topMoversData.coins.slice(0, 3).map(coin => ({
        asset: `${coin.item.symbol.toUpperCase()}/USD`,
        change: coin.item.data.price_change_percentage_24h.usd
    }));


    res.json({
      watchlist,
      topMovers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching market data.' });
  }
});

app.get('/api/dashboard/recent-activity', (req, res) => {
  res.json([
    'Bought 0.1 BTC',
    'Started copying TraderX',
    'Withdrew $500',
    'Deposited $1000',
    'Sold 2 ETH'
  ]);
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
