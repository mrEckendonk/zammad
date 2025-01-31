import * as Types from '#shared/graphql/types.ts';

import * as Mocks from '#tests/graphql/builders/mocks.ts'
import * as Operations from './onlineNotifications.api.ts'
import * as ErrorTypes from '#shared/types/error.ts'

export function mockOnlineNotificationsQuery(defaults: Mocks.MockDefaultsValue<Types.OnlineNotificationsQuery, Types.OnlineNotificationsQueryVariables>) {
  return Mocks.mockGraphQLResult(Operations.OnlineNotificationsDocument, defaults)
}

export function waitForOnlineNotificationsQueryCalls() {
  return Mocks.waitForGraphQLMockCalls<Types.OnlineNotificationsQuery>(Operations.OnlineNotificationsDocument)
}

export function mockOnlineNotificationsQueryError(message: string, extensions: {type: ErrorTypes.GraphQLErrorTypes }) {
  return Mocks.mockGraphQLResultWithError(Operations.OnlineNotificationsDocument, message, extensions);
}
