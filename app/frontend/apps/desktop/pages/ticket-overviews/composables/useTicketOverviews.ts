// Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

import { storeToRefs } from 'pinia'

import { useTicketOverviewsStore } from '#desktop/entities/ticket/stores/ticketOverviews.ts'

export const useTicketOverviews = () => {
  const store = useTicketOverviewsStore()
  const { setPreviousTicketOverviewLink } = store

  const state = storeToRefs(store)

  return {
    setPreviousTicketOverviewLink,
    ...state,
  }
}
