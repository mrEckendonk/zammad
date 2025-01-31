import * as Types from '#shared/graphql/types.ts';

import * as Mocks from '#tests/graphql/builders/mocks.ts'
import * as Operations from './login.api.ts'
import * as ErrorTypes from '#shared/types/error.ts'

export function mockLoginMutation(defaults: Mocks.MockDefaultsValue<Types.LoginMutation, Types.LoginMutationVariables>) {
  return Mocks.mockGraphQLResult(Operations.LoginDocument, defaults)
}

export function waitForLoginMutationCalls() {
  return Mocks.waitForGraphQLMockCalls<Types.LoginMutation>(Operations.LoginDocument)
}

export function mockLoginMutationError(message: string, extensions: {type: ErrorTypes.GraphQLErrorTypes }) {
  return Mocks.mockGraphQLResultWithError(Operations.LoginDocument, message, extensions);
}
