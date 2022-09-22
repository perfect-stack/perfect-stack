import {MetaAttribute} from '../../../../../domain/meta.entity';

export class TypeaheadRequest {
  metaEntityName: string;
  metaAttribute: MetaAttribute;
  searchText: string | null;
  searchId: string | null;
  searchIdList: string[] | null;
}
