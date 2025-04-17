import { TestBed } from '@angular/core/testing';

import { SessionsFormationService } from './sessions-formation.service';

describe('SessionsFormationService', () => {
  let service: SessionsFormationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionsFormationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
