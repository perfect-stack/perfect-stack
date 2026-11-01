import { ShowcaseItem } from '../showcase.model';
import { AttributeType, ComparisonOperator, VisibilityType } from '@perfect-stack/ngx-perfect-stack';

// -------------------------------------------------------------------------
// CATEGORY: Media & Geospatial
// -------------------------------------------------------------------------
export const geometryControlRegistration: ShowcaseItem = {
  id: 'geometry-control',
  name: 'GeometryControlComponent',
  selector: '<lib-geometry-control>',
  category: 'Media & Geospatial',
  description: 'GeoJSON coordinate and spatial geometry editor. Validates RFC 7946 GeoJSON types (Point, LineString, Polygon), normalizes property order, and synchronizes with mapping tools.',
  attribute: {
    name: 'geometry',
    label: 'Spatial Geometry',
    description: 'GeoJSON spatial geometry',
    type: AttributeType.Geometry,
    visibility: VisibilityType.Visible,
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
    attributeName: 'geometry',
    component: 'Geometry',
  },
  initialValue: '{"type": "Point", "coordinates": [175.0, -41.0]}',
  samplePresets: [
    { label: 'Point', value: '{"type": "Point", "coordinates": [174.7762, -41.2865]}' },
    { label: 'Polygon', value: '{"type": "Polygon", "coordinates": [[[174.7, -41.2], [174.8, -41.2], [174.8, -41.3], [174.7, -41.3], [174.7, -41.2]]]}' },
    { label: 'LineString', value: '{"type": "LineString", "coordinates": [[174.7, -41.2], [174.8, -41.3]]}' },
    { label: 'Clear', value: '' }
  ],
  docProperties: [
    { property: 'Supported Type', description: 'AttributeType.Geometry' },
    { property: 'GeoJSON Validation', description: 'Enforces valid RFC 7946 types (Point, LineString, Polygon, MultiPolygon).' },
    { property: 'Normalization', description: 'Orders "type" first and strips deprecated legacy "crs" fields.' },
    { property: 'Map Integration', description: 'Binds bidirectionally with MapToolComponent sketch and marker updates.' }
  ],
  metaPageJson: {
    width: '12',
    height: '2',
    attributeName: 'geometry',
    component: 'Geometry'
  },
  featurePath: '/assets/features/components/geometry-control.feature',
  fallbackFeature: `Feature: Geometry Control Component
  As a spatial data user or technician
  I want a GeoJSON input control with live syntax and coordinate validation
  So that GIS features and clinic coordinates are stored accurately

  @showcase @geometry-control
  Scenario: Display and edit GeoJSON geometry
    When I navigate to "/showcase/geometry-control"
    Then the showcase header should display "GeometryControlComponent"
    And the geometry control textarea should contain "Point"
    When I click the showcase button "btn-mode-view"
    Then the geometry control should be visible
    When I click the showcase button "btn-mode-edit"
    Then the geometry control textarea should contain "Point"`
};
