const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require("path");
const fs = require('fs');
const cors = require('cors');
const {
    exec
} = require('child_process');

const app = express();
const port = 3000;
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage
});

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
            fs.readFile('data.json', 'utf8', (err, data) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Internal Server Error');
                }
                let existingData = JSON.parse(data);
                let id = stdout.replace(/\n/g, '');
                existingData[id] = jsonData;
                fs.writeFile('data.json', JSON.stringify(existingData, null, 2), 'utf8', (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Internal Server Error');
                    }
                })
                res.json({
                    message: 'Data received successfully'
                });
                fs.unlink(imgName, (err) => {
                    if (err) {
                        console.log("error deleting file: ", err)
                    }
                })
            });
        })
    } catch (error) {
        res.status(500).json({
            error: 'Internal server error'
        });
    }
})

app.get('/api/ping', (req,res) => {
    res.json("pong")
})

app.post('/api/find', upload.single('image'), (req, res) => {
    const command = 'python3 scripts/find.py';
    try {
        const image = req.file;
        const imgName = "image_new.jpeg";
        fs.writeFileSync(imgName, image.buffer);

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing the script: ${error}`);
                return;
            }
            // Print the output of the Python script
            console.log(`Python script output find: ${stdout}`);
            let id = stdout.replace(/\n/g, '');

            fs.readFile('data.json', 'utf8', (err, data) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Internal Server Error');
                }
                let existingData = JSON.parse(data);
                let jsonData = existingData[id];
                res.json({
                    jsonData
                });


                fs.unlink(imgName, (err) => {
                    if (err) {
                        console.log("error deleting file: ", err)
                    }
                })
            })
        });
    } catch (error) {
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});