import {
  ConverterResult,
  DataListImportConverter,
  ExternalValue,
} from './converter.types';
import { ESRIService } from '../../../esri/esri.service';

export class AltitudeConverter implements DataListImportConverter {
  constructor(protected readonly esriService: ESRIService) {}

  async toAttributeValueFromExternalValueList(
    attributeName: string,
    externalValueList: ExternalValue[],
  ): Promise<ConverterResult> {
    const eastingVal = externalValueList[0]?.value;
    const northingVal = externalValueList[1]?.value;

    if (
      eastingVal !== null &&
      eastingVal !== undefined &&
      eastingVal !== '' &&
      northingVal !== null &&
      northingVal !== undefined &&
      northingVal !== ''
    ) {
      const easting = parseInt(eastingVal, 10);
      const northing = parseInt(northingVal, 10);

      if (!isNaN(easting) && !isNaN(northing)) {
        const altitude = await this.esriService.getAltitude(easting, northing);
        if (altitude !== null && !isNaN(altitude)) {
          return {
            attributeValues: [
              {
                name: attributeName,
                value: Math.round(altitude),
              },
            ],
          };
        } else {
          return {
            attributeValues: [
              {
                name: attributeName,
                value: null,
                error: `Unable to find altitude for Easting: ${eastingVal}, Northing: ${northingVal}`,
              },
            ],
          };
        }
      }
    }

    return {
      attributeValues: [
        {
          name: attributeName,
          value: null,
          error:
            'Unable to convert Altitude: Missing or invalid Easting/Northing',
        },
      ],
    };
  }
}
