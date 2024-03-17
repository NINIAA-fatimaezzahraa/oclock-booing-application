const express = require('express');
const app = express();

app.get('/api/test', (req, res) => {
    res.json('test ok');
});

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});
