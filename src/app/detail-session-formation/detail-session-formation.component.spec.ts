import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailSessionFormationComponent } from './detail-session-formation.component';

describe('DetailSessionFormationComponent', () => {
  let component: DetailSessionFormationComponent;
  let fixture: ComponentFixture<DetailSessionFormationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailSessionFormationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailSessionFormationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
