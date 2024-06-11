import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DemographyPage } from './demography.page';

describe('DemographyPage', () => {
  let component: DemographyPage;
  let fixture: ComponentFixture<DemographyPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(DemographyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
