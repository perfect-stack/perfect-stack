import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '@perfect-stack/ngx-perfect-stack';
import { ToolType } from '@perfect-stack/ngx-perfect-stack';

// -------------------------------------------------------------------------
// CATEGORY: Media & Geospatial
// -------------------------------------------------------------------------
export const mapToolRegistration: ShowcaseItem = {
  id: 'map-tool',
  name: 'MapToolComponent',
  selector: '<lib-map-tool>',
  category: 'Media & Geospatial',
  description: 'Interactive ArcGIS and LINZ geospatial mapping tool. Renders location markers, drawing sketch layers, and reference GIS feature layers.',
  attribute: {
    name: 'map_location',
    label: 'Geospatial Map',
    description: 'Map location tool attribute',
    type: AttributeType.Text,
    visibility: VisibilityType.Optional,
    comparisonField: '',
    comparisonOperator: ComparisonOperator.Equals,
    relationshipTarget: '',
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
    attributeName: 'map_location',
    tool: {
      type: ToolType.Map,
      channel: 'map',
      containerStyles: '',
      styles: '',
      label: 'Clinic Location Map',
      modes: '',
      geometry: 'geometry',
      easting: 'easting',
      northing: 'northing',
      height: '300px'
    } as any
  },
  initialValue: 'Lower Hutt',
  samplePresets: [
    { label: 'Lower Hutt (-41.2, 174.9)', value: 'Lower Hutt' },
    { label: 'Wellington Central (-41.28, 174.77)', value: 'Wellington Central' },
    { label: 'Auckland (-36.85, 174.76)', value: 'Auckland' }
  ],
  docProperties: [
    { property: 'Tool Type', description: 'ToolType.Map' },
    { property: 'Base Maps', description: 'ArcGIS MapView with LINZ topographic layer or standard vector basemaps.' },
    { property: 'Coordinates Sync', description: 'Binds to easting/northing or GeoJSON geometry form controls.' },
    { property: 'Sketching', description: 'Interactive point and polygon drawing with Sketch widget.' }
  ],
  metaPageJson: {
    width: '12',
    height: '2',
    tool: {
      type: 'Map',
      channel: 'map',
      geometry: 'geometry',
      easting: 'easting',
      northing: 'northing',
      height: '300px'
    }
  },
  featurePath: '/assets/features/components/map-tool.feature',
  fallbackFeature: `Feature: Map Tool Component
  As a clinic coordinator or client
  I want an interactive GIS map displaying clinic location and coordinates
  So that geographical positions are accurately rendered and verified

  @showcase @map-tool
  Scenario: Display map tool in the Component Showcase
    When I navigate to "/showcase/map-tool"
    Then the showcase header should display "MapToolComponent"
    And the map tool component should be visible
    When I click the showcase button "btn-mode-view"
    Then the map tool component should be visible
    When I click the showcase button "btn-mode-edit"
    Then the map tool component should be visible`
};
