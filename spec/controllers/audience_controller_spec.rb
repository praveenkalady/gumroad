# frozen_string_literal: true

require "spec_helper"
require "shared_examples/authorize_called"

describe AudienceController do
  let(:seller) { create(:named_seller) }

  include_context "with user signed in as admin for seller"

  describe "GET index" do
    it_behaves_like "authorize called for action", :get, :index do
      let(:record) { :audience }
    end

    it "sets follower count correctly if there are no followers" do
      get :index
      expect(assigns(:total_follower_count)).to eq 0
    end

    it "sets follower count correctly if there are followers" do
      @follower = create(:active_follower, user: seller)

      get :index
      expect(assigns(:total_follower_count)).to eq 1
    end

    it "sets the last viewed dashboard cookie" do
      get :index

      expect(response.cookies["last_viewed_dashboard"]).to eq "audience"
    end
  end

  describe "GET index with date params" do
    it "gets audience data range from start_time to end_time" do
      start_time = "Mon Apr 8 2013 22:40:18 GMT-0700 (PDT)"
      end_time = "Wed Apr 10 2013 22:40:18 GMT-0700 (PDT)"
      expected_start_time = Date.parse(start_time)
      expected_end_time = Date.parse(end_time)
      expect_any_instance_of(CreatorAnalytics::Following).to receive(:by_date).with(start_date: expected_start_time, end_date: expected_end_time).and_call_original
      get :index, params: { start_time:, end_time: }
      expect(controller.instance_variable_get(:@audience_data)).to_not be_nil
    end

    it "accepts 'from' and 'to' params" do
      expect_any_instance_of(CreatorAnalytics::Following).to receive(:by_date).with(start_date: Date.new(2025, 11, 25), end_date: Date.new(2025, 12, 25)).and_call_original
      get :index, params: { from: "2025-11-25", to: "2025-12-25" }
      expect(controller.instance_variable_get(:@audience_data)).to_not be_nil
    end

    describe "when start_time or end_time is invalid" do
      it "gets audience data range from 30 days ago to today" do
        now = DateTime.current
        expected_start_time = now.to_date - 30.days
        expected_end_time = now.to_date
        expect_any_instance_of(CreatorAnalytics::Following).to receive(:by_date).with(start_date: expected_start_time, end_date: expected_end_time).and_call_original
        get :index
        expect(controller.instance_variable_get(:@audience_data)).to_not be_nil
      end
    end
  end

  describe "POST export" do
    it_behaves_like "authorize called for action", :post, :export do
      let(:record) { :audience }
    end

    let!(:follower) { create(:active_follower, user: seller) }
    let(:options) { { "followers" => true, "customers" => false, "affiliates" => false } }

    it "enqueues a job for sending the CSV" do
      post :export, params: { options: options }, as: :json
      expect(Exports::AudienceExportWorker).to have_enqueued_sidekiq_job(seller.id, seller.id, options)

      expect(response).to have_http_status(:ok)
    end

    context "when admin is signed in and impersonates seller" do
      let(:admin_user) { create(:admin_user) }

      before do
        sign_in admin_user
        controller.impersonate_user(seller)
      end

      it "queues sidekiq job for the admin" do
        post :export, params: { options: options }, as: :json
        expect(Exports::AudienceExportWorker).to have_enqueued_sidekiq_job(seller.id, admin_user.id, options)

        expect(response).to have_http_status(:ok)
      end
    end
  end

end
