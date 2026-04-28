const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const QRCode = require('qrcode'); // QR ഇമേജ് ഉണ്ടാക്കാൻ

// --- CONFIGURATION ---
const token = '8701301869:AAGiFFPQOk-gxZfIm5Irnfv57bqkMlLKcyA'; // ടെലിഗ്രാം ബോട്ട് ടോക്കൺ ഇവിടെ നൽകുക
const chatId = '8142078717';          // നിങ്ങളുടെ ടെലിഗ്രാം ID ഇവിടെ നൽകുക
// ---------------------

const bot = new TelegramBot(token, { polling: false });
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('WhatsApp Bot is running!'));
app.listen(port, () => console.log(`Web server listening on port ${port}`));

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, 
        logger: pino({ level: 'info' }) 
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // QR കോഡ് ജനറേറ്റ് ചെയ്യുമ്പോൾ അത് PNG ആയി ടെലിഗ്രാമിലേക്ക് അയക്കും
        if (qr) {
            console.log('Sending QR to Telegram...');
            try {
                const qrBuffer = await QRCode.toBuffer(qr);
                await bot.sendPhoto(chatId, qrBuffer, { caption: 'നിങ്ങളുടെ WhatsApp QR കോഡ് ഇതാ! സ്കാൻ ചെയ്യുക.' });
            } catch (err) {
                console.error('Telegram-ലേക്ക് അയക്കാൻ പറ്റിയില്ല:', err);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)
                ? lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                : true;
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ Logged in to WhatsApp!');
            bot.sendMessage(chatId, 'WhatsApp വിജയകരമായി കണക്ട് ആയി! ✅');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (text && text.toLowerCase().includes('hi')) {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Hello 👋' });
        }
    });
}

connectToWhatsApp();
