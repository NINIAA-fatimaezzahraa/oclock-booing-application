const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const connectDatabase = require('./config/database');

require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

const corsOptions = {
    origin: ['http://127.0.0.1:5173', 'http://127.0.0.1'],
    credentials: true,
};

app.use(cors(corsOptions));

connectDatabase();

const userRoutes = require('./routes/userRoute.js');
const placeRoutes = require('./routes/placeRoute.js');
const bookingRoutes = require('./routes/bookingRoute.js');
const photoRoutes = require('./routes/photoRoute.js');

app.use('/api', userRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/photo', photoRoutes); 

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});