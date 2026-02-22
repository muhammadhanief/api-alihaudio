const express = require('express');
const cors = require('cors');
const { EdgeTTS } = require('node-edge-tts');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const app = express();

// WAJIB: Izinkan aplikasi AlihAudio Anda mengakses API ini
app.use(cors({ origin: '*' }));
app.use(express.json());

app.post('/api/edge-tts', async (req, res) => {
    let tmpPath = "";
    try {
        const { text, model = "id-ID-ArdiNeural" } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, message: "Text is required" });
        }

        // Konfigurasi Edge TTS
        const tts = new EdgeTTS({
            voice: model,
            lang: model.substring(0, 5), // misal: "id-ID"
            outputFormat: "audio-24khz-48kbitrate-mono-mp3",
            timeout: 60000 // ✨ VITAL: Naikkan timeout dari 10 detik (bawaan) menjadi 60 detik
        });

        // Simpan file sementara
        tmpPath = path.join(os.tmpdir(), `tts_${crypto.randomBytes(6).toString('hex')}.mp3`);
        await tts.ttsPromise(text, tmpPath);

        // Baca audio sebagai buffer
        const audioBuffer = fs.readFileSync(tmpPath);

        // Bersihkan file sementara
        try { fs.unlinkSync(tmpPath); } catch (e) { }

        // Kirim audio kembali ke pemanggil
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioBuffer.length);
        res.status(200).send(audioBuffer);

    } catch (error) {
        if (tmpPath) {
            try { fs.unlinkSync(tmpPath); } catch (e) { }
        }
        console.error("Error in Edge TTS route:", error);
        res.status(500).json({
            success: false,
            message: error.message || error || "Internal Server Error"
        });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 API Server (Microservice) menyala dan standby di http://localhost:${PORT}`);
});
