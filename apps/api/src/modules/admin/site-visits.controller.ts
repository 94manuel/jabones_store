import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CreateSiteVisitDto } from './dto/create-site-visit.dto';
import { SiteVisitsService } from './site-visits.service';

@ApiTags('Visitas del sitio')
@Controller('site-visits')
export class SiteVisitsController {
  constructor(private readonly siteVisits: SiteVisitsService) {}

  @Post()
  register(@Req() request: Request, @Body() dto: CreateSiteVisitDto) {
    return this.siteVisits.register(request, dto);
  }
}