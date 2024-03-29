const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const bcryptSalt = bcrypt.genSaltSync(10);
const jwt = require('jsonwebtoken');
const jwtSecret = 'fasefraw4r5r3wq45wdfgw34twdfg';

const User = require('../models/User.js');

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        console.log('Trying to create a user');
        const userDoc = await User.create({
            name,
            email,
            password: bcrypt.hashSync(password, bcryptSalt)
        });

        console.log('User created:', userDoc);
        res.json(userDoc);
    } catch (err) {
        console.error('Error caught in /register:', err);
        res.status(422).json(err);
    }
});


router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const userDoc = await User.findOne({ email });

    if (userDoc) {
        const passOk = bcrypt.compareSync(password, userDoc.password);
        if (passOk) {
            jwt.sign({
                email: userDoc.email,
                id: userDoc._id
            }, jwtSecret, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token).json(userDoc);
            });
        } else {
            res.status(422).json('Wrong password');
        }
    } else {
        res.json('user not found');
    }
});

router.get('/profile', (req, res) => {
    const { token } = req.cookies;

    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) throw err;
            const { name, email, _id } = await User.findById(userData.id);
            res.json({ name, email, _id });
        });
    } else {
        res.json(null);
    }
});

router.post('/logout', (req, res) => {
    res.cookie('token', '').json(true);
});

module.exports = router;