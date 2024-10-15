const letsEncryptService = require("./LetsEncryptService");
const config = require("../config/config");
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
          cert.certificate = this.encodeCertificateChain(
            cert.certificate,
            cert.chain
          );
          cert.key = this.encodeKey(cert.key);

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

  encodeCertificateChain(certificate, chain) {
    if (!Array.isArray(chain)) {
      logger.warn(`Chain is not an array for certificate: ${certificate}`);
      return Buffer.from(certificate).toString("base64");
    }
    const fullChain = [certificate, ...chain].join("\n");
    return Buffer.from(fullChain).toString("base64");
  }

  encodeKey(key) {
    return Buffer.from(key).toString("base64");
  }
}

module.exports = new CertificateService();
