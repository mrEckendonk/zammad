# Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

module Gql::Queries
  class Ticket::Overviews < BaseQuery

    description 'Ticket overviews available in the system'

    argument :ignore_user_conditions, Boolean, description: 'Include additional overviews by ignoring user conditions'

    type [Gql::Types::OverviewType], null: false

    def resolve(ignore_user_conditions:)
      # This effectively scopes the overviews by `:use?` permission.
      ::Ticket::Overviews.all(current_user: context.current_user, ignore_user_conditions:)
    end
  end
end
