# Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

module Zammad
  module ProcessDebug

    def self.dump_thread_status
      Thread.list.each do |thread|
        name = "PID: #{Process.pid} Thread: TID-#{thread.object_id.to_s(36)}"
        name += " #{thread['label']}" if thread['label']
        name += " #{thread.name}" if thread.respond_to?(:name) && thread.name
        backtrace = thread.backtrace || ['<no backtrace available>']

        # rubocop:disable Rails/Output
        puts name
        puts(backtrace.map { |bt| "  #{bt}" })
        # rubocop:enable Rails/Output
      end
    end

    def self.install_thread_status_handler
      Signal.trap 'SIGWINCH' do
        Zammad::ProcessDebug.dump_thread_status
      end
    end
  end
end
