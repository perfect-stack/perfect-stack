import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '@perfect-stack/ngx-perfect-stack';

// -------------------------------------------------------------------------
// CATEGORY: Media & Geospatial
// -------------------------------------------------------------------------
export const mediaGalleryControlRegistration: ShowcaseItem = {
  id: 'media-gallery-control',
  name: 'MediaGalleryControlComponent',
  selector: '<lib-media-gallery-control>',
  category: 'Media & Geospatial',
  description: 'Multi-asset thumbnail grid gallery. Renders responsive columns of image previews with page navigation and click-to-enlarge capabilities.',
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
    component: 'MediaGallery',
    media_cols: '3',
    media_rows: '2',
    hideLabel: true,
  },
  initialValue: [
    { id: '1', path: 'Image/20211125_185945.jpg', comments: 'Photo 1' },
    { id: '2', path: 'Image/20211125_190034.jpg', comments: 'Photo 2' },
    { id: '3', path: 'Image/20220613_182750.jpg', comments: 'Photo 3' },
    { id: '4', path: 'Image/20220905_183756.jpg', comments: 'Photo 4' }
  ],
  samplePresets: [
    {
      label: '4 Photos Grid',
      value: [
        { id: '1', path: 'Image/20211125_185945.jpg', comments: 'Photo 1' },
        { id: '2', path: 'Image/20211125_190034.jpg', comments: 'Photo 2' },
        { id: '3', path: 'Image/20220613_182750.jpg', comments: 'Photo 3' },
        { id: '4', path: 'Image/20220905_183756.jpg', comments: 'Photo 4' }
      ]
    },
    {
      label: '2 Photos Grid',
      value: [
        { id: '1', path: 'Image/20211125_185945.jpg', comments: 'Photo 1' },
        { id: '2', path: 'Image/20211125_190034.jpg', comments: 'Photo 2' }
      ]
    },
    {
      label: 'Empty Gallery',
      value: []
    }
  ],
  docProperties: [
    { property: 'Supported Type', description: 'OneToMany relationship target (e.g. PetMediaFile).' },
    { property: 'Grid Dimensions', description: 'Configured via cell.media_cols and cell.media_rows.' },
    { property: 'Pagination', description: 'Page numbers and items per page computed dynamically from gallery item count.' },
    { property: 'Thumbnail Previews', description: 'Asynchronous lazy loading and caching of thumbnail URLs.' }
  ],
  metaPageJson: {
    width: '12',
    height: '2',
    attributeName: 'media_files',
    component: 'MediaGallery',
    media_cols: '3',
    media_rows: '2',
    hideLabel: true
  },
  featurePath: '/assets/features/components/media-gallery-control.feature',
  fallbackFeature: `Feature: Media Gallery Control Component
  As a clinician reviewing multi-image diagnostics
  I want a thumbnail grid gallery of media attachments
  So that I can scan multiple images and navigate pages quickly

  @showcase @media-gallery-control
  Scenario: Display media gallery control in the Component Showcase
    When I navigate to "/showcase/media-gallery-control"
    Then the showcase header should display "MediaGalleryControlComponent"
    And the media gallery control should be visible
    When I click the showcase button "btn-mode-view"
    Then the media gallery control should be visible
    When I click the showcase button "btn-mode-edit"
    Then the media gallery control should be visible`
};
