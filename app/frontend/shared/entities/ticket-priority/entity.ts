// Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

import { type TicketPriority } from '#shared/graphql/types.ts'

import type { EntityPlugin } from '../useEntity.ts'

// TODO: add Entity-Data types instead of direct usage from GQL

const ticketPriorityEntity: EntityPlugin<TicketPriority> = {
  name: 'TicketPriority',
  display: (object) => object.name || '',
}

export default ticketPriorityEntity
