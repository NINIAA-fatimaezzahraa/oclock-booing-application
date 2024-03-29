
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const jwtSecret = 'fasefraw4r5r3wq45wdfgw34twdfg';

const Booking = require('../models/Booking.js');

function getUserDataFromReq(req) {
    return new Promise((resolve, reject) => {
        jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
            if (err) throw err;
            resolve(userData);
        });
    });
}

router.post('/', async (req, res) => {
    const userData = await getUserDataFromReq(req);
    const {
        place,
        checkIn,
        checkOut,
        numberOfGuests,
        name,
        phone,
        price
    } = req.body;

    Booking.create({
        place,
        checkIn,
        checkOut,
        numberOfGuests,
        name,
        phone,
        price,
        user: userData.id
    }).then((doc) => {
        res.json(doc);
    }).catch((err) => {
        throw err;
    });
});

router.get('/', async (req, res) => {
    const userData = await getUserDataFromReq(req);
    res.json(await Booking.find({ user: userData.id }).populate('place'));
});

module.exports = router;