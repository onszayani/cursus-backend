import { Test, TestingModule } from '@nestjs/testing';
import { SupportCoursController } from './support-cours.controller';

describe('SupportCoursController', () => {
  let controller: SupportCoursController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportCoursController],
    }).compile();

    controller = module.get<SupportCoursController>(SupportCoursController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
