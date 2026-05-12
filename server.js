const express = require('express');
const path = require('path');
const { runTests } = require('./utils/testRunner');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/start-testing', async (req, res) => {
    const { odooUrl, adminUsername, adminPassword, salesUsername, salesPassword } = req.body;

    console.log('--- Data Testing Diterima ---');
    console.log(`Odoo URL: ${odooUrl}`);
    console.log(`Admin Account: ${adminUsername} / ${'*'.repeat(adminPassword.length)}`);
    console.log(`Sales Account: ${salesUsername} / ${'*'.repeat(salesPassword.length)}`);
    console.log('-----------------------------');

    try {
        const result = await runTests(req.body);
        res.json({
            success: true,
            message: 'Pengujian selesai!',
            data: result.results,
        });
    } catch (error) {
        console.error('Test runner error:', error);
        res.status(500).json({
            success: false,
            message: `Terjadi kesalahan: ${error.message}`,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
