import { ShowcaseItem } from '../showcase.model';

// Inputs & Primitives
import { textFieldRegistration } from './text-field.registration';
import { textAreaRegistration } from './text-area.registration';
import { booleanCheckboxRegistration } from './boolean-checkbox.registration';
import { urlFieldRegistration } from './url-field.registration';

// Pickers & Calendars
import { datePickerRegistration } from './date-picker.registration';
import { dateTimeRegistration } from './date-time.registration';
import { timeControlRegistration } from './time-control.registration';
import { flexibleDateTimeRegistration } from './flexible-date-time.registration';

// Selections & Badges
import { enumerationControlRegistration } from './enumeration-control.registration';
import { selectControlRegistration } from './select-control.registration';
import { selectMultipleRegistration } from './select-multiple.registration';
import { selectTwoRegistration } from './select-two.registration';
import { badgeListRegistration } from './badge-list.registration';
import { pipeListRegistration } from './pipe-list.registration';
import { colourBandRegistration } from './colour-band.registration';

// Action & Navigation Tools
import { buttonToolRegistration } from './button-tool.registration';
import { buttonGroupToolRegistration } from './button-group-tool.registration';
import { buttonTabsToolRegistration } from './button-tabs-tool.registration';
import { linkToolRegistration } from './link-tool.registration';
import { paginateToolRegistration } from './paginate-tool.registration';

// Presentation Tools
import { pageTitleToolRegistration } from './page-title-tool.registration';
import { textToolRegistration } from './text-tool.registration';
import { iconToolRegistration } from './icon-tool.registration';

// Media & Geospatial
import { mediaControlRegistration } from './media-control.registration';
import { mediaGalleryControlRegistration } from './media-gallery-control.registration';
import { geometryControlRegistration } from './geometry-control.registration';
import { mapToolRegistration } from './map-tool.registration';

// Relational Controls
import { manyToOneControlRegistration } from './many-to-one-control.registration';
import { oneToManyControlRegistration } from './one-to-many-control.registration';
import { oneToOneControlRegistration } from './one-to-one-control.registration';
import { oneToPolyControlRegistration } from './one-to-poly-control.registration';

// Observations
import { assertionListControlRegistration } from './assertion-list-control.registration';

// Diagnostic Tools
import { durationToolRegistration } from './duration-tool.registration';
import { treeToolRegistration } from './tree-tool.registration';
import { lastSignInToolRegistration } from './last-sign-in-tool.registration';
import { imageToolRegistration } from './image-tool.registration';

export * from './text-field.registration';
export * from './text-area.registration';
export * from './boolean-checkbox.registration';
export * from './url-field.registration';
export * from './date-picker.registration';
export * from './date-time.registration';
export * from './time-control.registration';
export * from './flexible-date-time.registration';
export * from './enumeration-control.registration';
export * from './select-control.registration';
export * from './select-multiple.registration';
export * from './select-two.registration';
export * from './badge-list.registration';
export * from './pipe-list.registration';
export * from './colour-band.registration';
export * from './button-tool.registration';
export * from './button-group-tool.registration';
export * from './button-tabs-tool.registration';
export * from './link-tool.registration';
export * from './paginate-tool.registration';
export * from './page-title-tool.registration';
export * from './text-tool.registration';
export * from './icon-tool.registration';
export * from './media-control.registration';
export * from './media-gallery-control.registration';
export * from './geometry-control.registration';
export * from './map-tool.registration';
export * from './many-to-one-control.registration';
export * from './one-to-many-control.registration';
export * from './one-to-one-control.registration';
export * from './one-to-poly-control.registration';
export * from './assertion-list-control.registration';
export * from './duration-tool.registration';
export * from './tree-tool.registration';
export * from './last-sign-in-tool.registration';
export * from './image-tool.registration';

export const SHOWCASE_REGISTRATIONS: ShowcaseItem[] = [
  // Inputs & Primitives
  textFieldRegistration,
  textAreaRegistration,
  booleanCheckboxRegistration,
  urlFieldRegistration,

  // Pickers & Calendars
  datePickerRegistration,
  dateTimeRegistration,
  timeControlRegistration,
  flexibleDateTimeRegistration,

  // Selections & Badges
  enumerationControlRegistration,
  selectControlRegistration,
  selectMultipleRegistration,
  selectTwoRegistration,
  badgeListRegistration,
  pipeListRegistration,
  colourBandRegistration,

  // Action & Navigation Tools
  buttonToolRegistration,
  buttonGroupToolRegistration,
  buttonTabsToolRegistration,
  linkToolRegistration,
  paginateToolRegistration,

  // Presentation Tools
  pageTitleToolRegistration,
  textToolRegistration,
  iconToolRegistration,

  // Media & Geospatial
  mediaControlRegistration,
  mediaGalleryControlRegistration,
  geometryControlRegistration,
  mapToolRegistration,

  // Relational Controls
  manyToOneControlRegistration,
  oneToManyControlRegistration,
  oneToOneControlRegistration,
  oneToPolyControlRegistration,

  // Observations
  assertionListControlRegistration,

  // Diagnostic Tools
  durationToolRegistration,
  treeToolRegistration,
  lastSignInToolRegistration,
  imageToolRegistration,
];
