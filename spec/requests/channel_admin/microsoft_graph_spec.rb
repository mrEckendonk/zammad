# Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

require 'rails_helper'

require 'requests/channel_admin/base_examples'

RSpec.describe 'Microsoft Graph channel admin API endpoints', aggregate_failures: true, authenticated_as: :user, type: :request do
  let(:user) { create(:admin) }

  it_behaves_like 'base channel management', factory: :microsoft_graph_channel, path: :microsoft_graph

  describe 'GET /api/v1/channels_admin/microsoft_graph' do
    let!(:channel) { create(:microsoft_graph_channel) }

    it 'list the channel' do
      get '/api/v1/channels/admin/microsoft_graph'

      expect(response).to have_http_status(:ok)
      expect(json_response).to include(
        'not_used_email_address_ids' => [],
        'channel_ids'                => [channel.id],
        'callback_url'               => ExternalCredential.callback_url('microsoft_graph'),
      )
    end
  end

  describe 'GET /api/v1/channels_admin/microsoft_graph/ID/folders' do
    let!(:channel) { create(:microsoft_graph_channel) }

    let(:folders) do
      [
        {
          'id'           => Base64.strict_encode64(Faker::Crypto.unique.sha256),
          'displayName'  => Faker::Lorem.unique.word,
          'childFolders' => [],
        },
      ]
    end

    before do
      allow_any_instance_of(Channel).to receive(:refresh_xoauth2!).and_return(true)
      allow_any_instance_of(MicrosoftGraph).to receive(:get_message_folders_tree).and_return(folders)
    end

    it 'fetches mailbox folder information' do
      get "/api/v1/channels/admin/microsoft_graph/#{channel.id}/folders"
      expect(response).to have_http_status(:ok)
      expect(json_response).to include('folders' => folders)
    end

    context 'when API raises an error' do
      before do
        allow_any_instance_of(MicrosoftGraph).to receive(:get_message_folders_tree).and_raise(MicrosoftGraph::ApiError, { message: 'Error message', code: 'Error code' })
      end

      it 'includes both error message and code' do
        get "/api/v1/channels/admin/microsoft_graph/#{channel.id}/folders"
        expect(response).to have_http_status(:ok)
        expect(json_response).to include('error' => {
                                           'message' => 'Error message (Error code)',
                                           'code'    => 'Error code',
                                         })
      end
    end
  end

  describe 'POST /api/v1/channels_admin/microsoft_graph/group/ID' do
    let!(:channel) { create(:microsoft_graph_channel) }
    let!(:group)   { create(:group) }

    it 'updates destination group of the channel' do
      post "/api/v1/channels/admin/microsoft_graph/group/#{channel.id}", params: { group_id: group.id }
      expect(response).to have_http_status(:ok)
      expect(channel.reload.group).to eq(group)
    end
  end

  describe 'POST /api/v1/channels_admin/microsoft_graph/inbound/ID' do
    let!(:channel) { create(:microsoft_graph_channel) }
    let!(:group)   { create(:group) }

    before do
      allow_any_instance_of(Channel).to receive(:refresh_xoauth2!).and_return(true)
      allow(EmailHelper::Probe).to receive(:inbound).and_return({ result: 'ok' })
    end

    it 'updates inbound options of the channel' do
      post "/api/v1/channels/admin/microsoft_graph/inbound/#{channel.id}", params: { group_id: group.id, options: { folder_id: 'AAMkAD=', keep_on_server: 'true' } }
      expect(response).to have_http_status(:ok)
      expect(channel.reload.group).to eq(group)
      expect(channel.options['inbound']['options']).to include(
        'folder_id'      => 'AAMkAD=',
        'keep_on_server' => 'true',
      )
    end
  end
end
