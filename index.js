const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const client = new Client();

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot is ready!');
});

client.on('message', async (message) => {
    if (message.body.toLowerCase() === 'hi') {
        message.reply('Hello 👋 I am your AI bot!');
    }

    // AI reply (optional)
    if (message.body.startsWith('ai ')) {
        const userText = message.body.replace('ai ', '');

        try {
            const res = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: userText }]
                },
                {
                    headers: {
                        "Authorization": "Bearer YOUR_API_KEY"
                    }
                }
            );

            message.reply(res.data.choices[0].message.content);

        } catch (err) {
            message.reply("Error with AI");
        }
    }
});

client.initialize();
