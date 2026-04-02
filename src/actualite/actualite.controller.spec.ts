import { Test, TestingModule } from '@nestjs/testing';
import { ActualiteController } from './actualite.controller';

describe('ActualiteController', () => {
  let controller: ActualiteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActualiteController],
    }).compile();

    controller = module.get<ActualiteController>(ActualiteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
