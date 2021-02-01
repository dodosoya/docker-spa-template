'use strict';
const express = require('express');
const app = express();

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 5000;

app.get('/api/message', (req, res) => {
  res.json({ 'message': 'Hello, I am from node.' });
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
