const dotenv = require('dotenv');
const mongoose = require('mongoose');
const express = require("express");
const multer = require('multer');
const cloudinary = require('cloudinary').v2
const cors = require('cors')
const app = express();
app.use(express.json());

const sendEmail = require('./config/mailer');
const authRoutes = require('./routes/auth');
dotenv.config();

mongoose.connect(process.env.ATLASDB_URL, {})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.use(cors({
    origin : ["http://localhost:5173", "https://sahyog-client.netlify.app"],
    methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS",
    credentials: true
}))
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
const storage = multer.memoryStorage(); 
const upload = multer({ storage });

app.use('/auth', authRoutes);

//---------------------------------Cloud-----------------------------------------
app.post("/upload", upload.single("image"), async (req, res) => {
    console.log("Received request for file upload");

    try {
        if (!req.file) {
            console.log("No file uploaded");
            return res.status(400).json({ error: "No image uploaded" });
        }

        console.log("Uploading to Cloudinary...");
        const result = await cloudinary.uploader.upload_stream(
            { folder: "uploads" },
            (error, result) => {
                if (error) {
                    console.log("Cloudinary upload failed:", error);
                    return res.status(500).json({ error: "Cloudinary upload failed" });
                }
                console.log("Upload successful:", result);
                res.json({ imageUrl: result.secure_url });
            }
        ).end(req.file.buffer);

    } catch (error) {
        console.log("Server error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/mailer", async(req,res)=>{
    try
    {
        console.log(req.body);
        const {email,message} = req.body; 
        console.log("calling send email");
        await sendEmail(email,message);
        console.log("email sent successfully"); 
        res.status(200).json(
            {
                "status":"Done"
            })
    }
    catch(e)
    {
        console.error(e);
        res.status(400).json({
            error:e.message
        });
    }
})

app.get('/', (req, res) => 
{  
    return res.status(200).json({
        "status": "success"
    });
});

app.listen(5000, () => 
{
    console.log("listening on port 5000");
});
