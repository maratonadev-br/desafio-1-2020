const express = require('express');
const routes = require('./routes');
const { join } = require('path');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use((req, _, next) => {
  console.log('\n' + new Date());
  console.log(`New ${req.method} request ${req.path}`);
  req.body && console.log('Body:', req.body);
  req.query && console.log('Query:', req.query);
  req.params && console.log('Params:', req.params);
  next();
});
app.use(routes);
app.use(express.static(join(__dirname, '..', 'public')));

const port = process.env.PORT || 5000;

app.listen(port, '0.0.0.0', () => console.log('App running on port', port));
