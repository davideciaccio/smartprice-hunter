import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PriceComparisonPage } from './price-comparison.page';

describe('PriceComparisonPage', () => {
  let component: PriceComparisonPage;
  let fixture: ComponentFixture<PriceComparisonPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PriceComparisonPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
