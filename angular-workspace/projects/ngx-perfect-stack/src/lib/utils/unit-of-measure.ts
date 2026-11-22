export interface UnitDefinition {
  unit: string;
  /** Base-10 exponent relative to the smallest unit in the family. */
  exponent: number;
}

export interface UnitFamily {
  name: string;
  units: UnitDefinition[];
}

const UNIT_FAMILIES: UnitFamily[] = [
  {
    name: 'Weight',
    units: [
      { unit: 'g', exponent: 0 },
      { unit: 'kg', exponent: 3 },
      { unit: 't', exponent: 6 },
    ],
  },
  {
    name: 'Length',
    units: [
      { unit: 'mm', exponent: 0 },
      { unit: 'm', exponent: 3 },
      { unit: 'km', exponent: 6 },
    ],
  },
  {
    name: 'Area',
    units: [
      { unit: 'cm2', exponent: 0 },
      { unit: 'm2', exponent: 4 },
      { unit: 'ha', exponent: 8 },
      { unit: 'km2', exponent: 10 },
    ],
  },
];

const UNIT_FAMILY_INDEX = new Map<string, { family: UnitFamily; index: number; def: UnitDefinition }>();

for (const family of UNIT_FAMILIES) {
  family.units.forEach((def, index) => {
    UNIT_FAMILY_INDEX.set(def.unit, { family, index, def });
  });
}

export function getUnitFamily(unit?: string | null): UnitFamily | null {
  if (!unit) {
    return null;
  }
  const entry = UNIT_FAMILY_INDEX.get(unit.trim());
  return entry ? entry.family : null;
}

export function isSupportedUnit(unit?: string | null): boolean {
  return getUnitFamily(unit) !== null;
}

export function getNextUnit(currentUnit?: string | null): string | null {
  if (!currentUnit) {
    return null;
  }
  const entry = UNIT_FAMILY_INDEX.get(currentUnit.trim());
  if (!entry) {
    return null;
  }
  const nextIndex = (entry.index + 1) % entry.family.units.length;
  return entry.family.units[nextIndex].unit;
}

/**
 * Converts a numeric string/number between two units in the same SI family using
 * exact base-10 decimal shifting so binary floating-point rounding noise is avoided.
 * Returns null if the input is not a complete valid number or the units are incompatible.
 */
export function convertDecimalUnit(
  value: string | number | null | undefined,
  fromUnit: string,
  toUnit: string
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  if (fromUnit === toUnit) {
    const parsed = parseDecimalParts(raw);
    return parsed ? formatShiftedDecimal(parsed, 0) : null;
  }

  const fromEntry = UNIT_FAMILY_INDEX.get(fromUnit.trim());
  const toEntry = UNIT_FAMILY_INDEX.get(toUnit.trim());
  if (!fromEntry || !toEntry || fromEntry.family !== toEntry.family) {
    return null;
  }

  const parsed = parseDecimalParts(raw);
  if (!parsed) {
    return null;
  }

  const shift = fromEntry.def.exponent - toEntry.def.exponent;
  return formatShiftedDecimal(parsed, shift);
}

interface ParsedDecimal {
  negative: boolean;
  digits: string;
  decimalPosition: number;
}

function parseDecimalParts(raw: string): ParsedDecimal | null {
  const match = raw.match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/);
  if (!match) {
    return null;
  }

  const sign = match[1];
  const intPart = match[2] ?? '';
  const fracAfterInt = match[3] ?? '';
  const fracOnly = match[4] ?? '';
  const exp = match[5] ? parseInt(match[5], 10) : 0;

  const fracPart = intPart !== '' ? fracAfterInt : fracOnly;
  const digits = intPart + fracPart;
  if (!digits || !/^\d+$/.test(digits)) {
    return null;
  }

  return {
    negative: sign === '-',
    digits,
    decimalPosition: intPart.length + exp,
  };
}

function formatShiftedDecimal(parsed: ParsedDecimal, shift: number): string {
  // Check if all digits are zero
  if (/^0+$/.test(parsed.digits)) {
    return '0';
  }

  const dotPos = parsed.decimalPosition + shift;
  let intStr: string;
  let fracStr: string;

  if (dotPos <= 0) {
    intStr = '0';
    fracStr = '0'.repeat(-dotPos) + parsed.digits;
  } else if (dotPos >= parsed.digits.length) {
    intStr = parsed.digits + '0'.repeat(dotPos - parsed.digits.length);
    fracStr = '';
  } else {
    intStr = parsed.digits.slice(0, dotPos);
    fracStr = parsed.digits.slice(dotPos);
  }

  // Strip redundant leading zeros on integer part (keep at least '0')
  intStr = intStr.replace(/^0+/, '') || '0';
  // Strip trailing zeros on fractional part
  fracStr = fracStr.replace(/0+$/, '');

  const magnitude = fracStr.length > 0 ? `${intStr}.${fracStr}` : intStr;
  return parsed.negative ? `-${magnitude}` : magnitude;
}
