import { TestBed } from '@angular/core/testing';

import { TimeService } from './time.service';

describe('TimeService', () => {

  const test_date_time = '2022-08-24T18:01:11Z';
  const test_date = '2022-08-24';
  const test_time = '18:01:11';
  const test_empty = '';
  const test_invalid = 'xx';

  let service: TimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeService);
  });

  it('parse a DateTime value', () => {
    const result = service.parseDateTimeFormValue(test_date_time);
    expect(result.dateTime).toBeTruthy();
    expect(result.date).toBeTruthy();
    expect(result.time).toBeTruthy();
    expect(result.empty).toBeFalse();
  });

  it('parse a Date value', () => {
    const result = service.parseDateTimeFormValue(test_date);
    expect(result.dateTime).toBeFalsy();
    expect(result.date).toBeTruthy();
    expect(result.time).toBeFalsy();
    expect(result.empty).toBeFalse();
  });

  it('parse a Time value', () => {
    const result = service.parseDateTimeFormValue(test_time);
    expect(result.dateTime).toBeFalsy();
    expect(result.date).toBeFalsy();
    expect(result.time).toBeTruthy();
    expect(result.empty).toBeFalse();
  });

  it('parse an empty value', () => {
    const result = service.parseDateTimeFormValue(test_empty);
    expect(result.dateTime).toBeFalsy();
    expect(result.date).toBeFalsy();
    expect(result.time).toBeFalsy();
    expect(result.empty).toBeTrue();
  });

  it('parse an invalid value', () => {
    expect(() => service.parseDateTimeFormValue(test_invalid)).toThrowError();
  });
});
