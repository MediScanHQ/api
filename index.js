const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require("path");
const fs = require('fs');
const cors = require('cors');
const {
    exec
} = require('child_process');
const lighthouse = require("@lighthouse-web3/sdk");
require('dotenv').config()
const ethers = require("ethers");
const { hashMessage } = require("@ethersproject/hash");
const mediscanAbi = require("./abis/mediscan.json")

const app = express();
const port = 8080;
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

app.post("/api/new", upload.single('image'), async (req, res) => {
    const command = 'python3 scripts/new.py';
    try {
        const image = req.file;
        const jsonData = req.body.jsonData;
        const imgName = "image.jpeg";
        fs.writeFileSync(imgName, image.buffer);

        exec(command, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing the script: ${error}`);
                return;
            }
            // Print the output of the Python script
            console.log(`Python script output: ${stdout}`);
            let id = stdout.replace(/\n/g, '');

            let uploadResult = await uploadFile(id, jsonData);

            fs.readFile('face_hash_health_data.json', (err,data) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Internal Server Error');
                }
                let existingData = JSON.parse(data);
                existingData[id] = uploadResult.data.Hash;
                fs.writeFile('face_hash_health_data.json', JSON.stringify(existingData, null, 2), 'utf8', (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Internal Server Error');
                    }
                })
            })

            fs.readFile('data.json', 'utf8', (err, data) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Internal Server Error');
                }
                let existingData = JSON.parse(data);
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

            fs.readFile("face_hash_health_data.json", 'utf8', async (err,data) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Internal Server Error');
                }
                let existingData = JSON.parse(data);
                let cid = existingData[id];
                let health_record = await downloadFile(cid);
                console.log("download result: ", health_record);
                res.json({
                    health_record
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

async function uploadFile(faceHash, healthData) {
    const apiKey = process.env.LIGHTHOUSE_KEY;
    const response = await lighthouse.uploadText(healthData, apiKey, faceHash);
    console.log("Upload response: ", response)
    return response
}

async function downloadFile(cid) {
    try {
        const response = await fetch(`https://gateway.lighthouse.storage/ipfs/${cid}`);

        // Check if the request was successful (status code in the range of 200-299)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Parse the JSON response
        const data = await response.json();

        // Print the JSON data
        console.log(data);
        return data;
    } catch (error) {
        // Handle errors
        console.error('Error fetching data:', error.message);
    }
}

async function verifyUserAdmin() {
    const message = "mediscan"

    const provider = new ethers.providers.AlchemyProvider('maticmum', process.env.ALCHEMY_KEY)
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const signedMessage = await wallet.signMessage(message);
    const signerAddress = ethers.utils.recoverAddress(hashMessage(message), signedMessage)
    console.log("Signer address: ", signerAddress)
    
    const mediscan = new ethers.Contract(process.env.MEDISCAN_ADDRESS, mediscanAbi);

    const res = await mediscan.getAccessLevelForAddress(signerAddress);

    if (res == 0) {
        console.log("Full access");
    } else if (res == 1) {
        console.log("Medium access")
    } else if (res == 2) {
        console.log("Low access")
    } else {
        console.log("No access")
    }
}