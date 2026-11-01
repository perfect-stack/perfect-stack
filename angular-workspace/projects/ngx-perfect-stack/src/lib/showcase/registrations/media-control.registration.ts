import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '../../domain/meta.entity';

// -------------------------------------------------------------------------
// CATEGORY: Media & Geospatial
// -------------------------------------------------------------------------
export const mediaControlRegistration: ShowcaseItem = {
  id: 'media-control',
  name: 'MediaControlComponent',
  selector: '<lib-media-control>',
  category: 'Media & Geospatial',
  description: 'Single media asset viewer and uploader. Displays image previews with pagination, full-screen zoom dialog, download actions, and upload file dialog.',
  attribute: {
    name: 'media_files',
    label: 'Media Files',
    description: 'Patient media attachments',
    type: AttributeType.OneToMany,
    visibility: VisibilityType.Visible,
    comparisonField: '',
    comparisonOperator: ComparisonOperator.Equals,
    relationshipTarget: 'PetMediaFile',
    typeaheadSearch: [],
    discriminator: { entityMappingList: [], discriminatorName: '', discriminatorType: '' },
    rules: [],
    enumeration: [],
    unitOfMeasure: '',
    scale: '',
  },
  cell: {
    width: '12',
    height: '2',
    attributeName: 'media_files',
    component: 'Media',
    hideLabel: true,
  },
  initialValue: [
    { id: '1', path: 'Image/20211125_185945.jpg', comments: 'Front profile photo' },
    { id: '2', path: 'Image/20211125_190034.jpg', comments: 'Side profile photo' }
  ],
  samplePresets: [
    {
      label: 'Single Image',
      value: [
        { id: '1', path: 'Image/20211125_185945.jpg', comments: 'Front profile photo' }
      ]
    },
    {
      label: 'Two Images',
      value: [
        { id: '1', path: 'Image/20211125_185945.jpg', comments: 'Front profile photo' },
        { id: '2', path: 'Image/20211125_190034.jpg', comments: 'Side profile photo' }
      ]
    },
    {
      label: 'No Media',
      value: []
    }
  ],
  docProperties: [
    { property: 'Relationship Type', description: 'OneToMany relationship target (e.g. PetMediaFile).' },
    { property: 'Asset Loading', description: 'Loads binary data via media service /download/:path or custom data provider.' },
    { property: 'Image Navigation', description: 'Supports next/previous buttons when multiple images are attached.' },
    { property: 'Modal Dialog', description: 'Clicking preview expands image in an NgbModal zoom viewer.' }
  ],
  metaPageJson: {
    width: '12',
    height: '2',
    attributeName: 'media_files',
    component: 'Media',
    hideLabel: true
  },
  featurePath: '/assets/features/components/media-control.feature',
  fallbackFeature: `Feature: Media Control Component
  As a veterinarian or clinic staff member
  I want to view and review individual patient media files and photos
  So that diagnostic images and physical records can be evaluated

  @showcase @media-control
  Scenario: Display single media control in the Component Showcase
    When I navigate to "/showcase/media-control"
    Then the showcase header should display "MediaControlComponent"
    And the media control should be visible
    When I click the showcase button "btn-mode-view"
    Then the media control should be visible
    When I click the showcase button "btn-mode-edit"
    Then the media control should be visible`
};
