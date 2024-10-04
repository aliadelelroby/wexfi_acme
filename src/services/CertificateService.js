const config = require("../config/config");
const letsEncryptService = require("./LetsEncryptService");
const logger = require("../utils/logger");

class CertificateService {
  async renewAllCertificates() {
    const certificates = [];

    for (const domain of config.domains) {
      try {
        let cert;
        if (typeof domain === "string") {
          cert = await letsEncryptService.getCertificate(domain);
          cert.domain = { main: domain };
        } else if (domain.main && domain.sans) {
          cert = await letsEncryptService.getCertificate(
            domain.main,
            domain.sans
          );
          cert.domain = { main: domain.main, sans: domain.sans };
        }

        if (cert) {
          // Format and encode certificate (including the full chain) and key
          cert.certificate = this.formatAndEncodeCertificateChain(
            cert.certificate,
            cert.chain
          );
          cert.key = this.formatAndEncodeKey(cert.key);

          certificates.push(cert);
        }
      } catch (error) {
        logger.error(
          `Failed to renew certificate for ${JSON.stringify(domain)}: ${
            error.message
          }`
        );
      }
    }

    return certificates;
  }

  formatAndEncodeCertificateChain(certificate, chain) {
    const pemCertificate = this.formatPEM(certificate, "CERTIFICATE");
    const pemChain = chain
      .map((cert) => this.formatPEM(cert, "CERTIFICATE"))
      .join("\n");
    const fullChain = pemCertificate + "\n" + pemChain;
    return Buffer.from(fullChain).toString("base64");
  }

  formatAndEncodeKey(key) {
    const pemKey = this.formatPEM(key, "RSA PRIVATE KEY");
    return Buffer.from(pemKey).toString("base64");
  }

  formatPEM(data, type) {
    const pemHeader = `-----BEGIN ${type}-----\n`;
    const pemFooter = `\n-----END ${type}-----`;
    const pemContent = data.match(/.{1,64}/g).join("\n");
    return pemHeader + pemContent + pemFooter;
  }
}

module.exports = new CertificateService();
