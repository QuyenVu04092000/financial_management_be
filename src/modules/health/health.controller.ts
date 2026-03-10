import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/auth.decorator';
import { PrismaService } from '../../prisma/prisma.service';

// Uptime / health endpoint for Render free tier and external monitors
// (e.g. UptimeRobot, cron ping). This is:
// - unauthenticated
// - very fast
// - running a tiny DB query (SELECT 1) to keep Supabase warm
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  @Public()
  async health(): Promise<string> {
    await this.prisma.$queryRaw`SELECT 1`;
    return 'ok';
  }
}
