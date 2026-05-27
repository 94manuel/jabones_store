import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Query,
  Res,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import multer from 'multer';
import { Role } from '../../database/enums';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ListFilesQueryDto } from './dto/list-files.query.dto';
import { PublicFileQueryDto } from './dto/public-file.query.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { StorageService } from './storage.service';

@ApiTags('Archivos')
@Controller('files')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Sube cualquier tipo de archivo a MinIO' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'productos' },
      },
      required: ['file'],
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async upload(@UploadedFile() file: Express.Multer.File | undefined, @Body() body: UploadFileDto) {
    if (!file) {
      throw new BadRequestException('Debe seleccionar un archivo para subir.');
    }
    return this.storage.uploadFile(file, body.folder);
  }

  @Get('admin')
  @ApiOperation({ summary: 'Lista archivos almacenados en MinIO' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adminList(@Query() query: ListFilesQueryDto) {
    return this.storage.listFiles(query.prefix, query.limit);
  }

  @Get('public')
  @ApiOperation({ summary: 'Entrega un archivo almacenado en MinIO para clientes o administradores' })
  @ApiQuery({ name: 'key', required: true, description: 'Clave del archivo en MinIO' })
  @ApiQuery({ name: 'download', required: false, description: 'true para forzar descarga' })
  async getPublicFile(@Query() query: PublicFileQueryDto, @Res() response: Response): Promise<void> {
    const { file, stream } = await this.storage.getFileStream(query.key);
    const disposition = query.download ? 'attachment' : 'inline';

    response.setHeader('Content-Type', file.contentType);
    response.setHeader('Content-Length', file.size.toString());
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.setHeader('Content-Disposition', `${disposition}; filename="${file.fileName.replace(/"/g, '')}"`);

    stream.on('error', () => response.destroy());
    stream.pipe(response);
  }
}