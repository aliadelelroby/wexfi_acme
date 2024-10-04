class Account {
  constructor(email, registration, privateKey, keyType = "4096") {
    this.email = email;
    this.registration = registration;
    this.privateKey = privateKey;
    this.keyType = keyType;
  }

  toJSON() {
    return {
      Email: this.email,
      Registration: this.registration,
      PrivateKey: this.encodeKey(this.privateKey),
      KeyType: this.keyType,
    };
  }

  encodeKey(key) {
    return Buffer.from(key).toString("base64");
  }
}

module.exports = Account;
