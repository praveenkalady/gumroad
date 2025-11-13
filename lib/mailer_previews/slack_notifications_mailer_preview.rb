# frozen_string_literal: true

class SlackNotificationsMailerPreview < ActionMailer::Preview
  def notification_awards
    SlackNotificationsMailer.notification(
      room_name: "awards",
      sender: "Gumroad Awards",
      message_text: <<~MSG.strip
        <Jane Doe> has crossed $1M in earnings 🎉
        • Name: Jane Doe
        • Username: janedoe
        • Email: jane@example.com
      MSG
    )
  end
end
