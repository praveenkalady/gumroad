# frozen_string_literal: true

class SlackNotificationsMailerPreview < ActionMailer::Preview
  def notification_awards
    SlackNotificationsMailer.notification(
      room_name: "awards",
      sender: "Gumroad Awards",
      message_text: <<~MSG.strip,
        <Jane Doe> has crossed $1M in earnings 🎉
        • Name: Jane Doe
        • Username: janedoe
        • Email: jane@example.com
      MSG
      attachments: [
        {
          title: "Creator Profile",
          url: "https://gumroad.com/janedoe",
          text: "View full creator profile"
        },
        {
          title: "Earnings Breakdown",
          text: "Products: $850K, Subscriptions: $150K"
        }
      ]
    )
  end
end
