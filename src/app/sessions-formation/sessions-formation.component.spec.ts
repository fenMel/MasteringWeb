import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionsFormationComponent } from './sessions-formation.component';

describe('SessionsFormationComponent', () => {
  let component: SessionsFormationComponent;
  let fixture: ComponentFixture<SessionsFormationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionsFormationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionsFormationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
