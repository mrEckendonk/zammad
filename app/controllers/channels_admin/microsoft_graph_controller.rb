# Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

class ChannelsAdmin::MicrosoftGraphController < ChannelsAdmin::BaseController
  def area
    'MicrosoftGraph::Account'.freeze
  end

  def index
    system_online_service = Setting.get('system_online_service')

    assets = {}
    external_credential_ids = []
    ExternalCredential.where(name: 'microsoft_graph').each do |external_credential|
      assets = external_credential.assets(assets)
      external_credential_ids.push external_credential.id
    end

    channels = Service::Channel::Admin::List.new(area: area).execute
    channel_ids = []
    channels.each do |channel|
      assets = channel.assets(assets)
      channel_ids.push channel.id
    end

    not_used_email_address_ids = []
    EmailAddress.find_each do |email_address|
      next if system_online_service && email_address.preferences && email_address.preferences['online_service_disable']

      assets = email_address.assets(assets)
      if !email_address.channel_id || !email_address.active || !Channel.exists?(email_address.channel_id)
        not_used_email_address_ids.push email_address.id
      end
    end

    render json: {
      assets:                     assets,
      not_used_email_address_ids: not_used_email_address_ids,
      channel_ids:                channel_ids,
      external_credential_ids:    external_credential_ids,
      callback_url:               ExternalCredential.callback_url('microsoft_graph'),
    }
  end

  def inbound
    channel = Channel.find_by(id: params[:id], area:)

    channel.refresh_xoauth2!

    inbound_prepare_channel(channel, params)

    result = EmailHelper::Probe.inbound(channel.options[:inbound])
    raise Exceptions::UnprocessableEntity, (result[:message_human] || result[:message]) if result[:result] == 'invalid'

    render json: result
  end

  def verify
    channel = Channel.find_by(id: params[:id], area:)

    verify_prepare_channel(channel, params)

    channel.save!

    render json: {}
  end

  def group
    channel = Channel.find_by(id: params[:id], area:)
    channel.group_id = params[:group_id]
    channel.save!
    render json: {}
  end

  def folders
    channel = Channel.find_by(id: params[:id], area:)
    raise Exceptions::UnprocessableEntity, __('Could not find the channel.') if channel.nil?

    channel_mailbox = channel.options.dig('inbound', 'options', 'shared_mailbox') || channel.options.dig('inbound', 'options', 'user')
    raise Exceptions::UnprocessableEntity, __('Could not identify the channel mailbox.') if channel_mailbox.nil?

    channel.refresh_xoauth2!(force: true)

    graph = ::MicrosoftGraph.new access_token: channel.options.dig('auth', 'access_token'), mailbox: channel_mailbox

    begin
      folders = graph.get_message_folders_tree
    rescue ::MicrosoftGraph::ApiError => e
      error = {
        message: e.message,
        code:    e.error_code,
      }
    end

    render json: { folders:, error: }
  end

  private

  def inbound_prepare_channel(channel, params)
    channel.group_id = params[:group_id] if params[:group_id].present?
    channel.active   = params[:active] if params.key?(:active)

    channel.options[:inbound] ||= {}
    channel.options[:inbound][:options] ||= {}

    %w[folder_id keep_on_server].each do |key|
      next if params.dig(:options, key).nil?

      channel.options[:inbound][:options][key] = params[:options][key]
    end
  end

  def verify_prepare_channel(channel, params)
    inbound_prepare_channel(channel, params)

    %w[archive archive_before archive_state_id].each do |key|
      next if params.dig(:options, key).nil?

      channel.options[:inbound][:options][key] = params[:options][key]
    end

    channel.status_in    = 'ok'
    channel.status_out   = 'ok'
    channel.last_log_in  = nil
    channel.last_log_out = nil
  end
end
