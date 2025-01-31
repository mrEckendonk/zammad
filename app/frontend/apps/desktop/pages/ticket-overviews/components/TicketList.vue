<!-- Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/ -->

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, type Ref, toRef, useTemplateRef } from 'vue'
import { onBeforeRouteUpdate, useRouter } from 'vue-router'

import { useSorting } from '#shared/composables/list/useSorting.ts'
import { useDebouncedLoading } from '#shared/composables/useDebouncedLoading.ts'
import { usePagination } from '#shared/composables/usePagination.ts'
import type { TicketById } from '#shared/entities/ticket/types.ts'
import {
  EnumObjectManagerObjects,
  EnumOrderDirection,
} from '#shared/graphql/types.ts'
import { getIdFromGraphQLId } from '#shared/graphql/utils.ts'
import { QueryHandler } from '#shared/server/apollo/handler/index.ts'
import { useApplicationStore } from '#shared/stores/application.ts'
import { useSessionStore } from '#shared/stores/session.ts'
import type { ObjectWithId } from '#shared/types/utils.ts'
import hasPermission from '#shared/utils/hasPermission.ts'
import { edgesToArray } from '#shared/utils/helpers.ts'

import CommonButton from '#desktop/components/CommonButton/CommonButton.vue'
import CommonAdvancedTable from '#desktop/components/CommonTable/CommonAdvancedTable.vue'
import CommonTableSkeleton from '#desktop/components/CommonTable/Skeleton/CommonTableSkeleton.vue'
import CommonTicketPriorityIndicatorIcon from '#desktop/components/CommonTicketPriorityIndicator/CommonTicketPriorityIndicatorIcon.vue'
import CommonTicketStateIndicatorIcon from '#desktop/components/CommonTicketStateIndicator/CommonTicketStateIndicatorIcon.vue'
import { useElementScroll } from '#desktop/composables/useElementScroll.ts'
import { useScrollPosition } from '#desktop/composables/useScrollPosition.ts'
import { useTicketsByOverviewQuery } from '#desktop/entities/ticket/graphql/queries/ticketsByOverview.api.ts'
import { useLifetimeCustomerTicketsCount } from '#desktop/entities/user/current/composables/useLifetimeCustomerTicketsCount.ts'
import TicketOverviewsEmptyText from '#desktop/pages/ticket-overviews/components/TicketOverviewsEmptyText.vue'

interface Props {
  overviewId: string
  orderBy: string
  orderDirection: EnumOrderDirection
  headers: string[]
  groupBy?: string
}

const props = defineProps<Props>()

const router = useRouter()

const TICKETS_COUNT = 30

const ticketsQueryVariables = computed(() => ({
  pageSize: TICKETS_COUNT,
  overviewId: props.overviewId,
  orderBy: props.orderBy,
  orderDirection: props.orderDirection,
  showUpdatedBy: true,
  showPriority: true,
}))

const ticketsQuery = new QueryHandler(
  useTicketsByOverviewQuery(ticketsQueryVariables, {
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-and-network',
  }),
)

const ticketsResult = ticketsQuery.result()
const loading = ticketsQuery.loading()

const isLoadingTickets = computed(() => {
  if (ticketsResult.value !== undefined) return false

  return loading.value
})

const { debouncedLoading } = useDebouncedLoading({
  isLoading: isLoadingTickets,
})

const tickets = computed(() =>
  edgesToArray(ticketsResult.value?.ticketsByOverview),
)

const totalCount = computed(
  () => ticketsResult.value?.ticketsByOverview.totalCount || 0,
)

const {
  sort,
  orderBy: localOrderBy,
  orderDirection: localOrderDirection,
} = useSorting(
  ticketsQuery,
  toRef(props, 'orderBy'),
  toRef(props, 'orderDirection'),
)

const pagination = usePagination(
  ticketsQuery,
  'ticketsByOverview',
  TICKETS_COUNT,
)

const loadMore = async () => pagination.fetchNextPage()

const { config } = storeToRefs(useApplicationStore())
const { user, userId } = storeToRefs(useSessionStore())

const storageKeyId = computed(
  () => `${userId.value}-table-headers-${props.overviewId}`,
)

const scrollContainerElement = useTemplateRef('scroll-container')

// Scrolling position is preserved when user visits another page and returns to overview page
const { scrollPosition, restoreScrollPosition } = useScrollPosition(
  scrollContainerElement,
)

const resetScrollPosition = () => {
  scrollPosition.value = 0
  restoreScrollPosition()
}

// Reset scroll-position back to the start, when user navigates between overviews
onBeforeRouteUpdate(resetScrollPosition)

const { reachedTop } = useElementScroll(
  scrollContainerElement as Ref<HTMLDivElement>,
)

const { hasAnyTicket } = useLifetimeCustomerTicketsCount()

const isCustomerAndCanCreateTickets = computed(
  () =>
    hasPermission('ticket.customer', user.value?.permissions?.names ?? []) &&
    config.value.customer_ticket_create,
)

const goToTicket = (ticket: ObjectWithId) =>
  router.push(`/tickets/${getIdFromGraphQLId(ticket.id)}`)

const goToTicketLinkColumn = {
  internal: true,
  getLink: (item: ObjectWithId) => `/tickets/${getIdFromGraphQLId(item.id)}`,
}

const localHeaders = computed(() => {
  const extendedHeaders = [...props.headers]

  extendedHeaders.unshift('stateIcon')

  if (config.value.ui_ticket_priority_icons) {
    extendedHeaders.unshift('priorityIcon')
  }

  return extendedHeaders
})

const maxItems = computed(() => config.value.ui_ticket_overview_ticket_limit)
</script>

<template>
  <div
    ref="scroll-container"
    class="overflow-y-auto focus-visible:outline-none"
  >
    <div
      v-if="debouncedLoading && !pagination.loadingNewPage"
      class="p-4 text-center"
    >
      <CommonTableSkeleton data-test-id="table-skeleton" />
    </div>

    <template v-else-if="!isLoadingTickets && !tickets.length">
      <TicketOverviewsEmptyText
        v-if="isCustomerAndCanCreateTickets && !hasAnyTicket"
        class="space-y-2.5"
        :title="$t('Welcome!')"
      >
        <CommonLabel class="block" tag="p">{{
          $t('You have not created a ticket yet.')
        }}</CommonLabel>
        <CommonLabel class="block" tag="p">{{
          $t('The way to communicate with us is this thing called "ticket".')
        }}</CommonLabel>
        <CommonLabel class="block" tag="p">{{
          $t('Please click on the button below to create your first one.')
        }}</CommonLabel>
        <CommonButton
          size="large"
          class="mx-auto !mt-8"
          variant="primary"
          @click="router.push({ name: 'TicketCreate' })"
          >{{ $t('Create your first ticket') }}
        </CommonButton>
      </TicketOverviewsEmptyText>

      <TicketOverviewsEmptyText
        v-else
        :title="$t('Empty Overview')"
        :text="$t('No tickets in this state.')"
      />
    </template>

    <div v-else-if="tickets.length">
      <CommonAdvancedTable
        v-model:order-by="localOrderBy"
        v-model:order-direction="localOrderDirection"
        :caption="$t('Ticket Overview')"
        :headers="localHeaders"
        :object="EnumObjectManagerObjects.Ticket"
        :group-by="groupBy"
        :reached-scroll-top="reachedTop"
        :scroll-container="scrollContainerElement"
        :attributes="[
          {
            name: 'priorityIcon',
            label: __('Priority Icon'),
            headerPreferences: {
              noResize: true,
              hideLabel: true,
              displayWidth: 25,
            },
            columnPreferences: {},
            dataType: 'icon',
          },
          {
            name: 'stateIcon',
            label: __('State Icon'),
            headerPreferences: {
              noResize: true,
              hideLabel: true,
              displayWidth: 30,
            },
            columnPreferences: {},
            dataType: 'icon',
          },
        ]"
        :attribute-extensions="{
          title: {
            columnPreferences: {
              link: goToTicketLinkColumn,
            },
          },
          number: {
            label: config.ticket_hook,
            columnPreferences: {
              link: goToTicketLinkColumn,
            },
          },
        }"
        :items="tickets"
        :total-items="totalCount"
        :storage-key-id="storageKeyId"
        :max-items="maxItems"
        @load-more="loadMore"
        @click-row="goToTicket"
        @sort="sort"
      >
        <template #column-cell-priorityIcon="{ item, isRowSelected }">
          <CommonTicketPriorityIndicatorIcon
            :ui-color="(item as TicketById).priority?.uiColor"
            with-text-color
            class="shrink-0 group-hover:text-black group-focus-visible:text-white group-active:text-white group-hover:dark:text-white group-active:dark:text-white"
            :class="{
              'ltr:text-black rtl:text-black dark:text-white': isRowSelected,
            }"
          />
        </template>
        <template #column-cell-stateIcon="{ item, isRowSelected }">
          <CommonTicketStateIndicatorIcon
            class="shrink-0 group-hover:text-black group-focus-visible:text-white group-active:text-white group-hover:dark:text-white group-active:dark:text-white"
            :class="{
              'ltr:text-black rtl:text-black dark:text-white': isRowSelected,
            }"
            :color-code="(item as TicketById).stateColorCode"
            :label="(item as TicketById).state.name"
            :aria-labelledby="(item as TicketById).id"
            icon-size="tiny"
          />
        </template>
      </CommonAdvancedTable>
    </div>
  </div>
</template>
