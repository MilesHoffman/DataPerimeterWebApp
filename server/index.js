// server/index.js
const express = require('express');
const app = express();
const port = 5000;

app.get('/api/hello', (req, res) => {
	res.json({ message: 'Hello from the backend!' });
});

app.listen(port, () => {
	console.log(`Backend server listening at http://localhost:${port}`);
});