const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
let pair = require('./pair');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/code', pair);

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, '/pair.html'));
});

app.listen(PORT, () => {
    console.log(`⏩ SENURA-MD Server running on port ${PORT}`);
});
