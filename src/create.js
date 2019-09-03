// - commander: 参数解析
// - inquirer: 交互式命令行
// - download-git-repo : 在 git 中下载模板
// - chalk: 打印颜色
// - metalsmith: 编译模板
// - consolidate
const Axios = require('axios');
const ora = require('ora');
const { downloadDireactory } = require('./constants');
const path = require('path');
const fs = require('fs')
const { promisify } = require('util');
const Inquirer = require('inquirer');
const MetalSmith = require('metalsmith'); // 遍历文件夹
// 同意了所有的模板引擎
let { render } = require('consolidate').ejs;
let downloadDirGitRepo = require('download-git-repo');
let ncp = require('ncp')
downloadDirGitRepo = promisify(downloadDirGitRepo);
ncp = promisify(ncp);
render = promisify(render);

// create 所有逻辑
// 功能: 创建项目

// 当去当前所有项目 列出来, 让用户去选 安装哪个项目
// 选完显示 version

//  https://api.github.com/orgs/xv-town/repos 获取组织下的仓库
 
// 可能还需要用户配置一些数据 来结合渲染我的项目

// 获取项目仓库列表
const fetchRepotList = async () => {
  const { data } = await Axios.get('https://api.github.com/orgs/xv-town/repos');
  return data;
}
const fetchTagList = async (repo) => {
  const { data } = await Axios.get(`https://api.github.com/repos/xv-town/${repo}/tags`);
  return data;
}
const downloadGitRepo = async (repo, tag) => {
  let api = `xv-town/${repo}`
  if (tag) {
    api += `#${tag}`;
  }
  let dest = `${downloadDireactory}/${repo}/${tag}`;
  await downloadDirGitRepo(api, dest); // 下载到输出路径
  return dest;
}

// 封装 loading 效果
const waiFnLoading = (fn, message) => async (...args) => {
  let spinner = ora(message)
  spinner.start();
  let result = await fn(...args);
  spinner.succeed()
  return result;
}

module.exports = async (projectName) => {
  let repos = await waiFnLoading(fetchRepotList, 'fetch template ...')();
  repos = repos.map(item => item.name);
  // console.log(repos)
  // 1. 选择模板
  let { repo } = await Inquirer.prompt({
    name: 'repo', // 获取选择后的结果
    type: 'list',
    message: 'please choise a template to create project',
    choices: repos
  })
  // console.log(repo)
  // 2. 通过当前的项目拉取对应的版本
  let tags = await waiFnLoading(fetchTagList, 'fetch tags ...')(repo);
  tags = tags.map(item => item.name);
  // console.log(tags)

  let { tag } = await Inquirer.prompt({
    name: 'tag', // 获取选择后的结果
    type: 'list',
    message: 'please choise a template to create project',
    choices: tags
  })
  // console.log(repo, tag)

  // 3. 下载模板放在临时目录, 以备后期使用
  const cacheDir = await waiFnLoading(downloadGitRepo, 'download template')(repo, tag);
  // console.log(cacheDir);

  // 4. 下载好后进行拷贝
  // 把 template 下的文件 拷贝到执行命令的目录下
  // 判断是否已经存在同名目录 如果存在则提示已经存在
  if (!fs.existsSync(path.join(cacheDir, 'ask.js'))) { // 简单模板
    ncp(cacheDir, path.resolve(projectName))
  } else { // 复杂模板
    // (1) 让用户填写信息
    await new Promise((resolve, reject) => {
      MetalSmith(__dirname) // 如果你传入路径 他默认会遍历当前路径下的 src 文件夹
        .source(cacheDir)
        .destination(path.resolve(projectName))
        .use(async (files, meta, done) => {
          const asks = require(path.join(cacheDir, 'ask.js'));
          const renderOptions = await Inquirer.prompt(asks)
          const metaData = meta.metadata();
          Object.assign(metaData, renderOptions);
          delete files['ask.js']
          done();
        })
        .use((files, meta, done) => {
          const renderOptions = meta.metadata();
          // 根据用户输入 下载模板
          Reflect.ownKeys(files).forEach(async file => {
            // 要处理模板 <%
            if (file.includes('js') || file.includes('json')) {
              let content = files[file].contents.toString();
              if (content.includes('<%')) {
                content = await render(content, renderOptions)
                files[file].contents = Buffer.from(content); // 自动输出
              }
            }
          })
          console.log(meta.metadata())
          done();
        })
        .build(err => {
          if (err) {
            reject(err)
          } else {
            resolve();
          }
        });
    }).catch(err => {
      console.log(err)
    })
  }
};
