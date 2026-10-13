import { Controller, Post, Get, Delete, Put, Body, Param, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager'; 
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  async login(@Body() body: { email: string; pass: string }) {
    return this.adminService.login(body.email, body.pass);
  }

  // --- SOCIETIES ROUTES ---
  @Post('societies')
  async createSociety(@Body() body: any) { return this.adminService.createSociety(body); }
  
  @Get('societies')
  async getSocieties() { return this.adminService.getSocieties(); }
  
  @Put('societies/:id')
  async updateSociety(@Param('id') id: string, @Body() body: any) { return this.adminService.updateSociety(Number(id), body); }
  
  @Delete('societies/:id')
  async deleteSociety(@Param('id') id: string) { return this.adminService.deleteSociety(Number(id)); }

  // --- POSITIONS ROUTES ---
  @Post('positions')
  async createPosition(@Body() body: any) { return this.adminService.createPosition(body); }
  
  @Get('societies/:id/positions')
  async getPositions(@Param('id') id: string) { return this.adminService.getPositions(Number(id)); }
  
  @Put('positions/:id')
  async updatePosition(@Param('id') id: string, @Body() body: any) { return this.adminService.updatePosition(Number(id), body); }
  
  @Delete('positions/:id')
  async deletePosition(@Param('id') id: string) { return this.adminService.deletePosition(Number(id)); }

  // --- CANDIDATES ROUTES ---
  @Post('candidates')
  async createCandidate(@Body() body: any) { return this.adminService.createCandidate(body); }
  
  @Get('positions/:id/candidates')
  async getCandidates(@Param('id') id: string) { return this.adminService.getCandidates(Number(id)); }
  
  @Put('candidates/:id')
  async updateCandidate(@Param('id') id: string, @Body() body: any) { return this.adminService.updateCandidate(Number(id), body); }
  
  @Delete('candidates/:id')
  async deleteCandidate(@Param('id') id: string) { return this.adminService.deleteCandidate(Number(id)); }
}