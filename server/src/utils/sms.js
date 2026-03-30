const { SmsClient } = require('@azure/communication-sms');

async function sendSMS(toPhone, message) {
  if (!process.env.ACS_CONNECTION_STRING || !process.env.ACS_PHONE_NUMBER) {
    console.log(`📱 SMS (dev mode) to ${toPhone}: ${message}`);
    return { success: true, dev: true };
  }
  const client = new SmsClient(process.env.ACS_CONNECTION_STRING);
  const results = await client.send({
    from: process.env.ACS_PHONE_NUMBER,
    to: [toPhone],
    message,
  });
  return results[0];
}

module.exports = { sendSMS };
