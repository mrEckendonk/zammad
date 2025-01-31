# Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

require 'rails_helper'

RSpec.describe Channel::Driver::MicrosoftGraphOutbound, :aggregate_failures, integration: true, required_envs: %w[MICROSOFTGRAPH_REFRESH_TOKEN MICROSOFT365_CLIENT_ID MICROSOFT365_CLIENT_SECRET MICROSOFT365_CLIENT_TENANT MICROSOFT365_USER], use_vcr: true do # , retry: 5, retry_wait: 30.seconds do
  let(:channel) do
    create(:microsoft_graph_channel).tap(&:refresh_xoauth2!).tap do |channel|
      VCR.configure do |c|
        c.filter_sensitive_data('<MICROSOFTGRAPH_ACCESS_TOKEN>') { channel.options['outbound']['options']['password'] }
        c.filter_sensitive_data('<MICROSOFT365_USER_ESCAPED>')   { CGI.escapeURIComponent(ENV['MICROSOFT365_USER']) }
      end
    end
  end

  let(:client_access_token) { channel.options['outbound']['options']['password'] }
  let(:client)              { MicrosoftGraph.new(access_token: client_access_token, mailbox: ENV['MICROSOFT365_USER']) }

  describe '.deliver' do
    let(:mail_subject) { "CI test for #{described_class}" }
    let(:mail) do
      {
        to:      ENV['MICROSOFT365_USER'],
        subject: mail_subject,
        body:    'Test email',
      }
    end

    context 'with valid token' do
      it 'sends mail' do
        expect { channel.deliver(mail) }.not_to raise_error
        expect(channel.reload.status_out).to eq('ok')
      end
    end

    context 'without valid token' do
      before do
        channel.options['outbound']['options']['password'] = 'incorrect'
        channel.save!
        allow(channel).to receive(:refresh_xoauth2!)
      end

      it 'raises an error' do
        expect { channel.deliver(mail) }.to raise_error(Channel::DeliveryError)
      end
    end
  end
end
