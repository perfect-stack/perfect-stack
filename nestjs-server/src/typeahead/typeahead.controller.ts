import { Body, Controller, Post } from '@nestjs/common';
import { TypeaheadRequest } from './dto/typeahead.request';
import { TypeaheadService } from './Typeahead.service';
import { Item } from './dto/typeahead.response';
import { PublicApi } from '../authentication/public-api';

@Controller('/typeahead')
export class TypeaheadController {
  constructor(protected readonly typeaheadService: TypeaheadService) {}

  @PublicApi()
  @Post()
  search(@Body() request: TypeaheadRequest): Promise<Item[]> {
    return this.typeaheadService.search(request);
  }
}
