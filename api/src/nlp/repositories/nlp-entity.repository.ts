/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Query, TFilterQuery, Types } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';

import { NlpSampleEntityRepository } from './nlp-sample-entity.repository';
import { NlpValueRepository } from './nlp-value.repository';
import { NlpEntity, NlpEntityFull } from '../schemas/nlp-entity.schema';

@Injectable()
export class NlpEntityRepository extends BaseRepository<NlpEntity, 'values'> {
  constructor(
    @InjectModel(NlpEntity.name) readonly model: Model<NlpEntity>,
    private readonly nlpValueRepository: NlpValueRepository,
    private readonly nlpSampleEntityRepository: NlpSampleEntityRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(model, NlpEntity);
  }

  /**
   * Post-create hook that triggers after an NLP entity is created.
   * Emits an event to notify other parts of the system about the creation.
   * Bypasses built-in entities.
   *
   * @param created - The newly created NLP entity document.
   */
  async postCreate(
    _created: Document<unknown, object, NlpEntity> &
      NlpEntity & { _id: Types.ObjectId },
  ): Promise<void> {
    if (!_created.builtin) {
      // Bypass builtin entities (probably fixtures)
      this.eventEmitter.emit('hook:nlp:entity:create', _created);
    }
  }

  /**
   * Post-update hook that triggers after an NLP entity is updated.
   * Emits an event to notify other parts of the system about the update.
   * Bypasses built-in entities.
   *
   * @param query - The query used to find and update the entity.
   * @param updated - The updated NLP entity document.
   */
  async postUpdate(
    _query: Query<
      Document<NlpEntity, any, any>,
      Document<NlpEntity, any, any>,
      unknown,
      NlpEntity,
      'findOneAndUpdate'
    >,
    updated: NlpEntity,
  ): Promise<void> {
    if (!updated?.builtin) {
      // Bypass builtin entities (probably fixtures)
      this.eventEmitter.emit('hook:nlp:entity:update', updated);
    }
  }

  /**
   * Pre-delete hook that triggers before an NLP entity is deleted.
   * Deletes related NLP values and sample entities before the entity deletion.
   * Emits an event to notify other parts of the system about the deletion.
   * Bypasses built-in entities.
   *
   * @param query The query used to delete the entity.
   * @param criteria The filter criteria used to find the entity for deletion.
   */
  async preDelete(
    _query: Query<
      DeleteResult,
      Document<NlpEntity, any, any>,
      unknown,
      NlpEntity,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<NlpEntity>,
  ): Promise<void> {
    if (criteria._id) {
      await this.nlpValueRepository.deleteMany({ entity: criteria._id });
      await this.nlpSampleEntityRepository.deleteMany({ entity: criteria._id });

      const entities = await this.find(
        typeof criteria === 'string' ? { _id: criteria } : criteria,
      );
      entities
        .filter((e) => !e.builtin)
        .map((e) => {
          this.eventEmitter.emit('hook:nlp:entity:delete', e);
        });
    } else {
      throw new Error('Attempted to delete NLP entity using unknown criteria');
    }
  }

  /**
   * Retrieves all NLP entities and populates related `values`.
   *
   * @returns Promise containing an array of fully populated NLP entities.
   */
  async findAllAndPopulate() {
    const query = this.findAllQuery().populate(['values']);
    return await this.execute(query, NlpEntityFull);
  }

  /**
   * Retrieves a paginated list of NLP entities based on filter criteria,
   * and populates related `values`.
   *
   * @param filter Filter criteria for NLP entities.
   * @param pageQuery Pagination query.
   *
   * @returns Promise containing the paginated result of fully populated NLP entities.
   */
  async findPageAndPopulate(
    filter: TFilterQuery<NlpEntity>,
    pageQuery: PageQueryDto<NlpEntity>,
  ) {
    const query = this.findPageQuery(filter, pageQuery).populate(['values']);
    return await this.execute(query, NlpEntityFull);
  }

  /**
   * Retrieves a single NLP entity by its ID and populates related `values`.
   *
   * @param id The ID of the NLP entity.
   *
   * @returns Promise containing the fully populated NLP entity.
   */
  async findOneAndPopulate(id: string) {
    const query = this.findOneQuery(id).populate(['values']);
    return await this.executeOne(query, NlpEntityFull);
  }
}