import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsentPage } from './consent.page';

describe('ConsentPage', () => {
  let component: ConsentPage;
  let fixture: ComponentFixture<ConsentPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(ConsentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
