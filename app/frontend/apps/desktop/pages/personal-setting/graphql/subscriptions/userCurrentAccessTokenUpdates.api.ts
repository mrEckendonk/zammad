import * as Types from '#shared/graphql/types.ts';

import gql from 'graphql-tag';
import { TokenAttributesFragmentDoc } from '../../../../../../shared/entities/user/current/graphql/fragments/tokenAttributes.api';
import * as VueApolloComposable from '@vue/apollo-composable';
import * as VueCompositionApi from 'vue';
export type ReactiveFunction<TParam> = () => TParam;

export const UserCurrentAccessTokenUpdatesDocument = gql`
    subscription userCurrentAccessTokenUpdates {
  userCurrentAccessTokenUpdates {
    tokens {
      ...tokenAttributes
    }
  }
}
    ${TokenAttributesFragmentDoc}`;
export function useUserCurrentAccessTokenUpdatesSubscription(options: VueApolloComposable.UseSubscriptionOptions<Types.UserCurrentAccessTokenUpdatesSubscription, Types.UserCurrentAccessTokenUpdatesSubscriptionVariables> | VueCompositionApi.Ref<VueApolloComposable.UseSubscriptionOptions<Types.UserCurrentAccessTokenUpdatesSubscription, Types.UserCurrentAccessTokenUpdatesSubscriptionVariables>> | ReactiveFunction<VueApolloComposable.UseSubscriptionOptions<Types.UserCurrentAccessTokenUpdatesSubscription, Types.UserCurrentAccessTokenUpdatesSubscriptionVariables>> = {}) {
  return VueApolloComposable.useSubscription<Types.UserCurrentAccessTokenUpdatesSubscription, Types.UserCurrentAccessTokenUpdatesSubscriptionVariables>(UserCurrentAccessTokenUpdatesDocument, {}, options);
}
export type UserCurrentAccessTokenUpdatesSubscriptionCompositionFunctionResult = VueApolloComposable.UseSubscriptionReturn<Types.UserCurrentAccessTokenUpdatesSubscription, Types.UserCurrentAccessTokenUpdatesSubscriptionVariables>;