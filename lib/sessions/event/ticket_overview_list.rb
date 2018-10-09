class Sessions::Event::TicketOverviewList < Sessions::Event::Base

  def run
    return if !valid_session?

    Sessions::Backend::TicketOverviewList.reset(@session['id'])
  end

end
