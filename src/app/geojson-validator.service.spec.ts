import { TestBed } from '@angular/core/testing';

import { GeojsonValidatorService } from './geojson-validator.service';

describe('GeojsonValidatorService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GeojsonValidatorService = TestBed.get(GeojsonValidatorService);
    expect(service).toBeTruthy();
  });
});
