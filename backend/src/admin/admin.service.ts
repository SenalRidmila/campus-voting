import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, Inject, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager'; 
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import * as nodemailer from 'nodemailer';
import * as VotingABI from '../vote/Voting.json';

@Injectable()
export class AdminService implements OnModuleInit, OnModuleDestroy {
  private mailTransporter: nodemailer.Transporter;
  private winnerNotificationTimer?: NodeJS.Timeout;

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: any 
  ) {
    this.mailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER?.trim(),
        pass: process.env.EMAIL_PASS?.replace(/\s+/g, '').trim(),
      },
    });
  }

  onModuleInit() {
    this.winnerNotificationTimer = setInterval(() => {
      this.notifyCompletedElections().catch((error) => {
        console.error('Winner notification check failed:', error);
      });
    }, 60_000);
  }

  onModuleDestroy() {
    if (this.winnerNotificationTimer) {
      clearInterval(this.winnerNotificationTimer);
    }
  }

  // --- ADMIN LOGIN ---
  async login(email: string, pass: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin) throw new UnauthorizedException('Invalid Admin Credentials');

    const isMatch = await bcrypt.compare(pass, admin.password);
    if (!isMatch) throw new UnauthorizedException('Invalid Admin Credentials');

    const token = jwt.sign(
      { adminId: admin.id, role: 'admin' },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );
    return { message: 'Admin Login Successful', token, name: admin.name };
  }

  // --- SOCIETIES ---
  async createSociety(data: any) {
    const res = await this.prisma.society.create({ data });
    await this.cacheManager.clear(); 
    return res;
  }

  async getSocieties() {
    return this.prisma.society.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async updateSociety(id: number, data: any) {
    const res = await this.prisma.society.update({ where: { id }, data });
    await this.cacheManager.clear(); 
    return res;
  }

  async deleteSociety(id: number) {
    const res = await this.prisma.society.delete({ where: { id } });
    await this.cacheManager.clear(); 
    return res;
  }

  // --- POSITIONS ---
  async createPosition(data: any) {
    const societyId = Number(data.societyId);

    if (!Number.isInteger(societyId) || societyId <= 0) {
      throw new BadRequestException('A valid societyId is required to create a position.');
    }

    const society = await this.prisma.society.findUnique({ where: { id: societyId } });
    if (!society) {
      throw new BadRequestException(`Society ${societyId} was not found. Refresh the admin dashboard and select an existing society.`);
    }

    const res = await this.prisma.position.create({
      data: {
        name: data.name,
        societyId,
        resultTime: data.resultTime ? new Date(data.resultTime) : null,
      },
    });
    await this.cacheManager.clear();
    return res;
  }

  async getPositions(societyId: number) {
    const positions = await this.prisma.position.findMany({
      where: { societyId },
      include: { candidates: true } 
    });

    try {
      const rpcUrl = process.env.RPC_URL;
      const votingAddress = process.env.VOTING_ADDRESS;

      if (rpcUrl && votingAddress) {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const votingContract = new ethers.Contract(votingAddress, VotingABI.abi, provider);

        await Promise.all(
          positions.map(async (pos) => {
            await Promise.all(
              pos.candidates.map(async (cand) => {
                const votes = await votingContract.candidateVotes(cand.id);
                cand.voteCount = Number(votes);
              })
            );
          })
        );
      }
    } catch (error) {
      console.error("Failed to fetch accurate vote counts from smart contract:", error);
    }

    await Promise.all(positions.map((position) => this.notifyElectionWinner(position)));

    return positions;
  }

  private async notifyElectionWinner(position: any) {
    if (!position.resultTime || new Date(position.resultTime).getTime() > Date.now()) {
      return;
    }

    const winner = [...position.candidates]
      .sort((first: any, second: any) => second.voteCount - first.voteCount)
      .find((candidate: any) => candidate.voteCount > 0);

    if (!winner || position.winnerNotifiedAt) {
      return;
    }

    const claimed = await this.prisma.position.updateMany({
      where: { id: position.id, winnerNotifiedAt: null },
      data: { winnerNotifiedAt: new Date() },
    });

    if (claimed.count !== 1) {
      return;
    }

    const students = await this.prisma.user.findMany({
      select: { email: true, fullName: true },
    });

    const emailResults = await Promise.allSettled(
      students.map((student) => this.mailTransporter.sendMail({
        from: `"Campus Voting App" <${process.env.EMAIL_USER}>`,
        to: student.email,
        subject: `Election result: ${winner.name} won ${position.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #1f2937;">
            <h2>Election Result Announcement</h2>
            <p>Hello ${student.fullName},</p>
            <p>The election for the <strong>${position.name}</strong> position has ended.</p>
            <p><strong>${winner.name}</strong> won the election.</p>
            <p>Thank you for participating in the Campus Voting App.</p>
          </div>
        `,
      })),
    );

    const failedEmails = emailResults.filter((result) => result.status === 'rejected').length;
    console.log(`Winner announcement sent for ${position.name}; failed emails: ${failedEmails}`);
  }

  private async notifyCompletedElections() {
    const societies = await this.prisma.society.findMany({ select: { id: true } });
    await Promise.all(societies.map((society) => this.getPositions(society.id)));
  }

  async updatePosition(id: number, data: any) {
    const res = await this.prisma.position.update({ where: { id }, data });
    await this.cacheManager.clear();
    return res;
  }

  async deletePosition(id: number) {
    const res = await this.prisma.position.delete({ where: { id } });
    await this.cacheManager.clear();
    return res;
  }

  // --- CANDIDATES ---
  async createCandidate(data: any) {
    const res = await this.prisma.candidate.create({ data });
    await this.cacheManager.clear();
    return res;
  }

  async getCandidates(positionId: number) {
    return this.prisma.candidate.findMany({ where: { positionId } });
  }

  async updateCandidate(id: number, data: any) {
    const res = await this.prisma.candidate.update({ where: { id }, data });
    await this.cacheManager.clear();
    return res;
  }

  async deleteCandidate(id: number) {
    const res = await this.prisma.candidate.delete({ where: { id } });
    await this.cacheManager.clear();
    return res;
  }
}