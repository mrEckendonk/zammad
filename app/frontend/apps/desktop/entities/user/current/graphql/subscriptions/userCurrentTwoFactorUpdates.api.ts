import * as Types from '#shared/graphql/types.ts';

import gql from 'graphql-tag';
import * as VueApolloComposable from '@vue/apollo-composable';
import * as VueCompositionApi from 'vue';
export type ReactiveFunction<TParam> = () => TParam;

export const UserCurrentTwoFactorUpdatesDocument = gql`
    subscription userCurrentTwoFactorUpdates {
  userCurrentTwoFactorUpdates {
    configuration {
      recoveryCodesExist
      enabledAuthenticationMethods {
        configured
        authenticationMethod
      }
    }
  }
}
    `;
export function useUserCurrentTwoFactorUpdatesSubscription(options: VueApolloComposable.UseSubscriptionOptions<Types.UserCurrentTwoFactorUpdatesSubscription, Types.UserCurrentTwoFactorUpdatesSubscriptionVariables> | VueCompositionApi.Ref<VueApolloComposable.UseSubscriptionOptions<Types.UserCurrentTwoFactorUpdatesSubscription, Types.UserCurrentTwoFactorUpdatesSubscriptionVariables>> | ReactiveFunction<VueApolloComposable.UseSubscriptionOptions<Types.UserCurrentTwoFactorUpdatesSubscription, Types.UserCurrentTwoFactorUpdatesSubscriptionVariables>> = {}) {
  return VueApolloComposable.useSubscription<Types.UserCurrentTwoFactorUpdatesSubscription, Types.UserCurrentTwoFactorUpdatesSubscriptionVariables>(UserCurrentTwoFactorUpdatesDocument, {}, options);
}
export type UserCurrentTwoFactorUpdatesSubscriptionCompositionFunctionResult = VueApolloComposable.UseSubscriptionReturn<Types.UserCurrentTwoFactorUpdatesSubscription, Types.UserCurrentTwoFactorUpdatesSubscriptionVariables>;