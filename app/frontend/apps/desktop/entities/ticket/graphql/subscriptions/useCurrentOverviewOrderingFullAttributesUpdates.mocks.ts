import * as Types from '#shared/graphql/types.ts';

import * as Mocks from '#tests/graphql/builders/mocks.ts'
import * as Operations from './useCurrentOverviewOrderingFullAttributesUpdates.api.ts'
import * as ErrorTypes from '#shared/types/error.ts'

export function getUserCurrentOverviewOrderingFullAttributesUpdatesSubscriptionHandler() {
  return Mocks.getGraphQLSubscriptionHandler<Types.UserCurrentOverviewOrderingFullAttributesUpdatesSubscription>(Operations.UserCurrentOverviewOrderingFullAttributesUpdatesDocument)
}
