const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require("path");
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));

app.post("/api/new", upload.single('image'), (req, res) => {
    const command = 'python3 scripts/new.py';
    try {
        const image = req.file;
        const jsonData = req.body.jsonData;
        const imgName = "image.jpeg";
        fs.writeFileSync(imgName, image.buffer);

        exec(command, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error executing the script: ${error}`);
              return;
            }
            // Print the output of the Python script
            console.log(`Python script output: ${stdout}`);
          });

        res.json({ message: 'Data received successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
})

app.post('/api/find', upload.single('image'), (req, res) => {
    const command = 'python3 scripts/find.py';
    try {
        const image = req.file;
        const imgName = "image_new.jpeg";
        fs.writeFileSync(imgName, image.buffer);
        const jsonData = req.body.jsonData;

        exec(command, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error executing the script: ${error}`);
              return;
            }
          
            // Print the output of the Python script
            console.log(`Python script output find: ${stdout}`);
            out = stdout;
            res.json({ data: {"hash": stdout}});
          });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});