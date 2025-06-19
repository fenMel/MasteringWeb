import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSessionFormationComponent } from './edit-session-formation.component';

describe('EditSessionFormationComponent', () => {
  let component: EditSessionFormationComponent;
  let fixture: ComponentFixture<EditSessionFormationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditSessionFormationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditSessionFormationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
