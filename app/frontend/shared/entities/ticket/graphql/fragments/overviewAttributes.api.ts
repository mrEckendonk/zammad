import * as Types from '#shared/graphql/types.ts';

import gql from 'graphql-tag';
export const OverviewAttributesFragmentDoc = gql`
    fragment overviewAttributes on Overview {
  id
  name
  link
  prio
  groupBy
  orderBy
  orderDirection
  viewColumns {
    key
    value
  }
  orderColumns {
    key
    value
  }
  organizationShared
  outOfOffice
  active
  viewColumnsRaw
  ticketCount @include(if: $withTicketCount)
}
    `;