import nodemailer from "nodemailer";
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "Gmail",
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendOTP(email, otp, userName = "User") {
    try {
      const mailOptions = {
        from: `"Suitcase Marketplace" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Email Verification - OTP Code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🧳 Thangabali's Suitcase Marketplace</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
              <h2 style="color: #333; margin-bottom: 20px;">Welcome, ${userName}!</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Thank you for joining Thangabali's Suitcase Marketplace! To complete your registration, please verify your email address using the OTP code below:
              </p>
              
              <div style="background: #fff; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; border: 2px dashed #667eea;">
                <h3 style="color: #333; margin-bottom: 10px;">Your Verification Code:</h3>
                <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; font-family: 'Courier New', monospace;">
                  ${otp}
                </div>
              </div>
              
              <p style="color: #999; font-size: 14px; text-align: center;">
                ⏰ This code will expire in 10 minutes for security reasons.
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                  If you didn't create an account with us, please ignore this email.
                </p>
                <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">
                  Need help? Contact our support team.
                </p>
              </div>
            </div>
          </div>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent successfully to ${email}`);
      return result;
    } catch (error) {
      console.error("Error sending OTP email:", error);
      throw new Error("Failed to send verification email");
    }
  }

  async sendWelcomeEmail(email, userName, role) {
    try {
      const mailOptions = {
        from: `"Thangabali's Suitcase Marketplace" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Welcome to Thangabali's Suitcase Marketplace!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🧳 Welcome to Thangabali's!</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
              <h2 style="color: #333; margin-bottom: 20px;">Congratulations, ${userName}!</h2>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Your account has been successfully verified! You're now a ${role} member of Thangabali's Suitcase Marketplace - your premium destination for quality suitcases.
              </p>
              
              <div style="background: #fff; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;">
                <h3 style="color: #333; margin-bottom: 15px;">What's next?</h3>
                <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
                  ${
                    role === "seller"
                      ? `
                    <li>Start adding your premium suitcases to our marketplace</li>
                    <li>Set competitive prices and manage your inventory</li>
                    <li>Connect with buyers from around the world</li>
                  `
                      : role === "buyer"
                      ? `
                    <li>Browse our extensive collection of premium suitcases</li>
                    <li>Place orders with secure payment options</li>
                    <li>Track your orders and manage your purchases</li>
                  `
                      : `
                    <li>Manage users and maintain marketplace quality</li>
                    <li>Monitor transactions and resolve disputes</li>
                    <li>Ensure smooth marketplace operations</li>
                  `
                  }
                </ul>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #666; font-size: 14px;">
                  Happy shopping and selling! 🎉
                </p>
              </div>
            </div>
          </div>
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent successfully to ${email}`);
      return result;
    } catch (error) {
      console.error("❌ Error sending welcome email:", error);
      // Don't throw error for welcome email - it's not critical
    }
  }
}

export default new EmailService();
