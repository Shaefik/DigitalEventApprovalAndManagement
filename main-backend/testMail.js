const { sendMail, buildEmail } = require('./mailService');

console.log('Starting email test...');
const { html, text } = buildEmail({
  heading: 'Test email',
  intro: 'If you can read this, email notifications are working.',
  rows: [['Status', 'Working']],
});

sendMail({ to: 'esakirahul8@gmail.com', subject: 'Portal test email', html, text })
  .then((r) => console.log('Result:', r))
  .catch((e) => console.error('Error:', e));