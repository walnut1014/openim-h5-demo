# Implementation Plan

- [ ] 1. 创建部署配置文件
  - 在 `.kiro/deployment/config.json` 创建配置文件，包含远程服务器信息、Git 仓库、构建命令、Nginx 路径等配置
  - 配置应包含：SSH 连接信息（host, port, username）、项目路径、Git 仓库地址、构建输出目录、Nginx 网站根目录、备份目录、最大备份数量等
  - _Requirements: 1.1, 1.2_

- [ ] 2. 创建远程部署脚本
  - [ ] 2.1 创建 Bash 脚本框架和基础函数
    - 在 `.kiro/deployment/deploy.sh` 创建 Bash 脚本模板
    - 实现日志输出函数（log_info, log_error, log_success）
    - 实现错误退出函数（exit_with_error）
    - 添加脚本执行时间记录
    - _Requirements: 1.1, 5.2_

  - [ ] 2.2 实现环境依赖检查函数
    - 实现 `check_dependencies()` 函数检查 Git、Node.js、npm、Nginx 是否安装
    - 检查磁盘空间是否充足（至少 1GB 可用空间）
    - 检查必要目录的读写权限
    - 依赖检查失败时输出清晰的错误信息和安装建议
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 2.3 实现代码同步函数
    - 实现 `sync_code()` 函数处理 Git 代码拉取
    - 判断项目目录是否存在：存在则执行 `git pull`，不存在则执行 `git clone`
    - 处理 Git 操作可能的错误（网络问题、冲突、权限问题）
    - 输出当前 commit hash 和提交信息
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 2.4 实现项目构建函数
    - 实现 `build_project()` 函数执行 npm install 和 npm run build
    - 设置构建超时时间（默认 600 秒）
    - 验证构建产物目录（dist）存在且包含 index.html
    - 构建失败时输出详细的错误日志
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 2.5 实现备份函数
    - 实现 `backup_current()` 函数备份当前 Nginx 目录
    - 使用时间戳创建备份目录名称（格式：YYYY-MM-DD_HHMMSS）
    - 使用 `cp -r` 或 `rsync` 复制文件到备份目录
    - 实现 `cleanup_old_backups()` 函数保留最近 5 个备份，删除更旧的备份
    - _Requirements: 4.1, 4.5_

  - [ ] 2.6 实现部署函数
    - 实现 `deploy_to_nginx()` 函数将构建产物部署到 Nginx 目录
    - 清空 Nginx 目录（保留 .git 等隐藏文件）
    - 复制 dist 目录下所有文件到 Nginx 目录
    - 设置正确的文件权限（文件 644，目录 755）
    - _Requirements: 4.2, 4.3_

  - [ ] 2.7 实现部署验证函数
    - 实现 `verify_deployment()` 函数验证部署结果
    - 检查 index.html 文件存在
    - 检查 assets 目录存在且包含文件
    - 验证文件权限设置正确
    - _Requirements: 4.4_

  - [ ] 2.8 实现主部署流程
    - 实现 `main()` 函数串联所有步骤
    - 按顺序执行：环境检查 → 代码同步 → 构建 → 备份 → 部署 → 验证 → 清理
    - 每个步骤失败时立即终止并输出错误信息
    - 记录总部署时间
    - 输出部署摘要（commit hash、部署时间、访问 URL）
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [ ] 3. 创建本地部署触发脚本
  - [ ] 3.1 创建 Node.js 部署脚本
    - 在 `.kiro/deployment/deploy.js` 创建 Node.js 脚本
    - 读取 config.json 配置文件
    - 使用 MCP SSH 工具或 ssh2 库建立 SSH 连接
    - 将本地的 deploy.sh 脚本上传到远程服务器
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 3.2 实现远程脚本执行和输出显示
    - 在远程服务器上执行 deploy.sh 脚本
    - 实时捕获并显示脚本输出到本地终端
    - 捕获脚本退出码判断部署成功或失败
    - 显示部署总耗时
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 3.3 添加命令行参数支持
    - 支持 `--branch` 参数指定 Git 分支（默认 main）
    - 支持 `--skip-backup` 参数跳过备份步骤
    - 支持 `--verbose` 参数显示详细日志
    - 支持 `--check` 参数仅检查服务器状态不执行部署
    - _Requirements: 1.1_

  - [ ] 3.4 在 package.json 添加部署命令
    - 添加 `"deploy": "node .kiro/deployment/deploy.js"` 到 scripts
    - 添加 `"deploy:check": "node .kiro/deployment/deploy.js --check"` 用于检查服务器状态
    - 更新 README.md 添加部署命令使用说明
    - _Requirements: 1.1_

- [ ] 4. 实现错误处理和日志记录
  - [ ] 4.1 在远程脚本中添加日志文件记录
    - 创建日志目录 `/root/logs/deployment/`
    - 使用 `tee` 命令同时输出到终端和日志文件
    - 日志文件命名格式：`deploy-YYYY-MM-DD.log`
    - 记录每次部署的完整输出
    - _Requirements: 5.5_

  - [ ] 4.2 实现详细的错误信息输出
    - 每个错误场景输出具体的错误原因
    - 提供修复建议（如依赖缺失时提供安装命令）
    - 区分不同类型的错误（连接错误、环境错误、构建错误、部署错误）
    - _Requirements: 5.4, 6.1, 6.2, 6.3_

- [ ] 5. 首次部署配置
  - [ ] 5.1 在远程服务器创建必要目录
    - 创建项目目录 `/root/openim-h5-demo`（如不存在）
    - 创建备份目录 `/root/backups/openim-h5`
    - 创建日志目录 `/root/logs/deployment`
    - 创建 Nginx 网站目录 `/var/www/html/openim-h5`
    - 设置正确的目录权限
    - _Requirements: 2.2, 4.1_

  - [ ] 5.2 配置 Nginx 虚拟主机
    - 创建 Nginx 配置文件 `/etc/nginx/sites-available/openim-h5`
    - 配置网站根目录指向 `/var/www/html/openim-h5`
    - 配置 SPA 路由支持（try_files）
    - 启用配置并重启 Nginx
    - _Requirements: 4.2_

  - [ ] 5.3 配置 SSH 密钥认证
    - 确保本地机器的 SSH 公钥已添加到远程服务器
    - 测试 SSH 连接是否正常
    - 验证可以无密码登录远程服务器
    - _Requirements: 1.2, 1.3_

- [ ] 6. 测试和验证
  - 执行首次完整部署测试
  - 验证网站可以正常访问
  - 测试增量部署（修改代码后再次部署）
  - 测试错误场景（如构建失败、磁盘空间不足）
  - 验证备份文件正确创建
  - 检查日志文件记录完整
  - _Requirements: 所有需求_
