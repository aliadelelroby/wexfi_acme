const fs = require("fs").promises;
const config = require("../config/config");
const logger = require("../utils/logger");

class FileService {
  async writeOutputFile(account, certificates) {
    const output = {
      letsencrypt: {
        Account: account.toJSON(),
        Certificates: certificates.map((cert) => cert.toJSON()),
      },
    };

    try {
      console.log("===============================");
      await fs.writeFile(config.outputPath, JSON.stringify(output, null, 2));
      logger.info(`Output file written to ${config.outputPath}`);
    } catch (error) {
      logger.error(`Error writing output file: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new FileService();
