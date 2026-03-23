import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { createNotification } from '../utils/notificationHelper.js';
import sendEmail from '../utils/sendEmail.js';

const OTP_TTL_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES) || 10;

const setCookieAndRespond = (res, statusCode, user, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  res.cookie('token', token, cookieOptions);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      ownerRequestStatus: user.ownerRequestStatus,
      savedPGs: user.savedPGs,
      isBlocked: user.isBlocked,
      avatar: user.avatar,
    },
  });
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const buildOtpEmailHtml = (name, otp, purpose) => {
  const heading = purpose === 'signup' ? 'Verify your account' : 'Verify your login';
  const body =
    purpose === 'signup'
      ? 'Use this OTP to complete your signup.'
      : 'Use this OTP to complete your login.';

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
      <h2 style="color: #4F46E5;">${heading}</h2>
      <p>Hi ${name || 'there'},</p>
      <p>${body}</p>
      <div style="font-size:30px;font-weight:700;letter-spacing:8px;margin:20px 0;color:#111827;">
        ${otp}
      </div>
      <p>This OTP is valid for <strong>${OTP_TTL_MINUTES} minutes</strong>.</p>
      <p style="color:#666;font-size:13px;">If this wasn't you, you can ignore this email.</p>
    </div>
  `;
};

const setOtpAndSendEmail = async (user, purpose) => {
  const otp = generateOtp();
  user.otpCode = hashOtp(otp);
  user.otpPurpose = purpose;
  user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const html = buildOtpEmailHtml(user.name, otp, purpose);
  const subject = purpose === 'signup' ? 'Sikkim PG Finder - Signup OTP' : 'Sikkim PG Finder - Login OTP';

  let emailSent = true;
  try {
    await sendEmail({ to: user.email, subject, html });
  } catch (err) {
    emailSent = false;
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    // In development, allow OTP flow to continue even if SMTP is misconfigured.
    console.warn('OTP email send failed in development mode:', err.message);
  }

  return { emailSent };
};

const sendOtpPendingResponse = (res, user, purpose, emailSent = true) => {
  const response = {
    success: true,
    requiresOtp: true,
    purpose,
    email: user.email,
    message: emailSent
      ? `OTP sent to ${user.email}.`
      : 'OTP generated, but email could not be sent. Please check SMTP configuration and try resend.',
  };

  res.status(200).json(response);
};

const isAccountVerified = (user) => user?.isVerified !== false;

// @desc   Register user
// @route  POST /api/auth/signup
export const signup = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  const { name, email, password } = req.body;

  let user = await User.findOne({ email: email.toLowerCase() }).select('+otpCode +otpPurpose +otpExpiresAt');

  if (user && isAccountVerified(user)) {
    res.status(400);
    throw new Error('Email already registered');
  }

  if (!user) {
    user = await User.create({ name, email, password, isVerified: false });
  } else {
    user.name = name;
    user.password = password;
    user.isVerified = false;
    await user.save();
    user = await User.findById(user._id).select('+otpCode +otpPurpose +otpExpiresAt');
  }

  const { emailSent } = await setOtpAndSendEmail(user, 'signup');
  sendOtpPendingResponse(res, user, 'signup', emailSent);
});

// @desc   Login user
// @route  POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +otpCode +otpPurpose +otpExpiresAt');
  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.isBlocked) {
    res.status(403);
    throw new Error('Your account has been blocked by admin. Please contact support.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const { emailSent } = await setOtpAndSendEmail(user, 'login');
  sendOtpPendingResponse(res, user, 'login', emailSent);
});

// @desc   Verify OTP and complete auth
// @route  POST /api/auth/verify-otp
export const verifyOtp = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  const { email, otp, purpose } = req.body;

  if (!email || !otp || !purpose) {
    res.status(400);
    throw new Error('Email, OTP and purpose are required');
  }

  if (!['signup', 'login'].includes(purpose)) {
    res.status(400);
    throw new Error('Invalid OTP purpose');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+otpCode +otpPurpose +otpExpiresAt');
  if (!user || !user.otpCode || !user.otpExpiresAt || !user.otpPurpose) {
    res.status(400);
    throw new Error('No active OTP. Please request a new one.');
  }

  if (user.otpPurpose !== purpose) {
    res.status(400);
    throw new Error('OTP purpose mismatch. Please request a new OTP.');
  }

  if (user.otpExpiresAt.getTime() < Date.now()) {
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    user.otpPurpose = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(400);
    throw new Error('OTP has expired. Please request a new OTP.');
  }

  const hashed = hashOtp(String(otp).trim());
  if (hashed !== user.otpCode) {
    res.status(400);
    throw new Error('Invalid OTP');
  }

  if (purpose === 'signup' && user.isVerified === false) {
    user.isVerified = true;
    await createNotification(
      `New user registered: ${user.name} (${user.email})`,
      'USER_SIGNUP',
      user._id,
      user._id
    );
  }

  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  user.otpPurpose = undefined;
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id, user.role);
  setCookieAndRespond(res, 200, user, token);
});

// @desc   Resend OTP
// @route  POST /api/auth/resend-otp
export const resendOtp = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }

  const { email, purpose } = req.body;

  if (!email || !purpose) {
    res.status(400);
    throw new Error('Email and purpose are required');
  }

  if (!['signup', 'login'].includes(purpose)) {
    res.status(400);
    throw new Error('Invalid OTP purpose');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+otpCode +otpPurpose +otpExpiresAt');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.isBlocked) {
    res.status(403);
    throw new Error('Your account has been blocked by admin. Please contact support.');
  }

  if (purpose === 'signup' && isAccountVerified(user)) {
    res.status(400);
    throw new Error('Account is already verified. Please login.');
  }

  const { emailSent } = await setOtpAndSendEmail(user, purpose);
  sendOtpPendingResponse(res, user, purpose, emailSent);
});

// @desc   Get current user
// @route  GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('savedPGs', 'title price location status images');
  res.json({ success: true, user });
});

// @desc   Logout
// @route  POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: 'Logged out successfully' });
});

// @desc   Forgot password
// @route  POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });

  // Always return success (security: don't reveal if email exists)
  if (!user) {
    return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
      <h2 style="color: #4F46E5;">Reset Your Password</h2>
      <p>You requested a password reset for your Sikkim PG Finder account.</p>
      <p>Click the button below to reset your password. This link expires in <strong>10 minutes</strong>.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#4F46E5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
        Reset Password
      </a>
      <p style="color:#666;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  try {
    await sendEmail({ to: user.email, subject: 'Sikkim PG Finder — Password Reset', html });
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error('Email could not be sent. Please try again later.');
  }
});

// @desc   Reset password
// @route  PUT /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = generateToken(user._id, user.role);
  setCookieAndRespond(res, 200, user, token);
});
