import { TestBed } from '@angular/core/testing';

import { DocumentIdentiteService } from './document-identite.service';

describe('DocumentIdentiteService', () => {
  let service: DocumentIdentiteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentIdentiteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
