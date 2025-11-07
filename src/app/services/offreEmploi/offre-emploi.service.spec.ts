import { TestBed } from '@angular/core/testing';

import { OffreEmploiService } from './offre-emploi.service';

describe('OffreEmploiService', () => {
  let service: OffreEmploiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OffreEmploiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
