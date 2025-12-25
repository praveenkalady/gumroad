# frozen_string_literal: true

class AudienceController < Sellers::BaseController

  after_action :set_dashboard_preference_to_audience, only: :index
  before_action :check_payment_details, only: :index
  layout "inertia"

  def index
    authorize :audience

    @total_follower_count = current_seller.audience_members.where(follower: true).count

    # Fetch audience data for the requested or default date range
    start_date = nil
    end_date = nil

    start_param = params[:from].presence || params[:start_time].presence
    end_param = params[:to].presence || params[:end_time].presence

    if start_param && end_param
      begin
        start_date = Date.parse(start_param.to_s)
        end_date = Date.parse(end_param.to_s)
      rescue ArgumentError, TypeError => e
        Rails.logger.warn("Invalid date params: from/start_time=#{start_param}, to/end_time=#{end_param}, error=#{e.message}")
        start_date = nil
        end_date = nil
      end
    end

    # Use defaults if parsing failed or params not present
    if start_date.nil? || end_date.nil?
      end_date = DateTime.current.to_date
      start_date = end_date - 30.days
    end

    @audience_data = CreatorAnalytics::Following.new(current_seller).by_date(start_date: start_date, end_date: end_date)

    render inertia: "Audience/Index", props: {
      total_follower_count: @total_follower_count,
      audience_data: @audience_data,
      start_date: start_date.to_s,
      end_date: end_date.to_s
    }
  end

  def export
    authorize :audience

    options = params.required(:options)
                 .permit(:followers, :customers, :affiliates)
                 .to_hash

    Exports::AudienceExportWorker.perform_async(current_seller.id, (impersonating_user || current_seller).id, options)

    head :ok
  end

  protected
    def set_title
      @title = "Analytics"
    end
end
