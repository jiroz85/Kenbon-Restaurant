import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // For development, use ethereal.email or Gmail with app password
    if (process.env.NODE_ENV === 'production') {
      // Production email service (SendGrid, AWS SES, etc.)
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development: Use Gmail or ethereal
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || process.env.GMAIL_USER,
          pass: process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD,
        },
      });
    }
  }

  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

    // Check if email configuration is properly set up
    if (!this.isEmailConfigured()) {
      console.warn('Email service not configured. Using console fallback.');
      console.log(`Verification URL: ${verificationUrl}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        to: email,
        subject: 'Verify your Kenbon Restaurant account',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #667eea; margin-bottom: 10px;">Kenbon Restaurant</h1>
              <p style="color: #666; font-size: 16px;">Welcome to our restaurant!</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
              <h2 style="color: #333; margin-bottom: 15px;">Email Verification Required</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Thank you for registering with Kenbon Restaurant! To complete your registration and start ordering, please verify your email address by clicking the button below:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold;
                          display: inline-block;
                          font-size: 16px;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px; text-align: center; margin-top: 20px;">
                Or copy and paste this link into your browser:<br>
                <span style="word-break: break-all; color: #667eea;">${verificationUrl}</span>
              </p>
            </div>
            
            <div style="border-top: 1px solid #e9ecef; padding-top: 20px; text-align: center;">
              <p style="color: #999; font-size: 14px; margin: 0;">
                This link will expire in 24 hours.<br>
                If you didn't create an account, please ignore this email.
              </p>
            </div>
          </div>
        `,
      });

      console.log(`Verification email sent successfully to ${email}`);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Fallback to console log for development
      console.log(`Verification URL: ${verificationUrl}`);
      // Don't throw error in development to allow testing
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to send verification email');
      }
    }
  }

  private isEmailConfigured(): boolean {
    if (process.env.NODE_ENV === 'production') {
      return !!(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      );
    } else {
      return (
        !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) ||
        !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
      );
    }
  }

  async createVerificationToken(user: User): Promise<string> {
    const token = this.generateVerificationToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // Token expires in 24 hours

    await this.usersRepository.update(user.id, {
      emailVerificationToken: token,
      emailVerificationExpires: expires,
    });

    return token;
  }

  async clearVerificationToken(user: User): Promise<void> {
    await this.usersRepository.update(user.id, {
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
      isEmailVerified: true,
    });
  }
}
