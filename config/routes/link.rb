# Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

Zammad::Application.routes.draw do
  api_path = Rails.configuration.api_path

  # links
  match api_path + '/links',             to: 'links#index',   via: :get
  match api_path + '/links/add',         to: 'links#add',     via: :post
  match api_path + '/links/remove',      to: 'links#remove',  via: :delete

end
