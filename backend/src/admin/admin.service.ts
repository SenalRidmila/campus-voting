import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager'; 
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import * as VotingABI from '../vote/Voting.json';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: any 
  ) {}

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

    return positions;
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