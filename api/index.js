const express = require('express');
const cors = require('cors');
const { default: mongoose } = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const User = require('./models/User.js');
const Place = require('./models/Place.js');
const Booking = require('./models/Booking.js');

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'fasefraw4r5r3wq45wdfgw34twdfg';

require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

const allowedOrigins = ['http://127.0.0.1:5173', 'http://127.0.0.1'];

const corsOptionsDelegate = function (req, callback) {
    let corsOptions;
    if (allowedOrigins.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true };
    } else {
        corsOptions = { origin: false };
    }
    callback(null, corsOptions);
};

app.use(cors(corsOptionsDelegate));

mongoose.connect(process.env.MONGO_URL);

app.get('/api/test', (req, res) => {
    res.json('test ok');
});

app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userDoc = await User.create({
            name,
            email,
            password: bcrypt.hashSync(password, bcryptSalt)
        });

        console.log(name);
        res.json(userDoc);
    } catch (e) {
        res.status(422).json(e);
    }
});

app.post('/api/login', async (req, res) => {
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

app.get('/api/profile', (req, res) => {
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

app.post('/api/logout', (req, res) => {
    res.cookie('token', '').json(true);
});

app.post('/api/upload-by-link', async (req, res) => {
    const { link } = req.body;
    const newName = 'photo' + Date.now() + '.jpg';

    await imageDownloader.image({
        url: link,
        dest: __dirname + '/uploads/' + newName,
    });

    res.json(newName);
});


const photosMiddleware = multer({ dest: 'uploads/' });

app.post('/api/upload', photosMiddleware.array('photos', 100), (req, res) => {
    const uploadedFiles = [];
    for (const element of req.files) {
        const { path, originalname } = element;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        const newPath = path + '.' + ext;

        fs.renameSync(path, newPath);
        uploadedFiles.push(newPath.replace('uploads/', ''));
    }

    res.json(uploadedFiles);
});

app.post('/api/places', (req, res) => {
    const { token } = req.cookies;

    const {
        title,
        address,
        addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuests,
        price
    } = req.body;

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const placeDoc = await Place.create({
            owner: userData.id,
            title,
            address,
            photos: addedPhotos,
            description,
            perks,
            extraInfo,
            checkIn,
            checkOut,
            maxGuests,
            price
        });

        res.json(placeDoc);
    });
});

app.get('/api/user-places', async (req, res) => {
    const { token } = req.cookies;

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        const { id } = userData;

        res.json(await Place.find({ owner: id }));
    });
});

app.get('/api/places/:id', async (req, res) => {
    const { id } = req.params;
    res.json(await Place.findById(id));
});

app.put('/api/places', async (req, res) => {
    const { token } = req.cookies;
    const {
        id,
        title,
        address,
        addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuests,
        price
    } = req.body;

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        const placeDoc = await Place.findById(id);

        if (userData.id === placeDoc.owner.toString()) {
            placeDoc.set({
                title, address, photos: addedPhotos, description,
                perks, extraInfo, checkIn, checkOut, maxGuests, price
            });
            await placeDoc.save();
            res.json('place update ok');
        }
    });
});

app.get('/api/places', async (req, res) => {
    res.json(await Place.find());
});

function getUserDataFromReq(req) {
    return new Promise((resolve, reject) => {
        jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
            if (err) throw err;
            resolve(userData);
        });
    });
}

app.post('/api/bookings', async (req, res) => {
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

app.get('/api/bookings', async (req, res) => {
    const userData = await getUserDataFromReq(req);
    res.json(await Booking.find({ user: userData.id }).populate('place'));
});


app.listen(4000, () => {
    console.log('Server is running on port 4000');
});
