const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const { Connection, Request } = require('tedious');

const app = express();
const hostname = '127.0.0.1';
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

const config = {
  server: 'DESKTOP-AJ58TNK',
  authentication: {
    type: 'ntlm',
    options: {
      domain: '', // Omit or leave empty for local accounts
      userName: 'Skull Crusher',
      password: 'berlin',
    }
  },
  options: {
    encrypt: true,
    database: 'Rely',
    trustServerCertificate: true,
  }
};

const connection = new Connection(config);

connection.on('connect', err => {
  if (err) {
    console.error('Connection failed:', err);
  } else {
    console.log('Connected to the database.');
  }
});

connection.connect();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname, 'signin.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.post('/signup', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const checkEmailQuery = `SELECT COUNT(*) AS count FROM Users WHERE Email = '${email}'`;

  const checkRequest = new Request(checkEmailQuery, (err, rowCount, rows) => {
    if (err) {
      console.error('Error checking email:', err);
      res.status(500).send('Server error. Please try again later.');
    } else {
      let emailExists = false;

      if (rows.length > 0 && rows[0][0].value > 0) {
        emailExists = true;
      }

      if (emailExists) {
        res.status(400).send('This email is already registered.');
      } else {
        const insertQuery = `INSERT INTO Users (Email, Password) VALUES ('${email}', '${password}')`;

        const insertRequest = new Request(insertQuery, (err) => {
          if (err) {
            if (err.code === 'EREQUEST' && err.number === 2627) { // Unique constraint violation
              console.error('Email already exists:', err);
              res.status(400).send('This email is already registered.');
            } else {
              console.error('Error inserting data:', err);
              res.status(500).send('Error saving data.');
            }
          } else {
            res.status(200).send('User registered successfully.');
          }
        });

        connection.execSql(insertRequest);
      }
    }
  });

  connection.execSql(checkRequest);
});


app.use(express.static(path.join(__dirname)));

app.use((req, res, next) => {
  fs.readFile(path.join(__dirname, '404.html'), 'utf8', (err, data) => {
    if (err) {
      res.status(404).send('<h1>404 Not Found</h1>');
    } else {
      res.status(404).send(data);
    }
  });
});

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
