# Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

class ChatsController < ApplicationController
  prepend_before_action :authenticate_and_authorize!

  def index
    chat_ids = []
    assets = {}
    Chat.reorder(:id).each do |chat|
      chat_ids.push chat.id
      assets = chat.assets(assets)
    end
    setting = Setting.find_by(name: 'chat')
    assets = setting.assets(assets)
    render json: {
      chat_ids: chat_ids,
      assets:   assets,
    }
  end

  def show
    model_show_render(Chat, params)
  end

  def create
    model_create_render(Chat, params)
  end

  def update
    model_update_render(Chat, params)
  end

  def destroy
    model_destroy_render(Chat, params)
  end

end
