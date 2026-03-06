import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/auth.decorator';

// Lightweight uptime/health endpoint for Render free tier and external monitors
// (e.g. UptimeRobot, cron ping). This must be:
// - unauthenticated
// - very fast
// - not touching the database
@Controller()
export class HealthController {
  @Get('health')
  @Public()
  health(): string {
    return 'ok';
  }
}


