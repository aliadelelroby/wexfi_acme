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
      PrivateKey: this.privateKey,
      KeyType: this.keyType,
    };
  }
}

module.exports = Account;
