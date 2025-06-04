import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjoutUtilisateursComponent } from './ajout-utilisateurs.component';

describe('AjoutUtilisateursComponent', () => {
  let component: AjoutUtilisateursComponent;
  let fixture: ComponentFixture<AjoutUtilisateursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjoutUtilisateursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjoutUtilisateursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
