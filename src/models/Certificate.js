class Certificate {
  constructor(domain, certificate, key, store = "default") {
    this.domain = domain;
    this.certificate = certificate;
    this.key = key;
    this.store = store;
  }

  toJSON() {
    return {
      domain: this.domain,
      certificate: this.certificate,
      key: this.key,
      Store: this.store,
    };
  }
}

module.exports = Certificate;
