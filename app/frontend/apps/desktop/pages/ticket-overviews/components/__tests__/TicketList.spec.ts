// Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

import renderComponent from '#tests/support/components/renderComponent.ts'
import { mockRouterHooks } from '#tests/support/mock-vue-router.ts'

import { createDummyTicket } from '#shared/entities/ticket-article/__tests__/mocks/ticket.ts'
import { convertToGraphQLId } from '#shared/graphql/utils.ts'

import { mockTicketsByOverviewQuery } from '#desktop/entities/ticket/graphql/queries/ticketsByOverview.mocks.ts'
import TicketList from '#desktop/pages/ticket-overviews/components/TicketList.vue'

mockRouterHooks()

vi.hoisted(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2011-11-11T12:00:00Z'))
})

describe('TicketList', () => {
  afterAll(() => {
    vi.resetAllMocks()
  })

  describe('loading states', () => {
    it('displays the skeleton for the table on initial load', async () => {
      mockTicketsByOverviewQuery({
        ticketsByOverview: {
          edges: [{ node: createDummyTicket() }],
          pageInfo: {
            endCursor: 'MjU',
            hasNextPage: true,
          },
          totalCount: 207,
        },
      })

      const wrapper = renderComponent(TicketList, {
        props: {
          overviewId: convertToGraphQLId('Overview', 1),
          headers: [
            'title',
            'customer',
            'group',
            'owner',
            'state',
            'created_at',
          ],
          orderBy: 'group',
          orderDirection: 'ASCENDING',
        },
        router: true,
        form: true,
      })

      expect(await wrapper.findByTestId('table-skeleton')).toBeInTheDocument()
    })
  })

  it.todo('displays a table overview with tickets', async () => {
    mockTicketsByOverviewQuery({
      ticketsByOverview: {
        edges: [{ node: createDummyTicket() }],
        pageInfo: {
          endCursor: 'MjU',
          hasNextPage: true,
        },
        totalCount: 1,
      },
    })

    const wrapper = renderComponent(TicketList, {
      props: {
        overviewId: convertToGraphQLId('Overview', 1),
        headers: ['title', 'customer', 'group', 'owner', 'state', 'created_at'],
        orderBy: 'group',
        orderDirection: 'ASCENDING',
      },
      router: true,
      form: true,
    })

    const table = await wrapper.findByRole('table', { name: 'Ticket Overview' })

    expect(table).toHaveTextContent(
      'Ticket OverviewState Icon Created at in 4 weeks',
    )

    // :TODO should we check for more specific content?
  })
})
