import { DoubleConverter } from './double.converter';

describe('DoubleConverter', () => {
  let converter: DoubleConverter;
  const attributeName = 'probability';

  beforeEach(() => {
    converter = new DoubleConverter();
  });

  describe('Valid Inputs', () => {
    it('should correctly convert a float string', async () => {
      const result = await converter.toAttributeValue(attributeName, '0.954');
      expect(result.attributeValues).toHaveLength(1);
      const attributeValue = result.attributeValues[0];
      expect(attributeValue.name).toBe(attributeName);
      expect(attributeValue.value).toBe(0.954);
      expect(attributeValue.error).toBeUndefined();
    });

    it('should correctly convert integer values to float numbers', async () => {
      const result = await converter.toAttributeValue(attributeName, '0');
      expect(result.attributeValues[0].value).toBe(0);
      expect(result.attributeValues[0].error).toBeUndefined();

      const result1 = await converter.toAttributeValue(attributeName, '42');
      expect(result1.attributeValues[0].value).toBe(42);
      expect(result1.attributeValues[0].error).toBeUndefined();
    });

    it('should correctly convert negative numbers', async () => {
      const result = await converter.toAttributeValue(attributeName, '-0.02');
      expect(result.attributeValues[0].value).toBe(-0.02);
      expect(result.attributeValues[0].error).toBeUndefined();
    });

    it('should handle strings with leading/trailing whitespace', async () => {
      const result = await converter.toAttributeValue(attributeName, '  0.656  ');
      expect(result.attributeValues[0].value).toBe(0.656);
      expect(result.attributeValues[0].error).toBeUndefined();
    });

    it('should handle scientific notation', async () => {
      const result = await converter.toAttributeValue(attributeName, '1.23e-4');
      expect(result.attributeValues[0].value).toBe(0.000123);
      expect(result.attributeValues[0].error).toBeUndefined();
    });

    it('should correctly convert comma-separated numbers', async () => {
      const result = await converter.toAttributeValue(attributeName, '1,234.56');
      expect(result.attributeValues[0].value).toBe(1234.56);
      expect(result.attributeValues[0].error).toBeUndefined();
    });
  });

  describe('Empty and Nullish Inputs', () => {
    it('should return a null value for an empty string', async () => {
      const result = await converter.toAttributeValue(attributeName, '');
      expect(result.attributeValues[0].value).toBeNull();
      expect(result.attributeValues[0].error).toBeUndefined();
    });

    it('should return a null value for a null input', async () => {
      const result = await converter.toAttributeValue(attributeName, null as any);
      expect(result.attributeValues[0].value).toBeNull();
      expect(result.attributeValues[0].error).toBeUndefined();
    });

    it('should return a null value for an undefined input', async () => {
      const result = await converter.toAttributeValue(attributeName, undefined as any);
      expect(result.attributeValues[0].value).toBeNull();
      expect(result.attributeValues[0].error).toBeUndefined();
    });
  });

  describe('Invalid Inputs', () => {
    it('should return an error for a non-numeric string', async () => {
      const externalValue = 'abc';
      const result = await converter.toAttributeValue(attributeName, externalValue);
      const attributeValue = result.attributeValues[0];

      expect(attributeValue.value).toBeNull();
      expect(attributeValue.error).toBe(`Value '${externalValue}' is not a valid number.`);
    });

    it('should reject mixed alphanumeric string', async () => {
      const externalValue = '0.95abc';
      const result = await converter.toAttributeValue(attributeName, externalValue);
      const attributeValue = result.attributeValues[0];

      expect(attributeValue.value).toBeNull();
      expect(attributeValue.error).toBe(`Value '${externalValue}' is not a valid number.`);
    });
  });
});
