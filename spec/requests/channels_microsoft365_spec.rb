# Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

require 'rails_helper'

RSpec.describe 'Microsoft365 channel API endpoints', type: :request do
  let(:admin)                 { create(:admin) }
  let!(:microsoft365_channel) { create(:microsoft365_channel) }

  describe 'DELETE /api/v1/channels_microsoft365', authenticated_as: :admin do
    context 'without a email address relation' do
      let(:params) do
        {
          id: microsoft365_channel.id
        }
      end

      it 'responds 200 OK' do
        delete '/api/v1/channels_microsoft365', params: params, as: :json

        expect(response).to have_http_status(:ok)
      end

      it 'microsoft365 channel deleted' do
        expect { delete '/api/v1/channels_microsoft365', params: params, as: :json }.to change(Channel, :count).by(-1)
      end
    end

    context 'with a email address relation' do
      let(:params) do
        {
          id: microsoft365_channel.id
        }
      end

      before do
        create(:email_address, channel: microsoft365_channel)
      end

      it 'responds 200 OK' do
        delete '/api/v1/channels_microsoft365', params: params, as: :json

        expect(response).to have_http_status(:ok)
      end

      it 'microsoft365 channel and related email address deleted' do
        expect { delete '/api/v1/channels_microsoft365', params: params, as: :json }.to change(Channel, :count).by(-1).and change(EmailAddress, :count).by(-1)
      end
    end
  end

  describe 'POST /api/v1/channels_microsoft365/inbound/ID' do
    let(:channel) { create(:microsoft365_channel) }
    let(:group)   { create(:group) }

    before do
      Channel.where(area: 'Microsoft365::Account').each(&:destroy)
      allow_any_instance_of(Channel).to receive(:refresh_xoauth2!).and_return(true)
      allow(EmailHelper::Probe).to receive(:inbound).and_return({ result: 'ok' })
    end

    it 'does not update inbound options of the channel' do
      expect do
        post "/api/v1/channels_microsoft365/inbound/#{channel.id}", params: { group_id: group.id, options: { folder: 'SomeFolder', keep_on_server: 'true' } }
      end.not_to change(channel, :updated_at)
    end
  end

  describe 'POST /api/v1/channels_microsoft365/verify/ID', aggregate_failures: true, authenticated_as: :admin do
    let(:channel) { create(:microsoft365_channel) }
    let(:group)   { create(:group) }

    before do
      Channel.where(area: 'Microsoft365::Account').each(&:destroy)
    end

    it 'updates inbound options of the channel' do
      post "/api/v1/channels_microsoft365_verify/#{channel.id}", params: { group_id: group.id, options: { folder: 'SomeFolder', keep_on_server: 'true', archive: 'true', archive_before: '2025-01-01T00.00.000Z', archive_state_id: Ticket::State.find_by(name: 'open').id } }
      expect(response).to have_http_status(:ok)

      channel.reload

      expect(channel).to have_attributes(
        group_id: group.id,
        options:  include(
          inbound: include(
            options: include(
              folder:           'SomeFolder',
              keep_on_server:   'true',
              archive:          'true',
              archive_before:   '2025-01-01T00.00.000Z',
              archive_state_id: Ticket::State.find_by(name: 'open').id.to_s,
            )
          )
        )
      )
    end
  end
end
