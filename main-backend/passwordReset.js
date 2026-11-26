const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');
const { sendMail } = require('./mailService');

module.exports = function registerPasswordReset(app, User) {

  if (!process.env.OTP_SECRET) {
    throw new Error('OTP_SECRET is missing from .env');
  }

  const sendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: {
      message: 'Too many OTP requests. Try again later.'
    }
  });

  const resetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: {
      message: 'Too many attempts. Try again later.'
    }
  });

  function hashOTP(userId, otp) {
    return crypto
      .createHmac('sha256', process.env.OTP_SECRET)
      .update(`${userId}:${otp}`)
      .digest('hex');
  }

  function getEmail(req) {
    return typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
  }

  async function findAccount(email) {
    const users = await User.find({ email })
      .collation({ locale: 'en', strength: 2 })
      .limit(2);

    return users.length === 1 && users[0].active
      ? users[0]
      : null;
  }

  // SEND OTP
  app.post(
    '/api/auth/forgot-password',
    sendLimiter,
    async (req, res) => {
      try {
        const email = getEmail(req);

        if (!email || !email.includes('@')) {
          return res.status(400).json({
            message: 'Enter a valid email address.'
          });
        }

        const response = {
          message: 'If the account exists, an OTP will be sent to its registered email.'
        };

        const user = await findAccount(email);

        if (!user) {
          return res.json(response);
        }

        const otp = crypto
          .randomInt(100000, 1000000)
          .toString();

        const now = new Date();
        const otpHash = hashOTP(user.id, otp);

        const updated = await User.findOneAndUpdate(
          {
            _id: user._id,
            active: true,
            email: user.email,
            $or: [
              { resetOtpSentAt: { $exists: false } },
              { resetOtpSentAt: null },
              {
                resetOtpSentAt: {
                  $lte: new Date(Date.now() - 60000)
                }
              }
            ]
          },
          {
            $set: {
              resetOtpHash: otpHash,
              resetOtpExpires: new Date(
                Date.now() + 5 * 60 * 1000
              ),
              resetOtpAttempts: 0,
              resetOtpSentAt: now
            }
          }
        );

        if (!updated) {
          return res.json(response);
        }

        // Send only to the registered email.
        void sendMail({
          to: user.email,
          subject: 'CPEMS - Password Reset OTP',
          sensitive: true,
          text: `Your password reset OTP is ${otp}.
This code expires in 5 minutes.
Do not share this code with anyone.`,
          html: `
            <div style="font-family:Arial;padding:24px">
              <h2>CPEMS Password Recovery</h2>
              <p>Your verification code is:</p>
              <h1 style="color:#4f46e5;letter-spacing:8px">
                ${otp}
              </h1>
              <p>This OTP expires in 5 minutes.</p>
              <p>Do not share this code with anyone.</p>
              <p>Ignore this email if you did not request it.</p>
            </div>
          `
        }).catch(() => {
          console.error('Password reset email failed.');
        });

        return res.json(response);

      } catch (err) {
        console.error('OTP generation failed.');

        return res.status(500).json({
          message: 'Unable to process the request.'
        });
      }
    }
  );

  // VERIFY OTP AND RESET PASSWORD
  app.post(
    '/api/auth/reset-password',
    resetLimiter,
    async (req, res) => {
      try {
        const email = getEmail(req);
        const { otp, newPassword, confirmPassword } = req.body;

        if (
          typeof otp !== 'string' ||
          !/^\d{6}$/.test(otp)
        ) {
          return res.status(400).json({
            message: 'Enter a valid 6-digit OTP.'
          });
        }

        if (
          typeof newPassword !== 'string' ||
          newPassword.length < 8 ||
          Buffer.byteLength(newPassword, 'utf8') > 72
        ) {
          return res.status(400).json({
            message: 'Enter a password of at least 8 characters and no more than 72 bytes.'
          });
        }

        if (newPassword !== confirmPassword) {
          return res.status(400).json({
            message: 'Passwords do not match.'
          });
        }

        const invalid = {
          message: 'Invalid or expired OTP. Request a new code.'
        };

        const user = await findAccount(email);

        if (!user) {
          return res.status(400).json(invalid);
        }

        // Atomically reserve one verification attempt.
        const attempt = await User.findOneAndUpdate(
          {
            _id: user._id,
            active: true,
            email: user.email,
            resetOtpHash: { $type: 'string' },
            resetOtpExpires: { $gt: new Date() },
            resetOtpAttempts: { $lt: 5 }
          },
          {
            $inc: { resetOtpAttempts: 1 }
          },
          { returnDocument: 'after' }
        ).select('+resetOtpHash');

        if (
          !attempt ||
          attempt.resetOtpHash !== hashOTP(user.id, otp)
        ) {
          return res.status(400).json(invalid);
        }

        const hashedPassword = await bcrypt.hash(
          newPassword,
          12
        );

        // Consume OTP and change password atomically.
        const result = await User.updateOne(
          {
            _id: user._id,
            active: true,
            email: user.email,
            resetOtpHash: attempt.resetOtpHash,
            resetOtpExpires: { $gt: new Date() }
          },
          {
            $set: { password: hashedPassword },
            $unset: {
              resetOtpHash: '',
              resetOtpExpires: '',
              resetOtpAttempts: ''
            }
          }
        );

        if (!result.modifiedCount) {
          return res.status(400).json(invalid);
        }

        return res.json({
          message: 'Password reset successfully.'
        });

      } catch (err) {
        console.error('Password reset failed.');

        return res.status(500).json({
          message: 'Unable to reset password.'
        });
      }
    }
  );
};