import { TestBed } from '@angular/core/testing';

import { FinishGuard } from './finish.guard';

describe('FinishGuard', () => {
  let guard: FinishGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(FinishGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
