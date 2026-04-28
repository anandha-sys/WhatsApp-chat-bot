const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const express = require('express');

// Set up a dummy web server for Render to prevent crashes
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('WhatsApp Bot is running!'));
app.listen(port, () => console.log(`Web server listening on port ${port}`));

async function connectToWhatsApp() {
    // This saves your session so you don't scan the QR code constantly
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, 
        logger: pino({ level: 'info' }) // 'info' ensures you see the QR code in logs
    });

    // Save credentials whenever they update
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)
                ? lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                : true;
            console.log(`Disconnected. Reconnecting: ${shouldReconnect}`);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ Logged in to WhatsApp!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        
        // Ignore messages from yourself or empty messages
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (text && text.toLowerCase().includes('hi')) {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Hello 👋' });
        }
    });
}

connectToWhatsApp();
