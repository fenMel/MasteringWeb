import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionFormationsComponent } from './gestion-formations.component';

describe('GestionFormationsComponent', () => {
  let component: GestionFormationsComponent;
  let fixture: ComponentFixture<GestionFormationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionFormationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionFormationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
