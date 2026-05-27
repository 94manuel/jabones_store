import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class PublicFileQueryDto {
  @ApiProperty({ description: 'Clave interna del archivo dentro de MinIO' })
  @IsString()
  @MinLength(1)
  key!: string;

  @ApiPropertyOptional({ description: 'Si es true, fuerza descarga en lugar de abrir inline', default: false })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true'))
  @IsBoolean()
  download?: boolean;
}