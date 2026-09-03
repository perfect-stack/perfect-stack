import { AltitudeConverter } from './altitude.converter';
import { ESRIService } from '../../../esri/esri.service';
import { ExternalValue } from './converter.types';

describe('AltitudeConverter', () => {
  let converter: AltitudeConverter;
  let esriService: jest.Mocked<ESRIService>;
  const attributeName = 'altitude';

  beforeEach(() => {
    esriService = {
      getAltitude: jest.fn(),
    } as any;

    converter = new AltitudeConverter(esriService);
  });

  it('should convert valid easting and northing into altitude', async () => {
    esriService.getAltitude.mockResolvedValue(1074.4);

    const externalValues: ExternalValue[] = [
      { name: 'Easting', value: '1837966', col: 0 },
      { name: 'Northing', value: '5644656', col: 1 },
    ];

    const result = await converter.toAttributeValueFromExternalValueList(
      attributeName,
      externalValues,
    );

    expect(result.attributeValues).toHaveLength(1);
    expect(result.attributeValues[0].name).toBe('altitude');
    expect(result.attributeValues[0].value).toBe(1074);
    expect(result.attributeValues[0].error).toBeUndefined();
    expect(esriService.getAltitude).toHaveBeenCalledWith(1837966, 5644656);
  });

  it('should return error when ESRIService returns null', async () => {
    esriService.getAltitude.mockResolvedValue(null);

    const externalValues: ExternalValue[] = [
      { name: 'Easting', value: '1837966', col: 0 },
      { name: 'Northing', value: '5644656', col: 1 },
    ];

    const result = await converter.toAttributeValueFromExternalValueList(
      attributeName,
      externalValues,
    );

    expect(result.attributeValues).toHaveLength(1);
    expect(result.attributeValues[0].value).toBeNull();
    expect(result.attributeValues[0].error).toContain(
      'Unable to find altitude',
    );
  });

  it('should return error when easting or northing is missing or invalid', async () => {
    const externalValues: ExternalValue[] = [
      { name: 'Easting', value: '', col: 0 },
      { name: 'Northing', value: '5644656', col: 1 },
    ];

    const result = await converter.toAttributeValueFromExternalValueList(
      attributeName,
      externalValues,
    );

    expect(result.attributeValues).toHaveLength(1);
    expect(result.attributeValues[0].value).toBeNull();
    expect(result.attributeValues[0].error).toContain('Missing or invalid');
    expect(esriService.getAltitude).not.toHaveBeenCalled();
  });
});
