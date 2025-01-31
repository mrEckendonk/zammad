# Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

Zammad::Application.routes.draw do
  api_path = Rails.configuration.api_path

  match api_path + '/data_privacy_tasks',               to: 'data_privacy_tasks#index',   via: :get
  match api_path + '/data_privacy_tasks/by_state',      to: 'data_privacy_tasks#by_state',   via: :get
  match api_path + '/data_privacy_tasks/:id',           to: 'data_privacy_tasks#show',    via: :get
  match api_path + '/data_privacy_tasks',               to: 'data_privacy_tasks#create',  via: :post
  match api_path + '/data_privacy_tasks/:id',           to: 'data_privacy_tasks#update',  via: :put
  match api_path + '/data_privacy_tasks/:id',           to: 'data_privacy_tasks#destroy', via: :delete

end
