# frozen_string_literal: true

require "spec_helper"

RSpec.describe SlackMessageWorker do
  describe "#perform" do
    let(:notifications_email) { "notifications@example.com" }
    let(:slack_notifier_double) { instance_double(Slack::Notifier, ping: true) }

    before do
      ActionMailer::Base.deliveries.clear

      original_get = GlobalConfig.method(:get)
      allow(GlobalConfig).to receive(:get) do |key, *args|
        if key == "NOTIFICATIONS_EMAIL_ADDRESS"
          notifications_email
        else
          original_get.call(key, *args)
        end
      end

      allow(Rails.env).to receive(:production?).and_return(true)
      allow(Slack::Notifier).to receive(:new).and_return(slack_notifier_double)
    end

    it "sends an email copy of the Slack notification and posts to Slack" do
      described_class.new.perform("payments", "PayPal Top-up", "PayPal balance needs to be $200,000.00 by Friday\nMore details", "red")

      mail = ActionMailer::Base.deliveries.last
      expect(mail).not_to be_nil
      expect(mail.to).to eq [notifications_email]
      expect(mail.from).to eq [ApplicationMailer::NOREPLY_EMAIL]
      expect(mail.subject).to eq "[Gumroad Notifications][Accounting] PayPal balance needs to be $200,000.00 by Friday"
      expect(mail.body.encoded).to include "PayPal balance needs to be $200,000.00 by Friday"
      expect(mail.body.encoded).to include "More details"

      expect(Slack::Notifier).to have_received(:new).once
      expect(slack_notifier_double).to have_received(:ping).once
    end

    it "does not send email when NOTIFICATIONS_EMAIL_ADDRESS is blank but still posts to Slack" do
      allow(GlobalConfig).to receive(:get).and_wrap_original do |orig, key, *args|
        if key == "NOTIFICATIONS_EMAIL_ADDRESS"
          ""
        else
          orig.call(key, *args)
        end
      end

      described_class.new.perform("payments", "PayPal Top-up", "PayPal balance needs to be $200,000.00 by Friday", "red")

      expect(ActionMailer::Base.deliveries).to be_empty
      expect(Slack::Notifier).to have_received(:new).once
      expect(slack_notifier_double).to have_received(:ping).once
    end

    it "skips sending Slack when the feature flag is active but still sends email" do
      Feature.activate(:skip_slack_notifications)
      described_class.new.perform("payments", "PayPal Top-up", "PayPal balance needs to be $200,000.00 by Friday", "red")

      expect(ActionMailer::Base.deliveries).not_to be_empty
      expect(Slack::Notifier).not_to have_received(:new)

      Feature.deactivate(:skip_slack_notifications)
    end

    it "sends email with attachments and multi-line message using first line in subject" do
      attachments = [{ title: "S3 Report Link", text: "https://s3.amazonaws.com/reports/123" }]

      described_class.new.perform(
        "awards",
        "Milestone Alert",
        "Jane Doe has reached $1M in earnings\nUser ID: 12345\nProfile: https://gumroad.com/janedoe",
        "hotpink",
        { "attachments" => attachments }
      )

      mail = ActionMailer::Base.deliveries.last
      expect(mail.subject).to eq "[Gumroad Notifications][Awards] Jane Doe has reached $1M in earnings"
      expect(mail.body.encoded).to include "User ID: 12345"
      expect(mail.body.encoded).to include "Profile: https://gumroad.com/janedoe"
      expect(mail.body.encoded).to include "S3 Report Link"
      expect(mail.body.encoded).to include "https://s3.amazonaws.com/reports/123"
    end

    it "gracefully handles errors when sending email and logs them" do
      allow_any_instance_of(Mail::Message).to receive(:deliver_now).and_raise(StandardError, "SMTP error")

      expect do
        described_class.new.perform("payments", "Reporter", "Test message", "red")
      end.not_to raise_error
    end

    context "real-world scenarios" do
      it "matches the US multi-state sales tax summary example" do
        described_class.new.perform(
          "payments",
          "US Sales Tax Summary Report",
          "Multi-state summary report for 2025-10 is ready:\nhttps://s3.amazonaws.com/reports/us-states-2025-10.csv",
          "green"
        )

        mail = ActionMailer::Base.deliveries.last
        expect(mail.subject).to eq "[Gumroad Notifications][Accounting] Multi-state summary report for 2025-10 is ready:"
        expect(mail.to).to eq [notifications_email]
        expect(mail.from).to eq [ApplicationMailer::NOREPLY_EMAIL]
      end

      it "matches the PayPal balance notification example" do
        described_class.new.perform(
          "payments",
          "PayPal Top-up",
          "PayPal balance needs to be $200,000.00\nCurrent balance: $125,000.00\nRequired topup: $75,000.00",
          "red"
        )

        mail = ActionMailer::Base.deliveries.last
        expect(mail.subject).to eq "[Gumroad Notifications][Accounting] PayPal balance needs to be $200,000.00"
        expect(mail.body.encoded).to include "Current balance: $125,000.00"
        expect(mail.body.encoded).to include "Required topup: $75,000.00"
      end
    end
  end
end
