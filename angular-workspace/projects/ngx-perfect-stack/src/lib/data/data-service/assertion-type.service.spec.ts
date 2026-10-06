import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AssertionTypeService } from './assertion-type.service';
import { DataService } from './data.service';
import { AssertionType, AssertionValueClass } from '../../domain/assertion';
import { PageQueryResponse } from '../../domain/response/page-query.response';

describe('AssertionTypeService', () => {
  let service: AssertionTypeService;
  let mockDataService: jasmine.SpyObj<DataService>;

  const mockTypes: AssertionType[] = [
    {
      id: '1',
      assertion_type_name: 'Weight',
      assertion_unit: 'kg',
      assertion_value_class: AssertionValueClass.Double,
      assertion_method: 'Scale',
    },
    {
      id: '2',
      assertion_type_name: 'Sex',
      assertion_unit: '',
      assertion_value_class: AssertionValueClass.Enumeration,
      assertion_value_enum_options: 'Male, Female, Unknown',
    },
  ];

  beforeEach(() => {
    mockDataService = jasmine.createSpyObj<DataService>('DataService', ['findAll']);

    TestBed.configureTestingModule({
      providers: [
        AssertionTypeService,
        { provide: DataService, useValue: mockDataService },
      ],
    });

    service = TestBed.inject(AssertionTypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load and cache assertion types lazily', (done) => {
    const pageResponse = new PageQueryResponse<any>();
    pageResponse.resultList = mockTypes;
    pageResponse.totalCount = mockTypes.length;

    mockDataService.findAll.and.returnValue(of(pageResponse));

    service.loadAssertionTypes().subscribe(types => {
      expect(types.length).toBe(2);
      expect(service.getAllAssertionTypes().length).toBe(2);
      expect(service.getAssertionType('1')?.assertion_type_name).toBe('Weight');
      expect(service.getAssertionType('2')?.assertion_type_name).toBe('Sex');
      expect(mockDataService.findAll).toHaveBeenCalledTimes(1);

      // Second call should return cached without triggering findAll again
      service.loadAssertionTypes().subscribe(cachedTypes => {
        expect(cachedTypes.length).toBe(2);
        expect(mockDataService.findAll).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  it('should clear cache and re-fetch when requested', (done) => {
    const pageResponse = new PageQueryResponse<any>();
    pageResponse.resultList = mockTypes;
    pageResponse.totalCount = mockTypes.length;

    mockDataService.findAll.and.returnValue(of(pageResponse));

    service.loadAssertionTypes().subscribe(() => {
      expect(service.getAllAssertionTypes().length).toBe(2);
      service.clearCache();
      expect(service.getAllAssertionTypes().length).toBe(0);
      expect(service.getAssertionType('1')).toBeUndefined();

      service.loadAssertionTypes().subscribe(reloaded => {
        expect(reloaded.length).toBe(2);
        expect(mockDataService.findAll).toHaveBeenCalledTimes(2);
        done();
      });
    });
  });
});
