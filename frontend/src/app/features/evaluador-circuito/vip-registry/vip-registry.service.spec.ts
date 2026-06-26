import { TestBed } from '@angular/core/testing';

import { VipRegistry } from './vip-registry';

describe('VipRegistry', () => {
  let service: VipRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VipRegistry);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
