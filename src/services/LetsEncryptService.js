const acme = require("acme-client");
const config = require("../config/config");
const Account = require("../models/Account");
const Certificate = require("../models/Certificate");
const logger = require("../utils/logger");
const dns = require("dns").promises;
const readline = require("readline");

class LetsEncryptService {
  constructor() {
    this.client = null;
    this.account = null;
    this.accountKey = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async init() {
    logger.info("Initializing LetsEncrypt service...");
    this.accountKey = await acme.forge.createPrivateKey();
    this.client = new acme.Client({
      directoryUrl:
        process.env.NODE_ENV === "production"
          ? acme.directory.letsencrypt.production
          : acme.directory.letsencrypt.staging,
      accountKey: this.accountKey,
    });

    logger.info("Creating ACME account...");
    const account = await this.client.createAccount({
      termsOfServiceAgreed: true,
      contact: [`mailto:${config.email}`],
    });

    this.account = new Account(
      config.email,
      account,
      this.accountKey.toString(),
      "4096"
    );

    logger.info("LetsEncrypt account created successfully");
  }

  async getCertificate(domain) {
    logger.info(`Starting certificate acquisition for ${domain}`);
    try {
      logger.info(`Generating CSR for ${domain}`);
      const [key, csr] = await acme.forge.createCsr({
        commonName: domain,
      });

      logger.info(`Initiating ACME challenge for ${domain}`);
      const cert = await this.client.auto({
        csr,
        email: config.email,
        termsOfServiceAgreed: true,
        challengePriority: ["dns-01"],
        challengeCreateFn: this.challengeCreateFn.bind(this),
        challengeRemoveFn: this.challengeRemoveFn.bind(this),
      });

      logger.info(`Certificate acquired successfully for ${domain}`);
      return new Certificate({ main: domain }, cert, key.toString(), "default");
    } catch (error) {
      logger.error(`Error getting certificate for ${domain}: ${error.message}`);
      throw error;
    }
  }

  async challengeCreateFn(authz, challenge, keyAuthorization) {
    const domain = authz.identifier.value;
    const subdomain =
      domain.split(".").length === 2 ? null : domain.split(".")[0];
    logger.info(`Challenge created for ${domain}`);
    logger.info(`Challenge type: ${challenge.type}`);
    logger.info(
      `DNS record name: _acme-challenge${subdomain ? `.${subdomain}` : ""}`
    );
    logger.info(`DNS record value: ${keyAuthorization}`);

    console.log("=== DNS Challenge Instructions ===");
    console.log(
      "To complete the ACME challenge, add the following DNS record:"
    );
    console.log(`Type: TXT`);
    console.log(`Name: _acme-challenge${subdomain ? `.${subdomain}` : ""}`);
    console.log(`Value: ${keyAuthorization}`);
    console.log("Please note:");
    console.log(
      "1. The record must be added to your domain's DNS configuration."
    );
    console.log("2. You only need to add the TXT record for the subdomain.");
    console.log(
      "3. It may take some time for DNS changes to propagate (usually 5-30 minutes)."
    );
    console.log(
      "4. Do not remove this record until the certificate is issued."
    );
    console.log("===============================");

    // Wait for user to confirm DNS record has been added
    await new Promise((resolve) => {
      this.rl.question(
        "Press Enter after you've added the DNS record...",
        resolve
      );
    });

    // Wait for DNS propagation
    await this.waitForDNSPropagation(domain, keyAuthorization);
  }

  async challengeRemoveFn(authz, challenge, keyAuthorization) {
    const domain = authz.identifier.value;
    logger.info(`Challenge removed for ${domain}`);
    logger.info(`DNS record name: _acme-challenge.${domain}`);

    console.log("=== DNS Challenge Cleanup Instructions ===");
    console.log(
      "The ACME challenge is complete. You can now remove the following DNS record:"
    );
    console.log(`Type: TXT`);
    console.log(`Name: _acme-challenge.${domain}`);
    console.log("Please note:");
    console.log(
      "1. Removing this record is optional but recommended for DNS hygiene."
    );
    console.log(
      "2. If you plan to renew the certificate later, you may leave the record in place."
    );
    console.log("===============================");
  }

  async waitForDNSPropagation(domain, expectedValue) {
    const maxAttempts = 20;
    const delayBetweenAttempts = 60000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const dnsRecords = await this.checkDNSRecord(domain);
        if (dnsRecords.includes(expectedValue)) {
          logger.info(`DNS record propagated for ${domain}`);
          return;
        }
      } catch (error) {
        logger.warn(
          `Error checking DNS record for ${domain}: ${error.message}`
        );
      }

      logger.info(
        `DNS record not propagated yet for ${domain}. Attempt ${attempt}/${maxAttempts}`
      );
      await new Promise((resolve) => setTimeout(resolve, delayBetweenAttempts));
    }

    throw new Error(
      `DNS record did not propagate within the expected time for ${domain}`
    );
  }

  async checkDNSRecord(domain) {
    try {
      const recordName = `_acme-challenge.${domain}`;
      const records = await dns.resolveTxt(recordName);
      return records.flat();
    } catch (error) {
      if (
        error.code === "ENODATA" ||
        error.code === "NXDOMAIN" ||
        error.code === "ENOTFOUND"
      ) {
        return []; // No TXT records found
      }
      throw error;
    }
  }
}

module.exports = new LetsEncryptService();
