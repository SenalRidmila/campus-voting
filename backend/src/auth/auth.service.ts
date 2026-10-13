import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as nodemailer from 'nodemailer';
import * as jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import * as crypto from 'crypto';

import * as VotingABI from '../vote/Voting.json';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;
  private readonly emailUser: string;
  private readonly emailPass: string;
  private tempOtps = new Map<string, { otp: string, userData: any }>();

  private readonly algorithm = 'aes-256-cbc';
  private readonly secretKey = process.env.ENCRYPTION_KEY || 'MySuperSecretKeyForVotingApp123!';

  private provider: ethers.JsonRpcProvider;
  private adminWallet: ethers.Wallet;
  private votingContract: ethers.Contract;

  constructor(private prisma: PrismaService) {
    this.emailUser = process.env.EMAIL_USER?.trim() || '';
    this.emailPass = process.env.EMAIL_PASS?.replace(/\s+/g, '').trim() || '';

    if (!this.emailUser || !this.emailPass) {
      throw new Error('Email configuration missing in AuthService');
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.emailUser,
        pass: this.emailPass,
      },
    });

    const rpcUrl = process.env.RPC_URL;
    const adminKey = process.env.ADMIN_PRIVATE_KEY;
    const votingAddr = process.env.VOTING_ADDRESS;

    if (!rpcUrl || !adminKey || !votingAddr) {
      console.error("❌ AuthService: Missing environment variables!");
      throw new Error("Blockchain configuration missing in AuthService");
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.adminWallet = new ethers.Wallet(adminKey, this.provider);

    this.votingContract = new ethers.Contract(
      votingAddr,
      VotingABI.abi, 
      this.adminWallet
    );
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.secretKey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  async requestSignupOTP(data: { fullName: string; studentId: string; faculty: string; email: string; faceImage?: string }) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { studentId: data.studentId }],
      },
    });

    if (existingUser) {
      throw new BadRequestException('User with this Email or Student ID already exists.');
    }

    let faceDescriptor: string | null = null;
    if (data.faceImage) {
      try {
        const aiResponse = await fetch('http://127.0.0.1:8000/extract-face', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: data.faceImage }),
        });
        if (!aiResponse.ok) {
          throw new BadRequestException('Failed to extract face details. Ensure face is clear.');
        }
        const aiData = await aiResponse.json();
        faceDescriptor = JSON.stringify(aiData.embedding);
      } catch (err) {
        console.error('AI Service Error:', err);
        throw new BadRequestException('Face verification AI failed. Is the Python service running?');
      }
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    const otp = this.generateOTP();
    this.tempOtps.set(normalizedEmail, { otp, userData: { ...data, email: normalizedEmail, faceDescriptor } });

    setTimeout(() => {
      this.tempOtps.delete(normalizedEmail);
    }, 10 * 60 * 1000); // Increased to 10 minutes

    const mailOptions = {
      from: `"Campus Voting App" <${this.emailUser}>`,
      to: data.email,
      subject: 'Your Voting Registration OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Horizon Campus Voting System</h2>
          <p>Hello ${data.fullName},</p>
          <p>Your One-Time Password (OTP) for registration is:</p>
          <h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 3 minutes.</p>
        </div>
      `,
    };

    console.log(`\n=================================================`);
    console.log(`🔑 SIGNUP OTP FOR ${data.email}: ${otp}`);
    console.log(`=================================================\n`);

    try {
      // Send email in the background to avoid blocking the API response
      this.transporter.sendMail(mailOptions).catch(err => {
        console.error(" Background Email Sending Failed (Signup):", err);
      });
      return { message: 'OTP generated and sent to email. Check inbox/spam.' };
    } catch (error) {
      console.error(" Email Process Failed (Signup):", error); 
      throw new BadRequestException('Failed to process OTP email.');
    }
  }

  async verifyAndSignup(email: string, userOtp: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const record = this.tempOtps.get(normalizedEmail);
    if (!record) throw new BadRequestException('OTP expired or not found.');
    if (record.otp !== userOtp) throw new BadRequestException('Invalid OTP.');

    const wallet = ethers.Wallet.createRandom();
    const encryptedKey = this.encrypt(wallet.privateKey);

    console.log("\n=======================================================");
    console.log(" [BLOCKCHAIN] INITIATING STUDENT WHITELIST (SIGNUP) ");
    console.log("=======================================================");
    console.log(` Student Name     : ${record.userData.fullName}`);
    console.log(` Generated Wallet : ${wallet.address}`);
    
    try {
      const studentIdHash = ethers.id(record.userData.studentId);
      const [walletAvailable, studentIdAvailable] = await this.votingContract.canWhitelistVoter(wallet.address, studentIdHash);

      if (!walletAvailable) {
        throw new BadRequestException('This wallet is already whitelisted on the Blockchain.');
      }

      if (!studentIdAvailable) {
        throw new BadRequestException('This Student ID is already registered on the Blockchain.');
      }

      console.log(` Waiting for Smart Contract confirmation...`);
      const tx = await this.votingContract.whitelistVoter(wallet.address, studentIdHash);
      const receipt = await tx.wait(); 
      console.log(` SUCCESS! Transaction Hash: ${receipt.hash}`);
      console.log(` Gas Used: ${receipt.gasUsed.toString()}`);
      console.log("=======================================================\n");
    } catch (error) {
      console.error(" Blockchain Whitelisting Failed:", error);
      console.log("=======================================================\n");
      throw new BadRequestException('Failed to register voter on the Blockchain.');
    }

    const newUser = await this.prisma.user.create({
      data: {
        fullName: record.userData.fullName,
        studentId: record.userData.studentId,
        faculty: record.userData.faculty,
        email: record.userData.email,
        walletAddress: wallet.address,       
        encryptedPrivateKey: encryptedKey,
        isVerified: true,
        faceDescriptor: record.userData.faceDescriptor,
      },
    });

    this.tempOtps.delete(email);

    return {
      message: 'Signup successful! Whitelisted and ready to vote.',
      user: {
        fullName: newUser.fullName,
        faculty: newUser.faculty, 
        email: newUser.email,
        walletAddress: newUser.walletAddress, 
      },
    };
  }

  async requestLoginOTP(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Account not found!');

    const otp = this.generateOTP();
    this.tempOtps.set(email + '_login', { otp, userData: user });

    setTimeout(() => {
      this.tempOtps.delete(email + '_login');
    }, 3 * 60 * 1000);

    const mailOptions = {
      from: `"Campus Voting App" <${this.emailUser}>`,
      to: email,
      subject: 'Your Login OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Horizon Campus Voting System</h2>
          <p>Hello ${user.fullName},</p>
          <p>Your OTP to securely log in is: <h1 style="color: #10B981;">${otp}</h1></p>
        </div>
      `,
    };

    console.log(`\n=================================================`);
    console.log(`🔑 LOGIN OTP FOR ${email}: ${otp}`);
    console.log(`=================================================\n`);

    try {
      // Send email in the background to avoid blocking the API response
      this.transporter.sendMail(mailOptions).catch(err => {
        console.error(" Background Email Sending Failed (Login):", err);
      });
      return { message: 'OTP generated and sent to email. Check inbox/spam.' };
    } catch (error) {
      console.error(" Email Process Failed (Login):", error); 
      throw new BadRequestException('Failed to process OTP email.');
    }
  }

  async verifyLoginOTP(email: string, userOtp: string) {
    const record = this.tempOtps.get(email + '_login');
    if (!record || record.otp !== userOtp) throw new BadRequestException('Invalid or expired OTP.');

    const user: any = record.userData;

    // ---  Smart Contract Check: User is Whitelisted? ---
    console.log(`\n=======================================================`);
    console.log(` [BLOCKCHAIN] VERIFYING STUDENT WHITELIST (LOGIN)    `);
    console.log(`=======================================================`);
    console.log(` Student Name : ${user.fullName}`);
    console.log(` Wallet       : ${user.walletAddress}`);
    console.log(` Checking Smart Contract mapping \`isWhitelisted\`...`);
    
    try {
      let isWhitelisted = await this.votingContract.isWhitelisted(user.walletAddress);
      if (!isWhitelisted) {
        console.log(` FAIL: Student NOT whitelisted. Attempting to re-whitelist for local recovery...`);
        const studentIdHash = ethers.id(user.studentId);
        const tx = await this.votingContract.whitelistVoter(user.walletAddress, studentIdHash);
        await tx.wait();
        isWhitelisted = true;
        console.log(` RE-WHITELIST SUCCESS: Student recovered on Blockchain.`);
      }
      console.log(` SUCCESS: Blockchain verification passed.`);
      console.log(`=======================================================\n`);
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      console.error(` Blockchain Check/Recovery Failed:`, error);
      console.log(`=======================================================\n`);
      throw new BadRequestException('Failed to check verification status. Please try again.');
    }
    // -----------------------------------------------------
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        faculty: user.faculty, 
        hasVoted: user.hasVoted, 
        walletAddress: user.walletAddress 
      },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1h' } 
    );

    this.tempOtps.delete(email + '_login');
    
    return {
      message: 'Login successful',
      token,
      user: { 
        id: user.id, 
        fullName: user.fullName, 
        faculty: user.faculty, 
        hasVoted: user.hasVoted, 
        walletAddress: user.walletAddress,
        faceDescriptor: user.faceDescriptor
      },
    };
  }
}
