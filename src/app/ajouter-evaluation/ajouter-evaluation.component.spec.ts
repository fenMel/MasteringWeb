import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjouterEvaluationComponent } from './ajouter-evaluation.component';

describe('AjouterEvaluationComponent', () => {
  let component: AjouterEvaluationComponent;
  let fixture: ComponentFixture<AjouterEvaluationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjouterEvaluationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjouterEvaluationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
