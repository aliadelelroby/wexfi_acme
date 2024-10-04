const letsEncryptService = require("./services/LetsEncryptService");
const certificateService = require("./services/CertificateService");
const fileService = require("./services/FileService");
const logger = require("./utils/logger");

async function main() {
  try {
    await letsEncryptService.init();
    const certificates = await certificateService.renewAllCertificates();
    await fileService.writeOutputFile(letsEncryptService.account, certificates);
    logger.info("Certificate renewal process completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error(`Error in main process: ${error.message}`);
    process.exit(1);
  }
}

main();
