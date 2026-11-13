import {
  ResultType,
  RuleValidator,
  ValidationResult,
} from '../../../domain/meta.rule';
import { MetaAttribute } from '../../../domain/meta.entity';
import { isGeometryPolygon, isValidGeoJsonPoint } from '../../../map/map.service';

export class PolygonCenterpointRuleValidator extends RuleValidator {
  async validate(
    entity: any,
    attribute: MetaAttribute,
  ): Promise<ValidationResult | null> {
    if (!entity || typeof entity !== 'object') {
      return null;
    }

    const geometryAttrName = this.ruleData?.config?.trim() || 'geometry';
    const geometryValue = entity[geometryAttrName];

    if (isGeometryPolygon(geometryValue)) {
      const centerpointValue = entity[attribute.name];
      if (!isValidGeoJsonPoint(centerpointValue)) {
        return {
          name: attribute.name,
          resultType: ResultType.Error,
          message: 'A center point is required when geometry is a Polygon.',
        };
      }
    }

    return null;
  }
}
