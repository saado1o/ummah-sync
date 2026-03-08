const express = require('express');
const https = require('https');
const http = require('http');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();

// Try to load mkcert certificates for HTTPS (required for mobile getUserMedia)
// mkcert certs are stored in the user's home directory
const certDir = path.join(os.homedir(), '.vite-plugin-mkcert');
let server;
try {
    const keyPath = path.join(certDir, 'dev.pem');
    const certPath = path.join(certDir, 'cert.pem');
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        server = https.createServer({ key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }, app);
        console.log('Backend running in HTTPS mode (mobile-compatible)');
    } else {
        throw new Error('Certs not found');
    }
} catch (e) {
    console.warn('HTTPS certs not found, falling back to HTTP (mobile getUserMedia may not work):', e.message);
    server = http.createServer(app);
}

// Allow all origins (LAN devices like mobile phones on the same WiFi)
app.use(cors({ origin: '*' }));
app.use(express.json());

// Set up static serving for audio uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Audio Upload Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

app.post('/api/upload-audio', upload.single('audio'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No audio file uploaded' });
    }
    // Dynamically resolve URL based on request host
    const host = req.headers.host || 'localhost:3001';
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const url = `${protocol}://${host}/uploads/${req.file.filename}`;
    res.json({ url });
});

app.post('/api/upload-file', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const host = req.headers.host || 'localhost:3001';
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const url = `${protocol}://${host}/uploads/${req.file.filename}`;
    res.json({ url, name: req.file.originalname, type: req.file.mimetype });
});

// AI Configuration
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `
You are an AI assistant for BERP-Connect (also known as SBF-Talk), a communication platform by SBF-Consultancy.
Your goal is to help users communicate more professionally, respectfully, and in a Shariah-compliant manner.
If asked to suggest a formal response, make it polite, corporate, and incorporate a brief Islamic greeting (like As-salamu alaykum) if appropriate.
If asked to translate to Urdu, provide an accurate, polite Urdu translation.
If asked to add an Islamic greeting, naturally weave an appropriate greeting into the provided text.
`;

app.post('/api/ai-suggest', async (req, res) => {
    const { action, text, context } = req.body;
    try {
        let prompt = '';
        if (action === 'formal') {
            prompt = `Context of conversation: ${context}\n\nUser's message draft: "${text}"\n\nRewrite the message draft to be more formal, professional, and suitable for business communication within SBF-Consultancy.`;
        } else if (action === 'urdu') {
            prompt = `Context of conversation: ${context}\n\nUser's message draft: "${text}"\n\nTranslate the user's message draft into professional Urdu, using a respectful tone.`;
        } else if (action === 'islamic_greeting') {
            prompt = `Context of conversation: ${context}\n\nUser's message draft: "${text}"\n\nAdd an appropriate Islamic greeting and valediction to this message naturally without changing its core meaning.`;
        } else {
            return res.status(400).json({ error: 'Invalid action type' });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
            }
        });

        res.json({ result: response.text });
    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ error: 'Failed to generate AI response' });
    }
});

// WebRTC Signaling Server configuration
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const users = {}; // Maps socket.id to user info

io.on('connection', (socket) => {
    console.log('Socket Connected:', socket.id);

    socket.on('join', (userEmail) => {
        users[socket.id] = userEmail;
        socket.broadcast.emit('user-joined', { socketId: socket.id, email: userEmail });
        // Tell the new user about existing users (very basic MVP signaling logic)
        socket.emit('current-users', users);
    });

    socket.on('call-user', (data) => {
        socket.broadcast.emit('call-made', data);
    });

    socket.on('answer-call', (data) => {
        socket.broadcast.emit('call-answered', data);
    });

    socket.on('ice-candidate', (data) => {
        socket.broadcast.emit('ice-candidate', data);
    });

    socket.on('end-call', (data) => {
        socket.broadcast.emit('call-ended', data);
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        socket.broadcast.emit('user-left', socket.id);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`BERP-Connect AI Backend & Signaling Server running on port ${PORT}`);
});
