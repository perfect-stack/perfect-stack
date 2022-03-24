import { TestBed } from '@angular/core/testing';

import { NgxPerfectStackService } from './ngx-perfect-stack.service';

describe('NgxPerfectStackService', () => {
  let service: NgxPerfectStackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxPerfectStackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
