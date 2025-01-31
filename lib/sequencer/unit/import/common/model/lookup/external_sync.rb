# Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/

class Sequencer::Unit::Import::Common::Model::Lookup::ExternalSync < Sequencer::Unit::Base
  include ::Sequencer::Unit::Import::Common::Model::Mixin::HandleFailure
  prepend ::Sequencer::Unit::Import::Common::Model::Mixin::Skip::Action

  skip_action :skipped

  uses :remote_id, :model_class, :external_sync_source
  provides :instance

  def process
    return if entry.blank?

    state.provide(:instance) do
      model_class.find(entry.o_id)
    end
  rescue => e
    handle_failure(e)
  end

  private

  def entry
    @entry ||= ::ExternalSync.find_by(
      source:    external_sync_source,
      source_id: remote_id,
      object:    model_class.name,
    )
  end
end
