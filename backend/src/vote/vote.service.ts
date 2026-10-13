import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ethers } from 'ethers';
import * as crypto from 'crypto';

import * as VotingABI from './Voting.json';
import * as ForwarderABI from './MyForwarder.json';
import { ResultsGateway } from '../results.gateway'; // 

@Injectable()
export class VoteService {
  private provider: ethers.JsonRpcProvider;
  private adminWallet: ethers.Wallet;
  private forwarderContract: ethers.Contract;

  private readonly algorithm = 'aes-256-cbc';
  private readonly secretKey = process.env.ENCRYPTION_KEY || 'MySuperSecretKeyForVotingApp123!';

  constructor(
    private prisma: PrismaService,
    private resultsGateway: ResultsGateway 
  ) {
    const rpcUrl = process.env.RPC_URL;
    const adminKey = process.env.ADMIN_PRIVATE_KEY;
    const forwarderAddr = process.env.FORWARDER_ADDRESS;

    if (!rpcUrl || !adminKey || !forwarderAddr) {
      console.error(" ERROR: Missing environment variables in .env file!");
      throw new Error("Blockchain configuration missing");
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.adminWallet = new ethers.Wallet(adminKey, this.provider);
    
    this.forwarderContract = new ethers.Contract(
      forwarderAddr,
      ForwarderABI.abi,
      this.adminWallet
    );
  }

  private decryptPrivateKey(encryptedText: string): string {
    try {
      const textParts = encryptedText.split(':');
      const ivHex = textParts.shift()!; 
      const iv = Buffer.from(ivHex, 'hex');
      const encryptedData = Buffer.from(textParts.join(':'), 'hex');
      
      const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.secretKey), iv);
      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted.toString();
    } catch (error) {
      console.error("Decryption Failure:", error);
      throw new BadRequestException("Failed to unlock student wallet.");
    }
  }

  async getVoteStatus(userId: number, societyId?: number) {
    if (!userId || isNaN(userId)) {
      return { votedPositionIds: [] };
    }

    const whereClause: any = { userId };
    
    if (societyId) {
      whereClause.position = {
        societyId: societyId
      };
    }
    
    const records = await this.prisma.voteRecord.findMany({
      where: whereClause,
      select: { positionId: true }
    });
    
    return {
      votedPositionIds: records.map(r => r.positionId)
    };
  }

  async castVote(userId: number, candidateId: number, timeTaken: number, faceImage?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { position: { include: { society: true } } } // 
    });

    if (!user || !user.encryptedPrivateKey) throw new BadRequestException("User wallet not found!");

    // Perform Face Verification via AI Microservice if applicable
    if (user.faceDescriptor && faceImage) {
        try {
            const aiResponse = await fetch('http://127.0.0.1:8000/verify-face', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    image_base64: faceImage,
                    target_embedding: JSON.parse(user.faceDescriptor)
                })
            });
            if (!aiResponse.ok) {
                 throw new BadRequestException("Failed to verify face with AI Microservice.");
            }
            const aiData = await aiResponse.json();
            if (!aiData.match) {
                 throw new BadRequestException("Face verification failed! Identity does not match.");
            }
        } catch(err) {
            console.error("AI Verify Error:", err);
            if (err instanceof BadRequestException) throw err;
            throw new BadRequestException("Face verification service is unavailable.");
        }
    } else if (user.faceDescriptor && !faceImage) {
        throw new BadRequestException("Face image is required for verification.");
    }
    if (!candidate) throw new BadRequestException("Candidate not found!");

    const positionId = candidate.positionId;
    const societyId = candidate.position.societyId; // 

    const existingVote = await this.prisma.voteRecord.findUnique({
      where: { userId_positionId: { userId, positionId } }
    });
    if (existingVote) throw new BadRequestException(`Already voted for ${candidate.position.name}!`);

    try {
      const privateKey = this.decryptPrivateKey(user.encryptedPrivateKey);
      const studentWallet = new ethers.Wallet(privateKey, this.provider);

      const votingInterface = new ethers.Interface(VotingABI.abi);
      const data = votingInterface.encodeFunctionData("vote", [positionId, candidateId, timeTaken]);

      const domain = {
        name: "MyForwarder",
        version: "1",
        chainId: (await this.provider.getNetwork()).chainId,
        verifyingContract: process.env.FORWARDER_ADDRESS,
      };

      const types = {
        ForwardRequest: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "gas", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      };

      const request = {
        from: studentWallet.address,
        to: process.env.VOTING_ADDRESS,
        value: 0,
        gas: 1000000,
        nonce: await this.forwarderContract.nonces(studentWallet.address),
        deadline: Math.floor(Date.now() / 1000) + 3600,
        data: data,
      };

      console.log("\n=======================================================");
      console.log("🗳️  [BLOCKCHAIN] INITIATING SECURE VOTE TRANSACTION    🗳️");
      console.log("=======================================================");
      console.log(` Voter         : ${user.fullName}`);
      console.log(` Voter Wallet  : ${studentWallet.address}`);
      console.log(` Candidate     : ${candidate.name} (${candidate.position.name})`);
      
      console.log(`\n [STEP 1] Student is cryptographically signing the vote using EIP-712...`);
      const signature = await studentWallet.signTypedData(domain, types, request);
      console.log(` Signature Generated: ${signature.substring(0, 20)}...${signature.substring(signature.length - 10)}`);

      console.log(`\n [STEP 2] Admin Wallet (Relayer) is covering gas fees and sending to Blockchain...`);
      console.log(` Admin Wallet : ${this.adminWallet.address}`);
      
      const tx = await this.forwarderContract.execute({ ...request, signature });
      console.log(` Transaction sent! Waiting for block confirmation...`);
      
      const receipt = await tx.wait();
      
      console.log(`\n [STEP 3] VOTE SUCCESSFULLY RECORDED ON BLOCKCHAIN!`);
      console.log(` Transaction Hash: ${receipt.hash}`);
      console.log(` Gas Used By Admin: ${receipt.gasUsed.toString()}`);
      console.log("=======================================================\n");

      await this.prisma.voteRecord.create({ data: { userId, positionId } });
      await this.prisma.candidate.update({
        where: { id: candidateId },
        data: { voteCount: { increment: 1 } }
      });
      await this.prisma.user.update({
        where: { id: userId },
        data: { hasVoted: true }
      });

      this.resultsGateway.notifyVoteUpdate(societyId);

      return { 
        message: "Gasless Vote cast successfully!", 
        transactionHash: receipt.hash 
      };

    } catch (error: any) {
      console.error("Blockchain Relay Failed:", error);
      throw new InternalServerErrorException("Failed to process vote on Blockchain.");
    }
  }

  // 🌟 নতুন method: Get user's voting status
  async getUserVotingStatus(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          voteRecords: {
            include: {
              position: true
            }
          }
        }
      });

      if (!user) {
        throw new Error("User not found");
      }

      const votedPositions = user.voteRecords.map(vr => ({
        positionId: vr.positionId,
        positionName: vr.position.name
      }));

      return {
        userId,
        hasVoted: user.hasVoted,
        votedPositions,
        votedCount: votedPositions.length
      };
    } catch (error) {
      throw new Error("Failed to get voting status");
    }
  }
}