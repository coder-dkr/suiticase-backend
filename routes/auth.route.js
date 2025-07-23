import express from 'express';
import { validate, userSignupSchema, userLoginSchema, otpVerificationSchema } from '../middleware/validation.middleware.js';
import User from '../models/User.model.js';
import emailService from '../utils/email.js';

const router = express.Router();

// @route   POST /api/v1auth/signup
router.post('/signup', validate(userSignupSchema), async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'User already exists and is verified'
        });
      }
      
      // User exists but not verified, generate new OTP
      const otp = existingUser.generateOTP();
      await existingUser.save();
      
      await emailService.sendOTP(email, otp, email.split('@')[0]);
      
      return res.status(200).json({
        success: true,
        message: 'New OTP sent to your email address'
      });
    }

    // Create new user
    const user = new User({ email, password, role });
    const otp = user.generateOTP();
    
    await user.save();
    await emailService.sendOTP(email, otp, email.split('@')[0]);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for OTP verification',
      data: {
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user'
    });
  }
});


// @route   POST /api/v1/auth/verify
router.post('/verify', validate(otpVerificationSchema), async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user with OTP fields
    const user = await User.findOne({ email }).select('+otp +otpExpires');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User is already verified'
      });
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Update user verification status
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.email.split('@')[0], user.role);

    // Generate JWT token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});


// @route   POST /api/v1/auth/login
router.post('/login', validate(userLoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }

    // Validate password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login'
    });
  }
});

// @route   POST /api/v1/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User is already verified'
      });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();
    
    await emailService.sendOTP(email, otp, email.split('@')[0]);

    res.status(200).json({
      success: true,
      message: 'New OTP sent to your email address'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
});

export default router;