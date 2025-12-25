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

    it "uses default date range when no params provided" do
      get :index

      end_date = DateTime.current.to_date
      start_date = end_date - 30.days

      expect(controller.instance_variable_get(:@audience_data)).to_not be_nil
    end

    it "accepts 'from' and 'to' params" do
      get :index, params: { from: "2025-11-25", to: "2025-12-25" }

      expect(controller.instance_variable_get(:@audience_data)).to_not be_nil
    end

    it "accepts 'start_time' and 'end_time' params for backward compatibility" do
      get :index, params: { start_time: "2025-11-25", end_time: "2025-12-25" }

      expect(controller.instance_variable_get(:@audience_data)).to_not be_nil
    end

    it "falls back to defaults when invalid date params provided" do
      get :index, params: { from: "invalid", to: "invalid" }

      expect(controller.instance_variable_get(:@audience_data)).to_not be_nil
    end

    it "sets the last viewed dashboard cookie" do
      get :index

      expect(response.cookies["last_viewed_dashboard"]).to eq "audience"
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
