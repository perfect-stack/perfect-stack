import { Body, Controller, Post } from '@nestjs/common';
import { TypeaheadRequest } from './dto/typeahead.request';
import { TypeaheadService } from './typeahead.service';
import { Item } from './dto/typeahead.response';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActionPermit } from '../authentication/action-permit';
import { ActionType } from '../domain/meta.role';
import { SubjectName } from '../authentication/subject';

@ApiTags('typeahead')
@Controller('/typeahead')
export class TypeaheadController {
  constructor(protected readonly typeaheadService: TypeaheadService) {}

  @ActionPermit(ActionType.Read)
  @SubjectName('Any')
  @ApiOperation({
    summary:
      'Perform a search of the database to find rows matching the supplied search criteria. Used for Typeahead fields within the application',
  })
  @Post()
  search(@Body() request: TypeaheadRequest): Promise<Item[]> {
    return this.typeaheadService.search(request);
  }
}
