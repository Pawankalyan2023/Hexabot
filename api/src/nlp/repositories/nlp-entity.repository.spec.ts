/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { nlpEntityFixtures } from '@/utils/test/fixtures/nlpentity';
import { installNlpValueFixtures } from '@/utils/test/fixtures/nlpvalue';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { NlpEntityRepository } from './nlp-entity.repository';
import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';
import { NlpValueRepository } from './nlp-value.repository';
import { NlpEntityModel, NlpEntity } from '../schemas/nlp-entity.schema';
import { NlpSampleEntityModel } from '../schemas/nlp-sample-entity.schema';
import { NlpValueModel } from '../schemas/nlp-value.schema';

describe('NlpEntityRepository', () => {
  let nlpEntityRepository: NlpEntityRepository;
  let nlpValueRepository: NlpValueRepository;
  let firstNameNlpEntity: NlpEntity;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installNlpValueFixtures),
        MongooseModule.forFeature([
          NlpEntityModel,
          NlpValueModel,
          NlpSampleEntityModel,
        ]),
      ],
      providers: [
        NlpEntityRepository,
        NlpValueRepository,
        NlpSampleEntityRepository,
        EventEmitter2,
      ],
    }).compile();
    nlpEntityRepository = module.get<NlpEntityRepository>(NlpEntityRepository);
    nlpValueRepository = module.get<NlpValueRepository>(NlpValueRepository);
    firstNameNlpEntity = await nlpEntityRepository.findOne({
      name: 'first_name',
    });
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  afterEach(jest.clearAllMocks);

  describe('The deleteCascadeOne function', () => {
    it('should delete a nlp entity', async () => {
      const intentNlpEntity = await nlpEntityRepository.findOne({
        name: 'intent',
      });
      const result = await nlpEntityRepository.deleteOne(intentNlpEntity.id);

      expect(result.deletedCount).toEqual(1);

      const intentNlpValues = await nlpValueRepository.find({
        entity: intentNlpEntity.id,
      });

      expect(intentNlpValues.length).toEqual(0);
    });
  });

  describe('findOneAndPopulate', () => {
    it('should return a nlp entity with populate', async () => {
      const firstNameValues = await nlpValueRepository.find({
        entity: firstNameNlpEntity.id,
      });
      const result = await nlpEntityRepository.findOneAndPopulate(
        firstNameNlpEntity.id,
      );
      expect(result).toEqualPayload({
        ...nlpEntityFixtures[1],
        values: firstNameValues,
      });
    });
  });

  describe('findPageAndPopulate', () => {
    it('should return all nlp entities with populate', async () => {
      const pageQuery = getPageQuery<NlpEntity>({
        sort: ['name', 'desc'],
      });
      const firstNameValues = await nlpValueRepository.find({
        entity: firstNameNlpEntity.id,
      });
      const result = await nlpEntityRepository.findPageAndPopulate(
        { _id: firstNameNlpEntity.id },
        pageQuery,
      );
      expect(result).toEqualPayload([
        {
          id: firstNameNlpEntity.id,
          ...nlpEntityFixtures[1],
          values: firstNameValues,
        },
      ]);
    });
  });
});