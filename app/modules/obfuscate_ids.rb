# frozen_string_literal: true

require "openssl"
require "base64"

module ObfuscateIds
  MAX_BYTES_FOR_NUMERIC_ENCRYPTION = 30

  # Lazy load CIPHER_KEY to avoid race conditions with Rails credentials loading
  def self.cipher_key
    # Prefer explicit config; fallback to Rails secret_key_base so test/dev don't error
    @cipher_key ||= GlobalConfig.get("OBFUSCATE_IDS_CIPHER_KEY") || Rails.application.secret_key_base
  end

  # Lazy load NUMERIC_CIPHER_KEY to avoid race conditions with Rails credentials loading  
  def self.numeric_cipher_key
    @numeric_cipher_key ||= GlobalConfig.get("OBFUSCATE_IDS_NUMERIC_CIPHER_KEY").to_i
  end

  def self.encrypt(id, padding: true)
    c = cipher.encrypt
    c.key = Digest::SHA256.digest(cipher_key)
    Base64.urlsafe_encode64(c.update(id.to_s) + c.final, padding:)
  end

  def self.cipher
    OpenSSL::Cipher.new("aes-256-cbc")
  end

  def self.decrypt(id)
    c = cipher.decrypt
    c.key = Digest::SHA256.digest(cipher_key)
    begin
      (c.update(Base64.urlsafe_decode64(id.to_s)) + c.final).to_i
    rescue ArgumentError, OpenSSL::Cipher::CipherError => e
      Rails.logger.warn "could not decrypt #{id}: #{e.message} #{e.backtrace}"
      nil
    end
  end

  # Public: Encrypt id using NUMERIC_CIPHER_KEY
  #
  # id - id to be encrypted
  #
  # Examples
  #
  #   encrypt_numeric(1)
  #   # => 302841629
  #
  # Returns encrypted numeric id
  def self.encrypt_numeric(id)
    raise ArgumentError, "Numeric encryption does not support ids greater than #{max_numeric_id}" if id > max_numeric_id

    extended_and_reversed_binary_id = id.to_s(2).rjust(MAX_BYTES_FOR_NUMERIC_ENCRYPTION, "0")
    binary_id = xor(extended_and_reversed_binary_id, numeric_cipher_key.to_s(2), 30).reverse
    binary_id.to_i(2)
  end

  # Public: Decrypt id using NUMERIC_CIPHER_KEY
  #
  # id - id to be decrypted
  #
  # Examples
  #
  #   decrypt_numeric(302841629)
  #   # => 1
  #
  # Returns decrypted numeric id
  def self.decrypt_numeric(encrypted_id)
    binary_id = encrypted_id.to_s(2).rjust(MAX_BYTES_FOR_NUMERIC_ENCRYPTION, "0").reverse
    extended_binary_id = xor(binary_id, numeric_cipher_key.to_s(2), MAX_BYTES_FOR_NUMERIC_ENCRYPTION)
    extended_binary_id.to_i(2)
  end

  # Private: Maximum numeric id that can be encrypted
  #
  # Returns integer
  def self.max_numeric_id
    (2**MAX_BYTES_FOR_NUMERIC_ENCRYPTION) - 1
  end

  private_class_method :max_numeric_id

  # Private: Bitwise xor of two binary strings of length n
  #
  # binary_string_a, binary_string_b - strings to be xor'd
  # n - number of bits in strings
  #
  # Example
  #
  #   xor("1000", "0011", 4)
  #   # => "1011"
  #
  # Returns string that is xor of inputs
  def self.xor(binary_string_a, binary_string_b, n)
    ((0..n - 1).map { |index| (binary_string_a[index].to_i ^ binary_string_b[index].to_i) }).join("")
  end

  private_class_method :xor
end
