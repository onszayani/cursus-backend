import { Test, TestingModule } from '@nestjs/testing';
import { ForumGateway } from './forum.gateway';

describe('ForumGateway', () => {
  let gateway: ForumGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ForumGateway],
    }).compile();

    gateway = module.get<ForumGateway>(ForumGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
