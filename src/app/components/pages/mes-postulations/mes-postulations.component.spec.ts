import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('MesPostulationsComponent', () => {
  let component: MesPostulationsComponent;
  let fixture: ComponentFixture<MesPostulationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MesPostulationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesPostulationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});



import { MesPostulationsComponent } from './mes-postulations.component';

describe('MesPostulationsComponent', () => {
  let component: MesPostulationsComponent;
  let fixture: ComponentFixture<MesPostulationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MesPostulationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesPostulationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});




