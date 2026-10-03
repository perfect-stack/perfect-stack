import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FormControl, FormGroup, UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { DefaultMediaDataProvider } from './default-media-data-provider.service';
import { STACK_CONFIG } from '../../../../ngx-perfect-stack-config';
import { CellAttribute } from '../../../../meta/page/meta-page-service/meta-page.service';
import { MediaItem } from './media-data-provider';

describe('DefaultMediaDataProvider', () => {
  let service: DefaultMediaDataProvider;
  let httpMock: HttpTestingController;

  const mockConfig = {
    apiUrl: 'http://api.test',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DefaultMediaDataProvider,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: STACK_CONFIG, useValue: mockConfig },
      ],
    });

    service = TestBed.inject(DefaultMediaDataProvider);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should return empty result if no formGroup or attribute provided', (done) => {
    const cell = new CellAttribute();
    service.loadMedia(null, cell, { pageNumber: 1, pageSize: 10 }, null).subscribe((res) => {
      expect(res.totalCount).toBe(0);
      expect(res.items.length).toBe(0);
      done();
    });
  });

  it('should load and paginate items from formGroup UntypedFormArray', (done) => {
    const cell: CellAttribute = {
      width: '12',
      height: '4',
      attribute: { name: 'media_files' } as any,
    };

    const mediaArray = new UntypedFormArray([
      new UntypedFormGroup({
        id: new FormControl('1'),
        path: new FormControl('path/to/img1.jpg'),
        comments: new FormControl('First image'),
        mime_type: new FormControl('image/jpeg'),
      }),
      new UntypedFormGroup({
        id: new FormControl('2'),
        path: new FormControl('path/to/img2.jpg'),
        comments: new FormControl('Second image'),
        mime_type: new FormControl('image/jpeg'),
      }),
      new UntypedFormGroup({
        id: new FormControl('3'),
        path: new FormControl('path/to/img3.jpg'),
        comments: new FormControl('Third image'),
        mime_type: new FormControl('image/jpeg'),
      }),
    ]);

    const formGroup = new FormGroup({
      media_files: mediaArray,
    });

    // Page 1, pageSize 2
    service.loadMedia(null, cell, { pageNumber: 1, pageSize: 2 }, formGroup).subscribe((res) => {
      expect(res.totalCount).toBe(3);
      expect(res.items.length).toBe(2);
      expect(res.items[0].id).toBe('1');
      expect(res.items[0].path).toBe('path/to/img1.jpg');
      expect(res.items[0].comments).toBe('First image');
      expect(res.items[1].id).toBe('2');

      // Page 2, pageSize 2
      service.loadMedia(null, cell, { pageNumber: 2, pageSize: 2 }, formGroup).subscribe((res2) => {
        expect(res2.totalCount).toBe(3);
        expect(res2.items.length).toBe(1);
        expect(res2.items[0].id).toBe('3');
        done();
      });
    });
  });

  it('should resolve URL by calling locate and download endpoints', (done) => {
    const item: MediaItem = {
      id: '123',
      path: 'uploads/photo.jpg',
    };

    service.resolveUrl(item, null, new CellAttribute()).subscribe((safeUrl) => {
      expect(safeUrl).toBeTruthy();
      done();
    });

    const locateReq = httpMock.expectOne('http://api.test/media/locate/uploads/photo.jpg');
    expect(locateReq.request.method).toBe('GET');
    locateReq.flush('/download/photo.jpg');

    const dlReq = httpMock.expectOne('http://api.test/media/download/photo.jpg');
    expect(dlReq.request.method).toBe('GET');
    dlReq.flush(new Blob(['test'], { type: 'image/jpeg' }));
  });
});
