import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import PictureMarkerSymbol from '@arcgis/core/symbols/PictureMarkerSymbol';
import { of } from 'rxjs';
import { AttributeType, MetaEntity } from '../../../../../domain/meta.entity';
import { PropertySheetService } from '../../../../../template/property-sheet/property-sheet.service';
import { FormContext, FormControlWithAttribute } from '../../../../data-edit/form-service/form.service';
import { TypeaheadService } from '../../controls/many-to-one-control/typeahead.service';
import { MapAttributionService } from './map-attribution.service';
import { MapEditCoordinatorService } from './map-edit-coordinator.service';
import { MapPreferencesService } from './map-preferences.service';
import {
  CLUSTER_PILL_ACTIVE_COLOR,
  CLUSTER_PILL_COLOR,
  MapToolComponent,
  OCCURRENCE_SPIDERFY_LIMIT,
} from './map-tool.component';
import { MapService } from './map.service';

describe('MapToolComponent (Occurrence Clustering & Popover)', () => {
  let component: MapToolComponent;
  let fixture: ComponentFixture<MapToolComponent>;
  let mapCoordinator: MapEditCoordinatorService;
  let mockTypeaheadService: jasmine.SpyObj<TypeaheadService>;
  let mockMapService: Partial<MapService>;

  const createOccurrenceMetaEntity = (): MetaEntity =>
    ({
      name: 'Occurrence',
      pluralName: 'Occurrences',
      icon: '',
      type: 'Database' as any,
      rootNode: true,
      treeNode: false,
      timestamps: true,
      cacheExpiryInSecs: 0,
      permanentDelete: true,
      attributes: [
        {
          name: 'taxon',
          label: 'Taxon',
          description: '',
          unitOfMeasure: '',
          scale: '',
          type: AttributeType.ManyToOne,
          visibility: 'Visible' as any,
          comparisonField: '',
          comparisonOperator: 'Equals' as any,
          relationshipTarget: 'Taxon',
          typeaheadSearch: ['canonical_name'],
          rules: [],
        },
        {
          name: 'geometry',
          label: 'Geometry',
          description: '',
          unitOfMeasure: '',
          scale: '',
          type: AttributeType.Geometry,
          visibility: 'Visible' as any,
          comparisonField: '',
          comparisonOperator: '' as any,
          relationshipTarget: '',
          typeaheadSearch: [],
          rules: [],
        },
      ],
    }) as unknown as MetaEntity;

  const createContextWithOccurrences = (
    count: number,
    options: {
      distinctCoords?: boolean;
      eventPoint?: [number, number] | null;
      taxonIds?: string[];
      useManyToOneAttr?: boolean;
    } = {},
  ): FormContext => {
    const occMeta = createOccurrenceMetaEntity();
    const taxonAttr = occMeta.attributes[0];
    const baseLng = 174.7762;
    const baseLat = -41.2865;

    const occControls = Array.from({ length: count }, (_, idx) => {
      const coords: [number, number] = options.distinctCoords
        ? [baseLng + idx * 0.01, baseLat + idx * 0.01]
        : [baseLng, baseLat];
      const taxonId = options.taxonIds
        ? options.taxonIds[idx % options.taxonIds.length]
        : `taxon-${idx % 3}`;

      const taxonCtrl = new FormControlWithAttribute(taxonId);
      if (options.useManyToOneAttr !== false) {
        taxonCtrl.attribute = taxonAttr;
      }

      const fg: any = new UntypedFormGroup({
        geometry: new UntypedFormControl({ type: 'Point', coordinates: coords }),
        centerpoint: new UntypedFormControl({ type: 'Point', coordinates: coords }),
        record_number: new UntypedFormControl(`REC-${idx + 1}`),
        taxon_id: taxonCtrl,
      });
      fg.metaEntity = occMeta;
      return fg;
    });

    const occArray = new UntypedFormArray(occControls);
    const eventCoords = options.eventPoint === undefined ? [baseLng, baseLat] : options.eventPoint;
    const locationForm = new UntypedFormGroup({
      geometry: new UntypedFormControl(
        eventCoords ? { type: 'Point', coordinates: eventCoords } : null,
      ),
      centerpoint: new UntypedFormControl(
        eventCoords ? { type: 'Point', coordinates: eventCoords } : null,
      ),
    });

    const captureEventForm = new UntypedFormGroup({
      location: locationForm,
      occurrences: occArray,
    });

    const ctx = new FormContext();
    ctx.mode = 'view';
    ctx.metaName = 'CaptureEvent';
    ctx.metaEntityMap = new Map<string, MetaEntity>([['Occurrence', occMeta]]);
    ctx.formMap = new Map<string, any>([
      ['capture_event', captureEventForm],
      ['capture_event.location', locationForm],
    ]);
    return ctx;
  };

  const attachMockMapLayers = (comp: MapToolComponent) => {
    comp.leaderGraphicsLayer = new GraphicsLayer({ id: 'leader-test' });
    comp.eventGraphicsLayer = new GraphicsLayer({ id: 'event-test' });
    comp.occurrenceGraphicsLayer = new GraphicsLayer({ id: 'occ-test' });
    comp.activeEditLayer = new GraphicsLayer({ id: 'edit-test' });

    const scale = 1000;
    const toScreenSpy = jasmine.createSpy('toScreen').and.callFake((pt: any) => ({
      x: 400 + (pt.x - 1748000) / scale,
      y: 300 - (pt.y - 5427000) / scale,
    }));
    const toMapSpy = jasmine.createSpy('toMap').and.callFake((screenPt: any) => ({
      type: 'point',
      x: 1748000 + (screenPt.x - 400) * scale,
      y: 5427000 - (screenPt.y - 300) * scale,
      spatialReference: { wkid: 2193 },
    }));

    comp.mapView = {
      ready: true,
      extent: { xmin: 0, ymin: 0, xmax: 100, ymax: 100 },
      toScreen: toScreenSpy,
      toMap: toMapSpy,
      goTo: jasmine.createSpy('goTo').and.resolveTo(),
      hitTest: jasmine.createSpy('hitTest').and.resolveTo({ results: [] }),
      destroy: jasmine.createSpy('destroy'),
    } as any;

    return { toScreenSpy, toMapSpy };
  };

  beforeEach(async () => {
    mapCoordinator = new MapEditCoordinatorService();
    mockTypeaheadService = jasmine.createSpyObj<TypeaheadService>('TypeaheadService', [
      'searchByIdList',
    ]);
    mockTypeaheadService.searchByIdList.and.returnValue(of([]));

    mockMapService = {
      toNZTM: ({ lat, lng }: { lat: number; lng: number }) => ({
        easting: 1748000 + (lng - 174.7762) * 80000,
        northing: 5427000 + (lat + 41.2865) * 110000,
      }),
      toLatLng: ({ easting, northing }: { easting: number; northing: number }) => ({
        lng: 174.7762 + (easting - 1748000) / 80000,
        lat: -41.2865 + (northing - 5427000) / 110000,
      }),
      isWithinNztmBounds: () => true,
      calculateLineMidpoint: () => null,
    };

    await TestBed.configureTestingModule({
      declarations: [MapToolComponent],
      imports: [CommonModule],
      providers: [
        { provide: MapService, useValue: mockMapService },
        {
          provide: PropertySheetService,
          useValue: jasmine.createSpyObj('PropertySheetService', ['edit']),
        },
        {
          provide: MapAttributionService,
          useValue: jasmine.createSpyObj('MapAttributionService', [
            'setAttribution',
            'clearAttribution',
          ]),
        },
        {
          provide: Router,
          useValue: jasmine.createSpyObj('Router', ['navigateByUrl']),
        },
        { provide: MapEditCoordinatorService, useValue: mapCoordinator },
        {
          provide: MapPreferencesService,
          useValue: {
            getBasemap: () => 'topo',
            setBasemap: () => {},
            getSizeMode: () => 'small',
            setSizeMode: () => {},
            getReferenceLayerVisibility: () => undefined,
            setReferenceLayerVisible: () => {},
          },
        },
        { provide: TypeaheadService, useValue: mockTypeaheadService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MapToolComponent);
    component = fixture.componentInstance;
    spyOn<any>(component, 'initMap').and.stub();
    spyOn<any>(component, 'zoomToGraphics').and.stub();
  });

  it(`keeps radial spiderfy fan-out when cluster has <= ${OCCURRENCE_SPIDERFY_LIMIT} items`, () => {
    component.ctx = createContextWithOccurrences(6);
    fixture.detectChanges();
    attachMockMapLayers(component);

    component.renderAllFeatures(false);

    const graphics = component.occurrenceGraphicsLayer!.graphics.toArray();
    const clusterPills = graphics.filter(
      (g) => g.attributes?.targetKind === 'occurrenceCluster',
    );
    const occBadges = graphics.filter(
      (g) => g.attributes?.targetKind === 'occurrence' && g.symbol?.type === 'text',
    );

    expect(component.hasCollapsedClusters).toBeFalse();
    expect(clusterPills.length).toBe(0);
    expect(occBadges.length).toBe(6);
  });

  it(`collapses > ${OCCURRENCE_SPIDERFY_LIMIT} coincident occurrences into a single xN rounded pill with matching 10pt label font and only calls toScreen once per unique coordinate`, () => {
    component.ctx = createContextWithOccurrences(323, { eventPoint: null });
    fixture.detectChanges();
    const { toScreenSpy } = attachMockMapLayers(component);

    component.renderAllFeatures(false);
    fixture.detectChanges();

    // All 323 share identical coordinates -> exactly 1 toScreen projection call!
    expect(toScreenSpy).toHaveBeenCalledTimes(1);
    expect(component.hasCollapsedClusters).toBeTrue();

    const graphics = component.occurrenceGraphicsLayer!.graphics.toArray();
    const clusterGraphics = graphics.filter((g) => g.attributes?.targetKind === 'occurrenceCluster');
    const pillShapes = clusterGraphics.filter((g) => g.symbol?.type === 'picture-marker');
    const pillTexts = clusterGraphics.filter((g) => g.symbol?.type === 'text');
    expect(pillShapes.length).toBe(1);
    expect(pillTexts.length).toBe(1);
    expect(pillShapes[0].attributes.clusterIndices.length).toBe(323);

    const symbol = pillShapes[0].symbol as PictureMarkerSymbol;
    expect(symbol.type).toBe('picture-marker');
    const decodedSvg = decodeURIComponent(symbol.url || '');
    expect(decodedSvg).toContain(CLUSTER_PILL_COLOR);

    const textSymbol = pillTexts[0].symbol as any;
    expect(textSymbol.text).toBe('x323');
    expect(textSymbol.font?.size).toBe(10);

    const legendCluster = fixture.nativeElement.querySelector('[data-testid="legend-cluster-item"]');
    expect(legendCluster).toBeTruthy();
  });

  it('offsets the xN pill with clear separation and draws the dotted leader line in leaderGraphicsLayer below symbols', () => {
    component.ctx = createContextWithOccurrences(25);
    fixture.detectChanges();
    const { toScreenSpy } = attachMockMapLayers(component);

    component.renderAllFeatures(false);

    // 1 unique occurrence coordinate + 1 Event anchor coordinate
    expect(toScreenSpy).toHaveBeenCalledTimes(2);

    const occGraphics = component.occurrenceGraphicsLayer!.graphics.toArray();
    const leaderGraphics = component.leaderGraphicsLayer!.graphics.toArray();
    const leaderLine = leaderGraphics.find(
      (g) => g.attributes?.targetKind === 'occurrenceCluster' && g.geometry?.type === 'polyline',
    );
    const pill = occGraphics.find(
      (g) => g.attributes?.targetKind === 'occurrenceCluster' && g.symbol?.type === 'picture-marker',
    );

    expect(leaderLine).toBeTruthy();
    expect(occGraphics.some((g) => g.geometry?.type === 'polyline')).toBeFalse();
    expect(pill).toBeTruthy();
    // Event is at x=1748000, y=5427000; compact cluster pill offset (~30% shorter than previous 70px) preserves clear visible leader length
    const dxPx = ((pill!.geometry as any).x - 1748000) / 1000;
    const dyPx = ((pill!.geometry as any).y - 5427000) / 1000;
    expect(dxPx).toBeGreaterThan(35);
    expect(dyPx).toBeGreaterThan(24);
    expect(Math.hypot(dxPx, dyPx)).toBeGreaterThan(44);
    expect(Math.hypot(dxPx, dyPx)).toBeLessThan(56);
  });

  it('pops out the active or hovered #N badge in magenta on top of a collapsed cluster', () => {
    component.ctx = createContextWithOccurrences(20);
    fixture.detectChanges();
    attachMockMapLayers(component);

    mapCoordinator.setHoveredTarget({ kind: 'occurrence', index: 4 });
    component.renderAllFeatures(false);

    const graphics = component.occurrenceGraphicsLayer!.graphics.toArray();
    const pill = graphics.find(
      (g) => g.attributes?.targetKind === 'occurrenceCluster' && g.symbol?.type === 'picture-marker',
    );
    const poppedBadges = graphics.filter(
      (g) => g.attributes?.targetKind === 'occurrence' && g.attributes?.occurrenceIndex === 4,
    );
    const poppedText = poppedBadges.find((g) => g.symbol?.type === 'text');
    const poppedCircle = poppedBadges.find((g) => g.symbol?.type === 'simple-marker');

    expect(pill).toBeTruthy();
    expect((poppedText?.symbol as any)?.text).toBe('5');
    expect((poppedCircle?.symbol as any)?.color?.toHex?.()).toBe(CLUSTER_PILL_ACTIVE_COLOR);
  });

  it('opens click-to-list cluster popover without calling focusCard when clicking xN pill, and chunks TypeaheadService.searchByIdList queries by 20', async () => {
    const manyTaxonIds = Array.from({ length: 25 }, (_, i) => `tax-${i + 1}`);
    mockTypeaheadService.searchByIdList.and.callFake((idList) =>
      of(idList.map((id) => ({ id, displayText: `Species ${id}` }))),
    );

    component.ctx = createContextWithOccurrences(323, { taxonIds: manyTaxonIds });
    fixture.detectChanges();
    attachMockMapLayers(component);
    component.renderAllFeatures(false);

    const pill = component.occurrenceGraphicsLayer!.graphics
      .toArray()
      .find((g) => g.attributes?.targetKind === 'occurrenceCluster' && g.symbol?.type === 'picture-marker')!;

    (component.mapView!.hitTest as jasmine.Spy).and.resolveTo({
      results: [{ type: 'graphic', graphic: pill }],
    });
    const focusCardSpy = jasmine.createSpy('focusCard');
    const sub = mapCoordinator.focusCard$.subscribe(focusCardSpy);

    component.onMapClick({ mapPoint: { x: 0, y: 0 } });
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    expect(focusCardSpy).not.toHaveBeenCalled();
    expect(component.clusterPopover).toBeTruthy();
    expect(component.clusterPopover!.totalCount).toBe(323);
    expect(component.clusterPopover!.speciesGroups.length).toBe(25);
    // 25 unique IDs chunked at 20 -> 2 HTTP calls
    expect(mockTypeaheadService.searchByIdList).toHaveBeenCalledTimes(2);
    expect(mockTypeaheadService.searchByIdList.calls.argsFor(0)[0].length).toBe(20);
    expect(mockTypeaheadService.searchByIdList.calls.argsFor(1)[0].length).toBe(5);

    // Popover DOM shows counts & pill turns magenta while popover is open
    const popoverEl: HTMLElement = fixture.nativeElement.querySelector('[data-testid="cluster-popover"]');
    expect(popoverEl).toBeTruthy();
    const activePill = component.occurrenceGraphicsLayer!.graphics
      .toArray()
      .find((g) => g.attributes?.targetKind === 'occurrenceCluster' && g.symbol?.type === 'picture-marker')!;
    expect(decodeURIComponent((activePill.symbol as PictureMarkerSymbol).url || '')).toContain(
      CLUSTER_PILL_ACTIVE_COLOR,
    );

    // Selecting a species switches to All Occurrences filtered to that species
    const firstSpeciesBtn = popoverEl.querySelector('[data-testid="cluster-species-row"]') as HTMLButtonElement;
    firstSpeciesBtn.click();
    fixture.detectChanges();

    expect(component.clusterPopover!.activeTab).toBe('items');
    expect(component.clusterPopover!.selectedTaxonFilter).toBeTruthy();

    // Selecting an occurrence item delegates to mapCoordinator.focusCard(index)
    const firstItemBtn = popoverEl.querySelector('[data-testid="cluster-item-row"]') as HTMLButtonElement;
    firstItemBtn.click();
    fixture.detectChanges();
    expect(focusCardSpy).toHaveBeenCalledTimes(1);

    // Switching back to full list shows max 100 items initially + "Show more" button
    component.clearClusterTaxonFilter();
    fixture.detectChanges();
    expect(popoverEl.querySelectorAll('[data-testid="cluster-item-row"]').length).toBe(100);
    const showMoreBtn = popoverEl.querySelector('[data-testid="cluster-show-more-btn"]') as HTMLButtonElement;
    expect(showMoreBtn).toBeTruthy();
    expect(showMoreBtn.textContent).toContain('223 remaining');

    // Hovering a row in the popover highlights #13 on the map in magenta
    component.onClusterPopoverHoverItem(12);
    fixture.detectChanges();
    const hoveredBadge = component.occurrenceGraphicsLayer!.graphics
      .toArray()
      .find(
        (g) =>
          g.attributes?.targetKind === 'occurrence' &&
          g.attributes?.occurrenceIndex === 12 &&
          g.symbol?.type === 'text',
      );
    expect((hoveredBadge?.symbol as any)?.text).toBe('13');

    // Text filter matches by record number or #displayIndex
    component.setClusterPopoverFilter('REC-123');
    fixture.detectChanges();
    const filteredRows = popoverEl.querySelectorAll('[data-testid="cluster-item-row"]');
    expect(filteredRows.length).toBe(1);
    expect(filteredRows[0].textContent).toContain('#123');

    // Escape closes popover
    component.onWindowKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(component.clusterPopover).toBeNull();

    sub.unsubscribe();
  });
});
