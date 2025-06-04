import { TestBed } from '@angular/core/testing';

import { GestionFormationService } from './gestion-formation.service';

describe('GestionFormationService', () => {
  let service: GestionFormationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestionFormationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
