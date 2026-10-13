import { Controller, Post, Body, Req, UnauthorizedException, UseGuards, Get, Param, Query } from '@nestjs/common';
import { VoteService } from './vote.service';
import * as jwt from 'jsonwebtoken';

@Controller('vote')
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Get('status/:userId')
  async getVoteStatus(
    @Param('userId') userId: string,
    @Query('societyId') societyId?: string,
  ) {
    return this.voteService.getVoteStatus(parseInt(userId, 10), societyId ? parseInt(societyId, 10) : undefined);
  }

  @Post()
  async castVote(@Body() body: { candidateId: number, timeTaken?: number, faceImage?: string }, @Req() req: any) {
    
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new UnauthorizedException("No token provided");

    const token = authHeader.replace('Bearer ', '').trim();
    
    try {
      const secret = process.env.JWT_SECRET || 'secret_key';
      const decoded: any = jwt.verify(token, secret);
      
      const userId = decoded.userId;
      const timeTaken = body.timeTaken || 0; // Default to 0 if not provided
      console.log(` Relaying vote for User ID: ${userId} taking ${timeTaken} seconds`);

      return await this.voteService.castVote(userId, body.candidateId, timeTaken, body.faceImage);
      
    } catch (err: any) {
      if (err.name === 'BadRequestException' || err.status === 400) {
        throw err; 
      }
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}