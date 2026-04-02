import { Test, TestingModule } from '@nestjs/testing';
import { SupportCoursService } from './support-cours.service';

describe('SupportCoursService', () => {
  let service: SupportCoursService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupportCoursService],
    }).compile();

    service = module.get<SupportCoursService>(SupportCoursService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
