import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PublicApi } from '../../authentication/public-api';
import { MetaRoleService } from './meta-role.service';
import { MetaRole } from '../../domain/meta.role';

@Controller('meta/role')
export class MetaRoleController {
  constructor(protected readonly metaRoleService: MetaRoleService) {}

  @PublicApi()
  @Get('/')
  findAll(
    @Query('pageNumber') pageNumber?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<MetaRole[]> {
    return this.metaRoleService.findAll();
  }

  @PublicApi()
  @Get('/:metaRoleName')
  findOne(@Param('metaRoleName') metaRoleName: string): Promise<MetaRole> {
    return this.metaRoleService.findOne(metaRoleName);
  }

  @Post('/:metaRoleName')
  create(
    @Param('metaRoleName') metaRoleName: string,
    @Body() metaRole: MetaRole,
  ): Promise<any> {
    if (metaRole.name !== metaRoleName) {
      throw new Error(
        `Parameter metaRoleName of "${metaRoleName}" does not match the metaRole.name of "${metaRole.name}"`,
      );
    }
    return this.metaRoleService.create(metaRole);
  }

  @Put('/:metaRoleName')
  update(
    @Param('metaRoleName') metaRoleName: string,
    @Body() metaRole: MetaRole,
  ): Promise<any> {
    if (metaRole.name !== metaRoleName) {
      throw new Error(
        `Parameter metaRoleName of "${metaRoleName}" does not match the metaRole.name of "${metaRole.name}"`,
      );
    }
    return this.metaRoleService.update(metaRole);
  }

  @Delete('/:metaRoleName')
  delete(@Param('metaRoleName') metaRoleName: string): Promise<void> {
    return this.metaRoleService.delete(metaRoleName);
  }
}
