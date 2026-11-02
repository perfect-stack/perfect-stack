import {makeLabel, toTitleCase} from './string-utils';

describe('StringUtils', () => {
  describe('makeLabel', () => {
    it('should convert PascalCase to sentence case with spaces', () => {
      expect(makeLabel('CaptureEvent')).toBe('Capture event');
      expect(makeLabel('BirdObservation')).toBe('Bird observation');
    });

    it('should return empty/null as is', () => {
      expect(makeLabel('')).toBe('');
      expect(makeLabel(null as any)).toBe(null as any);
    });
  });

  describe('toTitleCase', () => {
    it('should convert PascalCase to Title Case with spaces', () => {
      expect(toTitleCase('CaptureEvent')).toBe('Capture Event');
      expect(toTitleCase('BirdObservationReport')).toBe('Bird Observation Report');
      expect(toTitleCase('Person')).toBe('Person');
    });

    it('should handle already spaced Title Case strings', () => {
      expect(toTitleCase('Capture Events')).toBe('Capture Events');
      expect(toTitleCase('Bird Capture')).toBe('Bird Capture');
    });

    it('should handle snake_case and kebab-case strings', () => {
      expect(toTitleCase('capture_event')).toBe('Capture Event');
      expect(toTitleCase('capture-event')).toBe('Capture Event');
    });

    it('should preserve acronyms where appropriate', () => {
      expect(toTitleCase('GPSCoordinates')).toBe('GPS Coordinates');
    });

    it('should return empty string or null as is', () => {
      expect(toTitleCase('')).toBe('');
      expect(toTitleCase(null as any)).toBe(null as any);
    });
  });
});
