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
import { Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

import { Attachment, AttachmentDocument } from '../schemas/attachment.schema';

@Injectable()
export class AttachmentRepository extends BaseRepository<Attachment, never> {
  constructor(
    @InjectModel(Attachment.name) readonly model: Model<Attachment>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(model, Attachment);
  }

  /**
   * Handles post-creation operations for an attachment.
   *
   * @param  created - The created attachment document.
   */
  async postCreate(created: AttachmentDocument): Promise<void> {
    this.eventEmitter.emit('hook:chatbot:attachment:upload', created);
  }
}