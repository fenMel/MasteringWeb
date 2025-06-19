import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjoutSessionFormationComponent } from './ajout-session-formation.component';

describe('AjoutSessionFormationComponent', () => {
  let component: AjoutSessionFormationComponent;
  let fixture: ComponentFixture<AjoutSessionFormationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjoutSessionFormationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjoutSessionFormationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
