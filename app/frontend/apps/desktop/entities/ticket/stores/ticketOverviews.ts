// Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

import { keyBy } from 'lodash-es'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { useTicketOverviewTicketCountQuery } from '#shared/entities/ticket/graphql/queries/ticket/overviewTicketCount.api.ts'
import type {
  UserCurrentOverviewOrderingUpdatesSubscription,
  UserCurrentOverviewOrderingUpdatesSubscriptionVariables,
  UserCurrentTicketOverviewsQuery,
  UserCurrentTicketOverviewUpdatesSubscription,
  UserCurrentTicketOverviewUpdatesSubscriptionVariables,
} from '#shared/graphql/types.ts'
import { QueryHandler } from '#shared/server/apollo/handler/index.ts'

import { useUserCurrentTicketOverviewsQuery } from '#desktop/entities/ticket/graphql/queries/userCurrentTicketOverviews.api.ts'
import { UserCurrentOverviewOrderingFullAttributesUpdatesDocument } from '#desktop/entities/ticket/graphql/subscriptions/useCurrentOverviewOrderingFullAttributesUpdates.api.ts'
import { UserCurrentTicketOverviewFullAttributesUpdatesDocument } from '#desktop/entities/ticket/graphql/subscriptions/userCurrentTicketOverviewFullAttributesUpdates.api.ts'

export const useTicketOverviewsStore = defineStore('ticketOverviews', () => {
  const ticketOverviewHandler = new QueryHandler(
    useUserCurrentTicketOverviewsQuery({
      withTicketCount: false,
      ignoreUserConditions: false,
    }),
  )

  ticketOverviewHandler.subscribeToMore<
    UserCurrentTicketOverviewUpdatesSubscriptionVariables,
    UserCurrentTicketOverviewUpdatesSubscription
  >({
    document: UserCurrentTicketOverviewFullAttributesUpdatesDocument,
    variables: { ignoreUserConditions: false },
    updateQuery(_, { subscriptionData }) {
      const ticketOverviews =
        subscriptionData.data.userCurrentTicketOverviewUpdates?.ticketOverviews

      // if we return empty array here, the actual query will be aborted, because we have fetchPolicy "cache-and-network"
      // if we return existing value, it will throw an error, because "overviews" doesn't exist yet on the query result
      if (!ticketOverviews)
        return null as unknown as UserCurrentTicketOverviewsQuery

      return {
        userCurrentTicketOverviews: ticketOverviews,
      } as unknown as UserCurrentTicketOverviewsQuery
    },
  })

  // Subscription for overview ordering updates
  ticketOverviewHandler.subscribeToMore<
    UserCurrentOverviewOrderingUpdatesSubscriptionVariables,
    UserCurrentOverviewOrderingUpdatesSubscription
  >({
    document: UserCurrentOverviewOrderingFullAttributesUpdatesDocument,
    variables: { ignoreUserConditions: false },
    updateQuery(_, { subscriptionData }) {
      const overviews =
        subscriptionData.data.userCurrentOverviewOrderingUpdates?.overviews

      if (!overviews) return null as unknown as UserCurrentTicketOverviewsQuery

      return {
        userCurrentTicketOverviews: overviews,
      } as UserCurrentTicketOverviewsQuery
    },
  })

  const overviewsRaw = ticketOverviewHandler.result()
  const overviewsLoading = ticketOverviewHandler.loading()

  const overviews = computed(
    () => overviewsRaw.value?.userCurrentTicketOverviews || [],
  )

  const ticketOverviewTicketCountHandler = new QueryHandler(
    useTicketOverviewTicketCountQuery(
      { ignoreUserConditions: false },
      {
        context: {
          batch: {
            active: false,
          },
        },
      },
    ),
  )

  const overviewsTicketCount = ticketOverviewTicketCountHandler.result()

  const overviewsTicketCountById = computed(() => {
    const overviewsWithCount = overviewsTicketCount.value?.ticketOverviews || []
    return Object.fromEntries(
      overviewsWithCount.map((overview) => [overview.id, overview.ticketCount]),
    )
  })

  const overviewsByLink = computed(() => keyBy(overviews.value, 'link'))

  const hasOverviews = computed(() => overviews.value.length > 0)

  const previousTicketOverviewLink = ref('')

  const setPreviousTicketOverviewLink = (link: string) => {
    previousTicketOverviewLink.value = link
  }

  return {
    overviews,
    overviewsTicketCountById,
    overviewsByLink,
    overviewsTicketCount,
    overviewsLoading,
    hasOverviews,
    previousTicketOverviewLink,
    setPreviousTicketOverviewLink,
  }
})
