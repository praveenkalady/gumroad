# frozen_string_literal: true

require "spec_helper"
require "shared_examples/authorize_called"

describe AnalyticsController do
  render_views

  let(:seller) { create(:named_seller) }

  include_context "with user signed in as admin for seller"

  describe "GET index" do
    it_behaves_like "authorize called for action", :get, :index do
      let(:record) { :analytics }
    end

    context "stripe connect requirements" do
      before do
        create(:merchant_account, user: seller)
        $redis.sadd(RedisKey.user_ids_with_payment_requirements_key, seller.id)
        @stripe_account = double
        allow(Stripe::Account).to receive(:retrieve).and_return(@stripe_account)
      end

      it "does not redirect to payout settings page if user not part of user_ids_with_payment_requirements_key" do
        $redis.srem(RedisKey.user_ids_with_payment_requirements_key, seller.id)

        get :index

        expect(response).to_not redirect_to(settings_payments_path)
      end

      it "redirects to payout settings page if compliance requests exist" do
        create(:user_compliance_info_request, user: seller, state: :requested)

        get :index

        expect(response).to redirect_to(settings_payments_path)
        expect(flash[:notice]).to eq("Urgent: We are required to collect more information from you to continue processing payments.")
      end

      it "redirects to payout settings page if capabilities missing" do
        allow(@stripe_account).to receive(:capabilities).and_return({})
        get :index

        expect(response).to redirect_to(settings_payments_path)
        expect(flash[:notice]).to eq("Urgent: We are required to collect more information from you to continue processing payments.")
      end

      it "removes from users that need requirements if capabilities are satisfied" do
        allow(@stripe_account).to receive(:capabilities).and_return({ card_payments: "active",
                                                                      legacy_payments: "active",
                                                                      transfers: "active" })

        get :index

        expect(response).to_not redirect_to(settings_payments_path)
        expect($redis.sismember(RedisKey.user_ids_with_payment_requirements_key, seller.id)).to eq(false)
      end
    end

    describe "date parameter handling" do
      it "uses default date range when no params provided" do
        get :index

        expect(assigns(:analytics_props)).to_not be_nil
        expect(assigns(:analytics_props)[:start_date]).to_not be_nil
        expect(assigns(:analytics_props)[:end_date]).to_not be_nil
      end

      it "accepts 'from' and 'to' params" do
        get :index, params: { from: "2025-11-25", to: "2025-12-25" }

        expect(assigns(:analytics_props)[:start_date]).to eq("2025-11-25")
        expect(assigns(:analytics_props)[:end_date]).to eq("2025-12-25")
      end

      it "accepts 'start_time' and 'end_time' params for backward compatibility" do
        get :index, params: { start_time: "2025-11-25", end_time: "2025-12-25" }

        expect(assigns(:analytics_props)[:start_date]).to eq("2025-11-25")
        expect(assigns(:analytics_props)[:end_date]).to eq("2025-12-25")
      end

      it "falls back to defaults when invalid date params provided" do
        get :index, params: { from: "invalid", to: "invalid" }

        expect(assigns(:analytics_props)).to_not be_nil
        expect(assigns(:analytics_props)[:start_date]).to_not be_nil
        expect(assigns(:analytics_props)[:end_date]).to_not be_nil
      end
    end

    describe "when user is not qualified for analytics" do
      before :each do
        allow(controller.logged_in_user).to receive(:visible).and_return([])
        allow(controller.logged_in_user).to receive(:successful_or_preorder_authorization_successful).and_return([])
      end

      it "assigns props" do
        get :index
        expect(assigns(:analytics_props)).to_not be(nil)
      end
    end

    describe "when user is qualified for analytics" do
      before :each do
        allow(controller.logged_in_user).to receive(:visible).and_return([Link.new])
        allow(controller.logged_in_user).to receive(:successful_or_preorder_authorization_successful).and_return([Purchase.new])
        product = create(:product, user: seller)
        create(:purchase, link: product, price_cents: 100, purchase_state: "successful")
      end

      it "sets the last viewed dashboard cookie" do
        get :index

        expect(response.cookies["last_viewed_dashboard"]).to eq "sales"
      end

      it "assigns props" do
        get :index
        expect(assigns(:analytics_props)).to_not be(nil)
      end

      it "does not call prepare_demo" do
        expect(controller).to_not receive(:prepare_demo)
        get :index
      end

      it "attemps to create related LargeSeller record" do
        expect(LargeSeller).to receive(:create_if_warranted).with(controller.current_seller)
        get :index
      end
    end
  end

end
