import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty() @IsString() @MinLength(2) name!: string;
  @ApiProperty() @IsString() @MinLength(2) slug!: string;
  @ApiProperty() @IsString() description!: string;
  @ApiProperty() @IsString() ingredients!: string;
  @ApiProperty() @IsString() category!: string;
  @ApiProperty() @IsInt() @Min(1) price!: number;
  @ApiProperty() @IsInt() @Min(0) stock!: number;
  @ApiProperty() @IsInt() @Min(1) weightGrams!: number;
  @ApiProperty() @IsString() imageUrl!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() featured?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
}
