import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
@ApiTags('Estado') @Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}
  @Get() async check() { await this.dataSource.query('SELECT 1'); return { status: 'ok', service: 'cocoesencia-api', timestamp: new Date().toISOString() }; }
}
