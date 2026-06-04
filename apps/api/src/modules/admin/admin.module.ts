import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SiteVisitsController } from './site-visits.controller';
import { SiteVisitsService } from './site-visits.service';

@Module({ controllers: [AdminController, SiteVisitsController], providers: [AdminService, SiteVisitsService] })
export class AdminModule {}
