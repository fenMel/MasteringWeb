import { TestBed } from '@angular/core/testing';

import { ArchiveDecisionService } from './archive-decision.service';

describe('ArchiveDecisionService', () => {
  let service: ArchiveDecisionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArchiveDecisionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
