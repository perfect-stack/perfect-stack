import '@angular/localize/init';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaGalleryControlComponent } from './media-gallery-control.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { STACK_CONFIG } from '../../../../../ngx-perfect-stack-config';
import { MetaEntityService } from '../../../../../meta/entity/meta-entity-service/meta-entity.service';
import { MetaPageService } from '../../../../../meta/page/meta-page-service/meta-page.service';
import { FormService } from '../../../../data-edit/form-service/form.service';
import { FormGroupService } from '../../../../data-edit/form-service/form-group.service';
import { DefaultMediaDataProvider } from '../default-media-data-provider.service';
import { MediaDataProvider, MediaPageQuery } from '../media-data-provider';
import { of } from 'rxjs';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';

class MockCustomMediaProvider implements MediaDataProvider {
  lastQuery: MediaPageQuery | null = null;

  loadMedia(ctx: any, cell: any, query: MediaPageQuery, formGroup: any) {
    this.lastQuery = query;
    return of({
      totalCount: 15,
      items: [
        { id: 'item-1', url: 'https://example.com/img1.jpg', comments: 'Custom img 1' },
        { id: 'item-2', url: 'https://example.com/img2.jpg', comments: 'Custom img 2' },
      ],
    });
  }

  resolveUrl(item: any) {
    return of(item.url);
  }
}

describe('MediaGalleryControlComponent', () => {
  let component: MediaGalleryControlComponent;
  let fixture: ComponentFixture<MediaGalleryControlComponent>;
  let mockCustomProvider: MockCustomMediaProvider;

  beforeEach(async () => {
    mockCustomProvider = new MockCustomMediaProvider();

    await TestBed.configureTestingModule({
      declarations: [MediaGalleryControlComponent],
      imports: [NgbPaginationModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DefaultMediaDataProvider,
        { provide: STACK_CONFIG, useValue: { apiUrl: 'http://test' } },
        { provide: MetaEntityService, useValue: { metaEntityMap$: of(new Map()) } },
        { provide: MetaPageService, useValue: { metaPageMap$: of(new Map()) } },
        { provide: FormService, useValue: {} },
        { provide: FormGroupService, useValue: {} },
        { provide: 'CustomTestMediaProvider', useValue: mockCustomProvider },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaGalleryControlComponent);
    component = fixture.componentInstance;
  });

  it('should fall back to DefaultMediaDataProvider when cell.dataProvider is not set', () => {
    component.cell = {
      width: '12',
      height: '4',
      media_cols: '2',
      media_rows: '2',
      attribute: { name: 'media_files' } as any,
    };
    component.formGroup = new FormGroup({
      media_files: new FormArray([
        new FormGroup({
          id: new FormControl('1'),
          path: new FormControl('path1.jpg'),
        }),
      ]),
    });

    component.loadPage(1);

    expect(component.totalItems).toBe(1);
    expect(component.pageItems.length).toBe(1);
    expect(component.pageItems[0].path).toBe('path1.jpg');
  });

  it('should use custom MediaDataProvider when cell.dataProvider is specified', () => {
    component.cell = {
      width: '12',
      height: '4',
      media_cols: '3',
      media_rows: '2',
      dataProvider: 'CustomTestMediaProvider',
    };

    component.loadPage(1);

    expect(mockCustomProvider.lastQuery).toEqual({ pageNumber: 1, pageSize: 6 });
    expect(component.totalItems).toBe(15);
    expect(component.pageItems.length).toBe(2);
    expect(component.pageItems[0].id).toBe('item-1');
    expect(component.pageItems[0].comments).toBe('Custom img 1');
    expect(component.pageItems[0].imageSrc).toBe('https://example.com/img1.jpg');
  });

  it('should request correct page when loadPage is called', () => {
    component.cell = {
      width: '12',
      height: '4',
      media_cols: '2',
      media_rows: '2',
      dataProvider: 'CustomTestMediaProvider',
    };

    component.loadPage(3);

    expect(mockCustomProvider.lastQuery).toEqual({ pageNumber: 3, pageSize: 4 });
  });
});
