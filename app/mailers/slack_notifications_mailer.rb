# frozen_string_literal: true

class SlackNotificationsMailer < ApplicationMailer
  layout "layouts/email"

  def notification(room_name:, sender:, message_text:, attachments: [])
    @room_name = room_name
    @sender = sender
    @message_text = message_text
    @attachments = attachments

    notifications_email = GlobalConfig.get("NOTIFICATIONS_EMAIL_ADDRESS")
    return if notifications_email.blank?

    mail(
      to: notifications_email,
      from: NOREPLY_EMAIL,
      subject: email_subject
    )
  end

  private

  def email_subject
    "[Gumroad Notifications][#{chat_room_display_name}] #{subject_body}".strip
  end

  def chat_room_display_name
    channel_name = slack_channel_name.presence || @room_name.to_s
    channel_name = channel_name.sub(/^gumroad-/, "")
    channel_name.tr("_", " ").split.map(&:capitalize).join(" ")
  end

  def slack_channel_name
    slack_config = CHAT_ROOMS[@room_name.to_sym]&.dig(:slack)
    slack_config&.dig(:channel)
  end

  def subject_body
    first_line = @message_text.to_s.split("\n", 2).first.to_s.strip
    first_line.presence || @sender.to_s
  end
end
