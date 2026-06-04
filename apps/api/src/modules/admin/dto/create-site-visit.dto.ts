import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

export class CreateSiteVisitDto {
  @Transform(trimString)
  @IsString()
  @MaxLength(300)
  path!: string;

  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  referrer?: string;

  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  visitorSessionId?: string;
}