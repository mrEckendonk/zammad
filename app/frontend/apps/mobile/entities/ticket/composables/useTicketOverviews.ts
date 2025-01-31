// Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

import { useTimeoutFn } from '@vueuse/shared'
import { onMounted } from 'vue'

import { useTicketOverviewTicketCountLazyQuery } from '#shared/entities/ticket/graphql/queries/ticket/overviewTicketCount.api.ts'
import { QueryHandler } from '#shared/server/apollo/handler/index.ts'

import { useTicketOverviewsStore } from '../stores/ticketOverviews.ts'

const POLLING_INTERVAL = 60000

export const useTicketOverviews = () => {
  const overviews = useTicketOverviewsStore()

  const ticketOverviewTicketCountHandler = new QueryHandler(
    useTicketOverviewTicketCountLazyQuery(
      {
        ignoreUserConditions: false,
      },
      {
        pollInterval: POLLING_INTERVAL,
      },
    ),
  )

  onMounted(() => {
    if (!overviews.loading) {
      ticketOverviewTicketCountHandler.load()
    } else {
      useTimeoutFn(
        () => ticketOverviewTicketCountHandler.load(),
        POLLING_INTERVAL,
      )
    }
  })

  return overviews
}
