require('dotenv').config();

const { sendMail } = require('./mailService');

async function testEmail() {
  const result = await sendMail({
    to: 'experiment.idies@gmail.com',
    subject: 'CPEMS - Email Service Test',
    text: 'Congratulations! Your email service is working.',
    html: `
      <h2>CPEMS Email Test</h2>
      <p>Your email service is working successfully.</p>
      <p>College Permission and Event Management System</p>
    `
  });

  console.log(result);
}

testEmail();