import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidatDecisionComponent } from './candidat-decision.component';

describe('CandidatDecisionComponent', () => {
  let component: CandidatDecisionComponent;
  let fixture: ComponentFixture<CandidatDecisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidatDecisionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidatDecisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
