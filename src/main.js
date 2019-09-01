// 创建 bin 脚本, 配置 package 中 bid
// npm link
// npx eslint --init
// 1.解析用户的参数
const path = require('path');
const program = require('commander');
const { version } = require('./constants');

const mapActions = {
  create: {
    alias: 'c',
    description: 'create xv project',
    example: [
      'xv-cli create <project-name>',

    ]
  },
  config: {
    alias: 'conf',
    description: 'config project variable',
    example: [
      'xv-cli config set <k> <v>',
      'xv-cli config get <k>',
    ]
  },
  '*': {
    alias: '',
    description: 'command not found',
    example: []
  }
};

Reflect.ownKeys(mapActions).forEach((action) => {
  program.command(action)
    .alias(mapActions[action].alias) // 解析命令别名
    .description(mapActions[action].description) // 命令对应的描述
    .action(() => {
      if (action === '*') {
        console.log(mapActions[action].description);
      } else { // create config ...
        require(path.resolve(__dirname, action))(...process.argv.slice(3));
      }
    })
});
// 监听用户的 help 事件
program.on('--help', () => {
  console.log('\nexample: ')
  Reflect.ownKeys(mapActions).forEach((action) => {
    mapActions[action].example.forEach(example => {
      console.log(`  ${example}`);
    })
  });
})
// 解析传递参数
program.version(version).parse(process.argv);

// console.log(process.argv)
