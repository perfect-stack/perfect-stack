import { AttributeValue, ConverterResult, DataImportConverter, DataListImportConverter, ExternalValue } from './converter.types';
import { QueryService } from '../../query.service';
import { QueryRequest } from '../../query.request';
import { AttributeType, ComparisonOperator } from '../../../domain/meta.entity';

/**
 * Converts the current user running a Data Import Job (or a row-level observer/assignee)
 * into a Person entity reference (assignee_id and assignee).
 */
export class CurrentUserConverter implements DataImportConverter, DataListImportConverter {
  constructor(
    protected readonly queryService: QueryService,
    protected readonly fallbackUserName?: string,
    protected readonly targetEntityName: string = 'Person',
  ) {}

  /**
   * Resolves a Person entity from the database matching the provided name or email,
   * with fallback to this.fallbackUserName, and finally to the default/first Person.
   */
  async resolvePerson(userNameOrEmail?: string): Promise<any> {
    const candidate = (userNameOrEmail && userNameOrEmail.trim()) || (this.fallbackUserName && this.fallbackUserName.trim());

    if (candidate && candidate !== 'System / Local' && candidate !== 'Unknown User') {
      // 1. Email lookup if candidate looks like an email
      if (candidate.includes('@')) {
        const query = new QueryRequest();
        query.metaEntityName = this.targetEntityName;
        query.criteria = [
          {
            name: 'email_address',
            operator: ComparisonOperator.Equals,
            value: candidate,
            attributeType: AttributeType.Text,
          },
        ];
        try {
          const res = await this.queryService.findByCriteria(query);
          if (res && res.resultList && res.resultList.length > 0) {
            return res.resultList[0];
          }
        } catch (e) {
          // ignore query error
        }
      }

      // 2. Full name lookup if candidate contains spaces (e.g. "Richard Perfect")
      if (candidate.includes(' ')) {
        const parts = candidate.split(/\s+/).filter(Boolean);
        const givenName = parts[0];
        const familyName = parts.slice(1).join(' ');

        const query = new QueryRequest();
        query.metaEntityName = this.targetEntityName;
        query.criteria = [
          {
            name: 'given_name',
            operator: ComparisonOperator.Equals,
            value: givenName,
            attributeType: AttributeType.Text,
          },
          {
            name: 'family_name',
            operator: ComparisonOperator.Equals,
            value: familyName,
            attributeType: AttributeType.Text,
          },
        ];
        try {
          const res = await this.queryService.findByCriteria(query);
          if (res && res.resultList && res.resultList.length > 0) {
            return res.resultList[0];
          }
        } catch (e) {
          // ignore query error
        }
      }

      // 3. Single token or partial matches (given_name, family_name, or email_address)
      const attempts = [
        { name: 'given_name', operator: ComparisonOperator.Equals, value: candidate, attributeType: AttributeType.Text },
        { name: 'family_name', operator: ComparisonOperator.Equals, value: candidate, attributeType: AttributeType.Text },
        { name: 'email_address', operator: ComparisonOperator.InsensitiveStartsWith, value: candidate, attributeType: AttributeType.Text },
      ];

      for (const crit of attempts) {
        const query = new QueryRequest();
        query.metaEntityName = this.targetEntityName;
        query.criteria = [crit];
        try {
          const res = await this.queryService.findByCriteria(query);
          if (res && res.resultList && res.resultList.length > 0) {
            return res.resultList[0];
          }
        } catch (e) {
          // ignore query error
        }
      }
    }

    // 4. Fallback: If no match found or running in dev/local mode, retrieve first active Person
    try {
      const all = await this.queryService.findAll(this.targetEntityName, 1, 1);
      if (all && all.resultList && all.resultList.length > 0) {
        return all.resultList[0];
      }
    } catch (e) {
      // ignore
    }

    return null;
  }

  protected toConverterResult(attributeName: string, person: any): ConverterResult {
    const attributeValues: AttributeValue[] = [];
    const fkName = attributeName.endsWith('_id') ? attributeName : `${attributeName}_id`;
    const relName = attributeName.endsWith('_id') ? attributeName.slice(0, -3) : attributeName;

    if (person && person.id) {
      attributeValues.push({
        name: fkName,
        value: person.id,
      });
      attributeValues.push({
        name: relName,
        value: person,
      });
    } else {
      attributeValues.push({
        name: fkName,
        value: null,
      });
      attributeValues.push({
        name: relName,
        value: null,
      });
    }

    return { attributeValues };
  }

  async toAttributeValue(attributeName: string, externalValue: string): Promise<ConverterResult> {
    const userToResolve = (this.fallbackUserName && this.fallbackUserName.trim()) || (externalValue && externalValue.trim());
    const person = await this.resolvePerson(userToResolve);
    return this.toConverterResult(attributeName, person);
  }

  async toAttributeValueFromExternalValueList(
    attributeName: string,
    externalValueList: ExternalValue[],
  ): Promise<ConverterResult> {
    let userToResolve = this.fallbackUserName && this.fallbackUserName.trim();
    if (!userToResolve && externalValueList && externalValueList.length > 0) {
      const nonBlank = externalValueList.find((v) => v && v.value && v.value.trim().length > 0);
      if (nonBlank) {
        userToResolve = nonBlank.value.trim();
      }
    }
    const person = await this.resolvePerson(userToResolve);
    return this.toConverterResult(attributeName, person);
  }
}
