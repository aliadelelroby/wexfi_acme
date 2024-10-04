const fs = require("fs");
const path = require("path");

class Config {
  constructor() {
    const configPath = path.join(__dirname, "..", "..", "config.json");
    const configData = fs.readFileSync(configPath, "utf8");
    this.config = JSON.parse(configData);
  }

  get email() {
    return this.config.email;
  }

  get domains() {
    return this.config.domains;
  }

  get outputPath() {
    return this.config.outputPath;
  }
}

module.exports = new Config();
