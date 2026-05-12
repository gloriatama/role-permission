const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/start-testing', (req, res) => {
    const { odooUrl, adminUsername, adminPassword, salesUsername, salesPassword } = req.body;
    
    console.log('--- Data Testing Diterima ---');
    console.log(`Odoo URL: ${odooUrl}`);
    console.log(`Admin Account: ${adminUsername} / ${adminPassword}`);
    console.log(`Sales Account: ${salesUsername} / ${salesPassword}`);
    console.log('-----------------------------');

    res.status(200).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #4CAF50;">✓ Data Berhasil Diterima</h2>
            <p>Konfigurasi testing untuk <strong>${odooUrl}</strong> telah dicatat di server.</p>
            <a href="/" style="color: #2196F3; text-decoration: none;">Kembali ke Form</a>
        </div>
    `);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
