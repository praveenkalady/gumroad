# frozen_string_literal: true

class AnalyticsController < Sellers::BaseController

  after_action :set_dashboard_preference_to_sales, only: :index
  before_action :check_payment_details, only: :index

  layout "inertia", only: [:index]

  def index
    authorize :analytics

    # Get date range from params or use defaults
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


    # Fetch analytics data
    if Feature.active?(:use_creator_analytics_web_in_controller)
      analytics_web = CreatorAnalytics::Web.new(user: current_seller, dates: (start_date..end_date).to_a)
      by_referral_data = analytics_web.by_referral
      by_state_data = analytics_web.by_state
    else
      caching_proxy = CreatorAnalytics::CachingProxy.new(current_seller)
      by_referral_data = caching_proxy.data_for_dates(start_date, end_date, by: :referral)
      by_state_data = caching_proxy.data_for_dates(start_date, end_date, by: :state)
    end

    @analytics_props = AnalyticsPresenter.new(seller: current_seller).page_props.merge(
      by_referral_data: by_referral_data,
      by_state_data: by_state_data,
      start_date: start_date.to_s,
      end_date: end_date.to_s
    )

    LargeSeller.create_if_warranted(current_seller)

    render inertia: "Analytics/Index",
           props: { analytics_props: @analytics_props }
  end

  protected
    def set_title
      @title = "Analytics"
    end
end
