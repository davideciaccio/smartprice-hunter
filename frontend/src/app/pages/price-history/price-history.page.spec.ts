import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PriceHistoryPage } from './price-history.page';

describe('PriceHistoryPage', () => {
  let component: PriceHistoryPage;
  let fixture: ComponentFixture<PriceHistoryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PriceHistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
