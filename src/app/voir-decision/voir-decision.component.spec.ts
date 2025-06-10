import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoirDecisionComponent } from './voir-decision.component';

describe('VoirDecisionComponent', () => {
  let component: VoirDecisionComponent;
  let fixture: ComponentFixture<VoirDecisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoirDecisionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoirDecisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
