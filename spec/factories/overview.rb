# Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

FactoryBot.define do
  factory :overview do
    sequence(:name) { |n| "Test Overview #{n}" }
    sequence(:prio) { |n| n }
    role_ids        { Role.where(name: %w[Customer Agent Admin]).pluck(:id) }
    out_of_office   { false }
    updated_by_id   { 1 }
    created_by_id   { 1 }

    condition do
      {
        'ticket.state_id' => {
          operator: 'is',
          value:    Ticket::State.where(name: %w[new open]).pluck(:id),
        },
      }
    end

    order do
      {
        by:        'created_at',
        direction: 'DESC',
      }
    end

    view do
      {
        d:                 %w[title customer state created_at],
        s:                 %w[number title state created_at],
        m:                 %w[number title state created_at],
        view_mode_default: 's',
      }
    end

    trait :condition_expert do
      condition do
        {
          operator:   'AND',
          conditions: [
            {
              name:     'ticket.state_id',
              operator: 'is',
              value:    Ticket::State.where(name: %w[new open]).pluck(:id),
            }
          ]
        }
      end
    end
  end
end
