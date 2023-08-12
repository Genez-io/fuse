export class SendMessageService {
    client: any;
    constructor() {
        require('dotenv').config();
        const accountSid: string | undefined = process.env.TWILIO_ACCOUNT_SID;
        const authToken: string | undefined = process.env.TWILIO_AUTH_TOKEN;
        console.log(accountSid, authToken);

        this.client = require('twilio')(accountSid, authToken);
    }

	async sendTestMessage(message: string | undefined, to: string | undefined): Promise<string> {
        const msg = await this.client.messages.create({
            body: message,
            from: "whatsapp:+14155238886",
            to: "whatsapp:" + to
        });

        console.log(msg.sid);
        return "Message sent!";
    }
}
