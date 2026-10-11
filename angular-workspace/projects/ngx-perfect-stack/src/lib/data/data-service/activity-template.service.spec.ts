import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivityTemplateService } from './activity-template.service';
import { DataService } from './data.service';

describe('ActivityTemplateService', () => {
  let service: ActivityTemplateService;
  let mockDataService: jasmine.SpyObj<DataService>;

  beforeEach(() => {
    mockDataService = jasmine.createSpyObj<DataService>('DataService', ['findById']);

    TestBed.configureTestingModule({
      providers: [
        ActivityTemplateService,
        { provide: DataService, useValue: mockDataService },
      ],
    });

    service = TestBed.inject(ActivityTemplateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch from DataService when not in cache and cache the result', (done) => {
    const mockTemplate = { id: 'template-1', layout_style: 'Field', activity_template_name: 'Survey' };
    mockDataService.findById.and.returnValue(of(mockTemplate));

    service.getActivityTemplate('template-1').subscribe((res) => {
      expect(res).toEqual(mockTemplate);
      expect(mockDataService.findById).toHaveBeenCalledWith('ActivityTemplate', 'template-1');
      expect(service.getSynchronous('template-1')).toEqual(mockTemplate);

      // Second call should return from cache without calling DataService again
      service.getActivityTemplate('template-1').subscribe((cachedRes) => {
        expect(cachedRes).toEqual(mockTemplate);
        expect(mockDataService.findById).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  it('should clear cache', () => {
    const mockTemplate = { id: 'template-1', layout_style: 'Card' };
    mockDataService.findById.and.returnValue(of(mockTemplate));

    service.getActivityTemplate('template-1').subscribe();
    expect(service.getSynchronous('template-1')).toBeDefined();

    service.clearCache();
    expect(service.getSynchronous('template-1')).toBeUndefined();
  });
});
