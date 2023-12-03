require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');

const app = express();

// PostgreSQL pool configuration
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Enable CORS for React app
app.use(cors());

app.use(express.json()); // for parsing application/json

// Example route: Test database connection
app.get('/test-db', async (req, res) => {
    try {
        const response = await pool.query('SELECT *');
        res.json(response.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error while testing the database connection');
    }
});

// User Registration and Login Endpoints
app.post(
    '/register',
    [
        check('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
        check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        try {
            // Check if the username already exists
            const userExists = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            if (userExists.rows.length > 0) {
                return res.status(400).json({ errors: [{ msg: 'Username already exists' }] });
            }

            // Hash the password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Insert the user into the database
            const insertQuery = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id';
            const result = await pool.query(insertQuery, [username, hashedPassword]);

            res.status(200).json({ userId: result.rows[0].id });
        } catch (err) {
            console.error('Error during user registration:', err);
            res.status(500).send('Error during user registration');
        }
    }
);
app.get('/portfolio', async (req, res) => {
    // Assume req.userId is the ID of the authenticated user
    try {
        const result = await pool.query('SELECT * FROM portfolios WHERE user_id = $1', [req.userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).send('Error fetching portfolio');
    }
});

app.post('/login', async (req, res) => {
    // Get the username and password from the request body
    const { username, password } = req.body;

    try {
        // Step 1: Check if the username exists in the database
        const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        // If no user with the provided username is found, return an error response
        if (user.rows.length === 0) {
            return res.status(401).json({ message: 'Authentication failed: User not found' });
        }

        // Step 2: Compare the provided password with the hashed password in the database
        const hashedPassword = user.rows[0].password;

        // Use bcrypt to compare the provided password with the hashed password
        const passwordsMatch = await bcrypt.compare(password, hashedPassword);

        // If the passwords match, authentication is successful
        if (passwordsMatch) {
            return res.status(200).json({ message: 'Authentication successful' });
        } else {
            // If the passwords don't match, return an error response
            return res.status(401).json({ message: 'Authentication failed: Incorrect password' });
        }
    } catch (error) {
        // Handle any server errors that may occur during the authentication process
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'Server error during login' });
    }
});

// Choose a different port number, e.g., 5101
const PORT = 5101;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
