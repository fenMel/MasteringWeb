import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchiveDecisionComponent } from './archive-decision.component';

describe('ArchiveDecisionComponent', () => {
  let component: ArchiveDecisionComponent;
  let fixture: ComponentFixture<ArchiveDecisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchiveDecisionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArchiveDecisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
