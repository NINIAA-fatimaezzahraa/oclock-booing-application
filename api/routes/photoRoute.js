const express = require('express');
const router = express.Router();
const multer = require('multer');
const imageDownloader = require('image-downloader');
const fs = require('fs');
const path = require('path');

router.post('/upload-by-link', async (req, res) => {
    const { link } = req.body;
    const newName = 'photo' + Date.now() + '.jpg';

    await imageDownloader.image({
        url: link,
        dest: __dirname + '/uploads/' + newName,
    });

    res.json(newName);
});

const photosMiddleware = multer({ dest: 'uploads/' });

router.post('/upload', photosMiddleware.array('photos', 100), (req, res) => {
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


module.exports = router;