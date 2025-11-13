# frozen_string_literal: true

require "spec_helper"

RSpec.describe SlackNotificationsMailer, type: :mailer do
  let(:notifications_email) { "alerts@gumroad.com" }

  before do
    original_get = GlobalConfig.method(:get)
    allow(GlobalConfig).to receive(:get) do |key, *args|
      if key == "NOTIFICATIONS_EMAIL_ADDRESS"
        notifications_email
      else
        original_get.call(key, *args)
      end
    end
  end

  describe "#notification" do
    it "sends to the configured NOTIFICATIONS_EMAIL_ADDRESS with NOREPLY_EMAIL as from" do
      mail = described_class.notification(
        room_name: "payments",
        sender: "PayPal Top-up",
        message_text: "Balance update"
      )

      expect(mail.to).to eq [notifications_email]
      expect(mail.from).to eq [ApplicationMailer::NOREPLY_EMAIL]
      expect(mail.from.first).to include "noreply@"
    end

    describe "subject line formatting" do
      it "formats subject as [Gumroad Notifications][<room>] <first line>" do
        mail = described_class.notification(
          room_name: "payments",
          sender: "Notifier",
          message_text: "First line\nSecond line"
        )
        expect(mail.subject).to eq "[Gumroad Notifications][Accounting] First line"
      end

      it "maps room name to Slack channel display name" do
        mail = described_class.notification(
          room_name: "awards",
          sender: "Awards Bot",
          message_text: "Milestone reached"
        )
        expect(mail.subject).to include "[Awards]"
      end

      it "falls back to sender name when message is blank or nil" do
        [nil, ""].each do |blank_message|
          mail = described_class.notification(
            room_name: "payments",
            sender: "Fallback Sender",
            message_text: blank_message
          )
          expect(mail.subject).to include "Fallback Sender"
        end
      end
    end

    it "includes room name, sender, and full message text in the body" do
      mail = described_class.notification(
        room_name: "awards",
        sender: "Gumroad Awards",
        message_text: "Jane Doe has reached $1M\nDetails: user_id=123"
      )

      expect(mail.body.encoded).to include "awards"
      expect(mail.body.encoded).to include "Gumroad Awards"
      expect(mail.body.encoded).to include "Jane Doe has reached $1M"
      expect(mail.body.encoded).to include "Details: user_id=123"
    end

    it "includes attachments in the email when provided" do
      attachments = [{ title: "Report", text: "https://s3.example.com/report.csv" }]
      mail = described_class.notification(
        room_name: "payments",
        sender: "Reporter",
        message_text: "Report ready",
        attachments: attachments
      )

      expect(mail.body.encoded).to include "Report"
      expect(mail.body.encoded).to include "https://s3.example.com/report.csv"
    end

  end
end
