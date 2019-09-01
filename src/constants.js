// 放置常量
const path = require('path');
const { version } = require('../package.json');
// 存储模板位置
// const downloadDireactory = process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE'] + './template';
const downloadDireactory = path.join(__dirname, '../cache-template');
module.exports = {
  version,
  downloadDireactory
}
