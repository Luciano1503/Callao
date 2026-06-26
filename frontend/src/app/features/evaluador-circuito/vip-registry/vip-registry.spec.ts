import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VipRegistry } from './vip-registry';

describe('VipRegistry', () => {
  let component: VipRegistry;
  let fixture: ComponentFixture<VipRegistry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VipRegistry],
    }).compileComponents();

    fixture = TestBed.createComponent(VipRegistry);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
