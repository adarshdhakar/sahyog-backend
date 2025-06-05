const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const User = require('../models/User');


// Verify ID token (middleware)
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid token' });
    }
};

// Email/Password Signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password, displayName } = req.body;
        
        // Create user in Firebase
        const userRecord = await admin.auth().createUser({
            email,
            password,
            emailVerified: false,
            displayName
        });

        // Create user in MongoDB
        const user = new User({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL,
            metadata: {
                createdAt: new Date(),
                lastLogin: new Date(),
                updatedAt: new Date()
            }
        });

        await user.save();

        res.status(201).json({ 
            message: 'User created successfully', 
            uid: userRecord.uid,
            user
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Login route
router.post('/login', verifyToken, async (req, res) => {
    try {
        const { uid } = req.user;

        // Update user's last login in MongoDB
        const updatedUser = await User.findOneAndUpdate(
            { uid },
            { 
                'metadata.lastLogin': new Date(),
                'metadata.updatedAt': new Date()
            },
            { new: true }
        );

        if (!updatedUser) {
            // If user doesn't exist in MongoDB but exists in Firebase
            const firebaseUser = await admin.auth().getUser(uid);
            
            // Create user in MongoDB
            const newUser = new User({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                metadata: {
                    createdAt: new Date(),
                    lastLogin: new Date(),
                    updatedAt: new Date()
                }
            });

            await newUser.save();
            return res.json({ user: newUser });
        }

        res.json({ user: updatedUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Protected route example
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const userRecord = await admin.auth().getUser(req.user.uid);
        res.json({ user: userRecord });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get user details
router.get('/user/:uid', verifyToken, async (req, res) => {
    try {
        const userRecord = await admin.auth().getUser(req.params.uid);
        res.json({ user: userRecord });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/create-custom-token', async (req, res) => {
    try {
        const { uid } = req.body;
        const customToken = await admin.auth().createCustomToken(uid);
        res.json({ customToken });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;