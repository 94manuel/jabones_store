import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { SiteVisitEntity } from '../../database/entities';
import { CreateSiteVisitDto } from './dto/create-site-visit.dto';

interface GeoLocation {
  city?: string;
  region?: string;
  country?: string;
}

@Injectable()
export class SiteVisitsService {
  constructor(
    @InjectRepository(SiteVisitEntity) private readonly siteVisits: Repository<SiteVisitEntity>,
  ) {}

  async register(request: Request, dto: CreateSiteVisitDto) {
    const ipAddress = this.extractIp(request);
    const location = await this.resolveLocation(request, ipAddress);
    const userAgent = this.normalizeHeaderValue(request.headers['user-agent'], 500);

    const saved = await this.siteVisits.save(this.siteVisits.create({
      visitorSessionId: dto.visitorSessionId,
      path: dto.path,
      referrer: dto.referrer,
      ipAddress,
      userAgent,
      ...location,
    }));

    return { id: saved.id, recorded: true };
  }

  private extractIp(request: Request) {
    const forwardedFor = this.normalizeHeaderValue(request.headers['x-forwarded-for'], 200);
    const realIp = this.normalizeHeaderValue(request.headers['x-real-ip'], 100);
    const remoteAddress = request.socket.remoteAddress?.trim();
    const candidate = forwardedFor?.split(',')[0]?.trim() || realIp || remoteAddress;
    if (!candidate) return undefined;
    const normalized = candidate.replace(/^::ffff:/, '');
    return normalized === '::1' ? '127.0.0.1' : normalized;
  }

  private async resolveLocation(request: Request, ipAddress?: string): Promise<GeoLocation> {
    const fromHeaders = this.locationFromHeaders(request);
    if (fromHeaders.city || fromHeaders.region || fromHeaders.country) return fromHeaders;
    if (!ipAddress || !this.isPublicIp(ipAddress)) return fromHeaders;

    try {
      const response = await fetch(`https://ipapi.co/${encodeURIComponent(ipAddress)}/json/`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(1500),
      });
      if (!response.ok) return fromHeaders;

      const data = await response.json() as { city?: unknown; region?: unknown; country_name?: unknown };
      return {
        city: this.normalizeText(data.city, 100) ?? fromHeaders.city,
        region: this.normalizeText(data.region, 100) ?? fromHeaders.region,
        country: this.normalizeText(data.country_name, 100) ?? fromHeaders.country,
      };
    } catch {
      return fromHeaders;
    }
  }

  private locationFromHeaders(request: Request): GeoLocation {
    return {
      city: this.normalizeHeaderValue(request.headers['x-vercel-ip-city'], 100)
        ?? this.normalizeHeaderValue(request.headers['x-city'], 100),
      region: this.normalizeHeaderValue(request.headers['x-vercel-ip-country-region'], 100)
        ?? this.normalizeHeaderValue(request.headers['x-region'], 100),
      country: this.normalizeHeaderValue(request.headers['x-vercel-ip-country'], 100)
        ?? this.normalizeHeaderValue(request.headers['cf-ipcountry'], 100)
        ?? this.normalizeHeaderValue(request.headers['cloudfront-viewer-country-name'], 100)
        ?? this.normalizeHeaderValue(request.headers['cloudfront-viewer-country'], 100)
        ?? this.normalizeHeaderValue(request.headers['x-country'], 100),
    };
  }

  private normalizeHeaderValue(value: string | string[] | undefined, maxLength: number) {
    const candidate = Array.isArray(value) ? value[0] : value;
    return this.normalizeText(candidate, maxLength);
  }

  private normalizeText(value: unknown, maxLength: number) {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, maxLength) : undefined;
  }

  private isPublicIp(ipAddress: string) {
    if (ipAddress.includes(':')) {
      const normalized = ipAddress.toLowerCase();
      return normalized !== '::1'
        && normalized !== '::'
        && !normalized.startsWith('fc')
        && !normalized.startsWith('fd')
        && !normalized.startsWith('fe80');
    }

    const octets = ipAddress.split('.').map((value) => Number(value));
    if (octets.length !== 4 || octets.some((value) => Number.isNaN(value) || value < 0 || value > 255)) return false;

    const [first, second] = octets;
    if (first === 0 || first === 10 || first === 127) return false;
    if (first === 169 && second === 254) return false;
    if (first === 172 && second >= 16 && second <= 31) return false;
    if (first === 192 && second === 168) return false;
    if (first === 100 && second >= 64 && second <= 127) return false;
    return true;
  }
}