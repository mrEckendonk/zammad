// Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

import { waitFor, within } from '@testing-library/vue'

import { generateObjectData } from '#tests/graphql/builders/index.ts'
import { getTestRouter } from '#tests/support/components/renderComponent.ts'
import { visitView } from '#tests/support/components/visitView.ts'
import { mockApplicationConfig } from '#tests/support/mock-applicationConfig.ts'
import { mockPermissions } from '#tests/support/mock-permissions.ts'
import { waitForNextTick } from '#tests/support/utils.ts'

import { mockTicketOverviewTicketCountQuery } from '#shared/entities/ticket/graphql/queries/ticket/overviewTicketCount.mocks.ts'
import { mockCurrentUserQuery } from '#shared/graphql/queries/currentUser.mocks.ts'
import { EnumOrderDirection } from '#shared/graphql/types.ts'
import { convertToGraphQLId } from '#shared/graphql/utils.ts'

import { mockTicketsByOverviewQuery } from '#desktop/entities/ticket/graphql/queries/ticketsByOverview.mocks.ts'
import { mockUserCurrentTicketOverviewsQuery } from '#desktop/entities/ticket/graphql/queries/userCurrentTicketOverviews.mocks.ts'
import { getUserCurrentOverviewOrderingFullAttributesUpdatesSubscriptionHandler } from '#desktop/entities/ticket/graphql/subscriptions/useCurrentOverviewOrderingFullAttributesUpdates.mocks.ts'
import { getUserCurrentTicketOverviewFullAttributesUpdatesSubscriptionHandler } from '#desktop/entities/ticket/graphql/subscriptions/userCurrentTicketOverviewFullAttributesUpdates.mocks.ts'

const mockDefaultOverviewQueries = () => {
  mockUserCurrentTicketOverviewsQuery({
    userCurrentTicketOverviews: [
      {
        id: convertToGraphQLId('Overview', 1),
        name: 'My Assigned Tickets',
        link: 'my_assigned',
        prio: 1000,
        orderBy: 'created_at',
        orderDirection: EnumOrderDirection.Ascending,
        viewColumns: [],
        orderColumns: [],
        active: true,
      },
    ],
  })

  mockTicketOverviewTicketCountQuery({
    ticketOverviews: [
      generateObjectData('Overview', {
        id: convertToGraphQLId('Overview', 1),
        ticketCount: 111,
      }),
    ],
  })
}

const getDefaultOverviews = () => [
  {
    id: convertToGraphQLId('Overview', 1),
    name: 'My Assigned Tickets',
    link: 'my_assigned',
    prio: 1000,
    orderBy: 'created_at',
    orderDirection: EnumOrderDirection.Ascending,
    viewColumns: [],
    orderColumns: [],
    active: true,
  },
  {
    id: convertToGraphQLId('Overview', 2),
    name: 'New Tickets',
    link: 'new_tickets',
    prio: 2000,
    orderBy: 'created_at',
    orderDirection: EnumOrderDirection.Ascending,
    viewColumns: [],
    orderColumns: [],
    active: true,
  },
]

describe('TicketOverviews', async () => {
  it('redirects when overview does not exist', async () => {
    mockDefaultOverviewQueries()

    await visitView('tickets/view/does_not_exist')

    const router = getTestRouter()

    await waitFor(() =>
      expect(router.currentRoute.value.path).toBe('/tickets/view/my_assigned'),
    )
  })

  it('displays overviews correctly', async () => {
    mockDefaultOverviewQueries()

    const view = await visitView('tickets/view/my_assigned')

    const primaryNavigationSidebar = view.getByRole('complementary', {
      name: 'Main sidebar',
    })

    expect(
      within(primaryNavigationSidebar).getByRole('link', {
        name: 'Overviews',
      }),
    ).toHaveAttribute('href', '/desktop/tickets/view')

    const secondaryNavigationSidebar = await view.findByRole('complementary', {
      name: 'second level navigation sidebar',
    })

    expect(secondaryNavigationSidebar).toHaveTextContent('My Assigned Tickets')
  })

  it('reorders overviews when subscription comes in', async () => {
    const overviews = getDefaultOverviews()

    mockUserCurrentTicketOverviewsQuery({
      userCurrentTicketOverviews: overviews,
    })

    mockTicketOverviewTicketCountQuery({
      ticketOverviews: [
        {
          id: convertToGraphQLId('Overview', 1),
          ticketCount: 111,
        },
        {
          id: convertToGraphQLId('Overview', 2),
          ticketCount: 666,
        },
      ],
    })

    const view = await visitView('tickets/view/my_assigned')

    const secondaryNavigationSidebar = await view.findByRole('complementary', {
      name: 'second level navigation sidebar',
    })

    let currentOverviews = within(secondaryNavigationSidebar).getAllByRole(
      'link',
    )

    expect(currentOverviews[0]).toHaveTextContent('My Assigned Tickets')
    expect(currentOverviews[1]).toHaveTextContent('New Tickets')

    await getUserCurrentOverviewOrderingFullAttributesUpdatesSubscriptionHandler().trigger(
      {
        userCurrentOverviewOrderingUpdates: generateObjectData(
          'UserCurrentOverviewOrderingUpdatesPayload',
          {
            overviews: overviews.reverse(),
          },
        ),
      },
    )

    await waitForNextTick()

    currentOverviews = within(secondaryNavigationSidebar).getAllByRole('link')

    expect(currentOverviews[0]).toHaveTextContent('New Tickets')
    expect(currentOverviews[1]).toHaveTextContent('My Assigned Tickets')
  })

  it('updates overviews when subscription comes in', async () => {
    const overviews = getDefaultOverviews()

    mockUserCurrentTicketOverviewsQuery({
      userCurrentTicketOverviews: overviews,
    })

    mockTicketOverviewTicketCountQuery({
      ticketOverviews: [
        {
          id: convertToGraphQLId('Overview', 1),
          ticketCount: 111,
        },
        {
          id: convertToGraphQLId('Overview', 2),
          ticketCount: 666,
        },
      ],
    })

    const view = await visitView('tickets/view/my_assigned')

    const secondaryNavigationSidebar = await view.findByRole('complementary', {
      name: 'second level navigation sidebar',
    })

    expect(
      within(secondaryNavigationSidebar).getAllByRole('link'),
    ).toHaveLength(2)

    await getUserCurrentTicketOverviewFullAttributesUpdatesSubscriptionHandler().trigger(
      {
        userCurrentTicketOverviewUpdates: generateObjectData(
          'UserCurrentTicketOverviewUpdatesPayload',
          {
            ticketOverviews: [
              ...overviews,
              {
                id: convertToGraphQLId('Overview', 3),
                name: 'Foo Tickets',
                link: 'foo_tickets',
                prio: 2000,
                orderBy: 'created_at',
                orderDirection: EnumOrderDirection.Ascending,
                viewColumns: [],
                orderColumns: [],
                active: true,
              },
            ],
          },
        ),
      },
    )

    expect(
      within(secondaryNavigationSidebar).getAllByRole('link'),
    ).toHaveLength(3)
  })

  describe('empty states', () => {
    it('displays a message to the agent when no overviews are available.', async () => {
      mockUserCurrentTicketOverviewsQuery({
        userCurrentTicketOverviews: [],
      })

      mockTicketOverviewTicketCountQuery({
        ticketOverviews: [],
      })

      const view = await visitView('tickets/view')

      expect(
        await view.findByText(
          'Currently, no overviews are assigned to your roles. Please contact your administrator.',
        ),
      ).toBeInTheDocument()

      expect(view.getByRole('heading', { level: 2 })).toHaveTextContent(
        'No Overviews',
      )

      expect(view.getByIconName('exclamation-triangle')).toBeInTheDocument()

      expect(
        view.queryByLabelText('second level navigation sidebar'),
      ).not.toBeInTheDocument()
    })

    it('displays a ticket create message to the customer when no tickets are available and no ticket history', async () => {
      mockUserCurrentTicketOverviewsQuery({
        userCurrentTicketOverviews: [
          generateObjectData('Overview', {
            id: convertToGraphQLId('Overview', 1),
            name: 'My Tickets',
            link: 'my_tickets',
            prio: 9,
            orderBy: 'created_at',
            orderDirection: EnumOrderDirection.Ascending,
            viewColumns: [],
            orderColumns: [],
            organizationShared: false,
            outOfOffice: false,
            active: true,
          }),
        ],
      })

      mockCurrentUserQuery({
        currentUser: {
          preferences: {
            tickets_closed: 0,
            tickets_open: 0,
          },
        },
      })

      mockTicketOverviewTicketCountQuery({
        ticketOverviews: [],
      })

      mockTicketsByOverviewQuery({
        ticketsByOverview: generateObjectData('TicketConnection', {
          totalCount: 0,
          edges: [],
          pageInfo: {
            endCursor: '',
            hasNextPage: false,
          },
        }),
      })

      mockPermissions(['ticket.customer'])

      await mockApplicationConfig({ customer_ticket_create: true })

      const view = await visitView('tickets/view')

      const secondaryNavigationSidebar = await view.findByRole(
        'complementary',
        {
          name: 'second level navigation sidebar',
        },
      )

      expect(
        within(secondaryNavigationSidebar).getByRole('link', {
          name: 'My Tickets',
        }),
      ).toBeInTheDocument()

      expect(await view.findByRole('heading', { level: 2 })).toHaveTextContent(
        'Welcome!',
      )

      expect(
        view.getByText('You have not created a ticket yet.'),
      ).toBeInTheDocument()
      expect(
        view.getByText(
          'The way to communicate with us is this thing called "ticket".',
        ),
      ).toBeInTheDocument()
      expect(
        view.getByText(
          'Please click on the button below to create your first one.',
        ),
      ).toBeInTheDocument()

      await view.events.click(
        view.getByRole('button', { name: 'Create your first ticket' }),
      )

      const router = getTestRouter()

      await waitFor(() =>
        expect(router.currentRoute.value.name).toBe('TicketCreate'),
      )
    })

    it('displays a message indicating no tickets are available when the overview is empty', async () => {
      mockUserCurrentTicketOverviewsQuery({
        userCurrentTicketOverviews: [
          generateObjectData('Overview', {
            id: convertToGraphQLId('Overview', 1),
            name: 'My Assigned Tickets',
            link: 'my_assigned',
            prio: 4,
            orderBy: 'created_at',
            orderDirection: EnumOrderDirection.Ascending,
            viewColumns: [],
            orderColumns: [],
            organizationShared: false,
            outOfOffice: false,
            active: true,
          }),
        ],
      })

      mockCurrentUserQuery({
        currentUser: {
          preferences: {
            tickets_closed: 1,
            tickets_open: 2,
          },
        },
      })

      mockTicketOverviewTicketCountQuery({
        ticketOverviews: [],
      })

      mockTicketsByOverviewQuery({
        ticketsByOverview: generateObjectData('TicketConnection', {
          totalCount: 0,
          edges: [],
          pageInfo: {
            endCursor: '',
            hasNextPage: false,
          },
        }),
      })

      mockPermissions(['ticket.agent'])

      const view = await visitView('tickets/view')

      expect(await view.findByRole('heading', { level: 2 })).toHaveTextContent(
        'Empty Overview',
      )

      expect(view.getByText('No tickets in this state.')).toBeInTheDocument()
    })
  })
})
