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
import { ActionType, MetaRole } from '../../domain/meta.role';
import { ActionPermit } from '../../authentication/action-permit';
import { SubjectName } from '../../authentication/subject';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('meta')
@Controller('meta/role')
export class MetaRoleController {
  constructor(protected readonly metaRoleService: MetaRoleService) {}

  @PublicApi()
  @ApiOperation({
    summary: '[PUBLIC] Download all Meta Role files',
  })
  @Get('/')
  findAll(
    @Query('pageNumber') pageNumber?: number,
    @Query('pageSize') pageSize?: number,
  ): Promise<MetaRole[]> {
    return this.metaRoleService.findAll();
  }

  @PublicApi()
  @ApiOperation({
    summary: '[PUBLIC] Get one Meta Role file',
  })
  @Get('/:metaRoleName')
  findOne(@Param('metaRoleName') metaRoleName: string): Promise<MetaRole> {
    return this.metaRoleService.findOne(metaRoleName);
  }

  @ActionPermit(ActionType.Edit)
  @SubjectName('Meta')
  @ApiOperation({
    summary: 'Create a new Meta Role file',
  })
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

  @ActionPermit(ActionType.Edit)
  @SubjectName('Meta')
  @ApiOperation({
    summary: 'Update the supplied Meta Role file',
  })
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

  @ActionPermit(ActionType.Delete)
  @SubjectName('Meta')
  @ApiOperation({
    summary: 'Permanently deletes the requested Meta Role file',
  })
  @Delete('/:metaRoleName')
  delete(@Param('metaRoleName') metaRoleName: string): Promise<void> {
    return this.metaRoleService.delete(metaRoleName);
  }
}
