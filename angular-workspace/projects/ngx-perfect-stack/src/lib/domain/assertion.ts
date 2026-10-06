export enum AssertionValueClass {
  Integer = 'Integer',
  Double = 'Double',
  Text = 'Text',
  Enumeration = 'Enumeration',
  Date = 'Date',
  Time = 'Time',
  DateTime = 'DateTime',
  Geometry = 'Geometry',
  Boolean = 'Boolean',
}

export interface AssertionType {
  id: string;
  assertion_type_name: string;
  assertion_unit?: string;
  assertion_value_class: AssertionValueClass | string;
  assertion_value_enum_options?: string;
  assertion_value_number_min?: number;
  assertion_value_number_max?: number;
  assertion_value_decimal_places?: number;
  assertion_method?: string;
  assertion_type_notes?: string;
}

export interface Assertion {
  id?: string;
  assertion_type?: AssertionType;
  assertion_type_id: string;
  assertion_type_name: string;
  assertion_unit?: string;
  assertion_value_numeric?: number | null;
  assertion_value_text?: string | null;
  assertion_value_date?: string | null;
  assertion_value_time?: string | null;
  assertion_value_date_time?: string | null;
  assertion_value_geometry?: any | null;
  assertion_value_boolean?: boolean | null;
  assertion_method?: string | null;
  assertion_accuracy?: string | null;
  assertion_notes?: string | null;
}
