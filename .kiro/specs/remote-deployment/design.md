# Design Document - Remote Deployment System

## Overview

本设计文档描述了 openim-h5-demo 项目的远程自动化部署系统。该系统通过 SSH 连接到远程服务器（161.248.14.73:46310），执行代码拉取、依赖安装、项目构建和 Nginx 部署的完整流程。

系统采用脚本化部署方式，在远程服务器上创建一个 Bash 部署脚本，通过本地命令触发远程执行。部署过程包含完整的错误处理、回滚机制和日志记录。

## Architecture

### 系统架构

```
┌─────────────────┐         SSH          ┌──────────────────────┐
│  Local Machine  │ ──────────────────> │   Remote Server      │
│                 │                      │  (161.248.14.73)     │
│  - 部署命令     │                      │                      │
│  - SSH 客户端   │                      │  ┌────────────────┐  │
└─────────────────┘                      │  │ Deployment     │  │
                                         │  │ Script         │  │
                                         │  └────────┬───────┘  │
                                         │           │          │
                                         │           v          │
                                         │  ┌────────────────┐  │
                                         │  │ Git Repository │  │
                                         │  │ (local clone)  │  │
                                         │  └────────┬───────┘  │
                                         │           │          │
                                         │           v          │
                                         │  ┌────────────────┐  │
                                         │  │ Build Process  │  │
                                         │  │ (npm install + │  │
                                         │  │  npm build)    │  │
                                         │  └────────┬───────┘  │
                                         │           │          │
                                         │           v          │
                                         │  ┌────────────────┐  │
                                         │  │ Nginx Web Root │  │
                                         │  │ (/var/www/html)│  │
                                         │  └────────────────┘  │
                                         └──────────────────────┘
```

### 部署流程

1. **连接阶段**: 本地通过 SSH 连接到远程服务器
2. **准备阶段**: 检查环境依赖（Git、Node.js、npm、Nginx）
3. **代码同步阶段**: 拉取或克隆最新代码
4. **构建阶段**: 安装依赖并执行构建
5. **备份阶段**: 备份当前 Nginx 目录
6. **部署阶段**: 将构建产物复制到 Nginx 目录
7. **验证阶段**: 验证部署结果
8. **清理阶段**: 清理临时文件和旧备份

## Components and Interfaces

### 1. 本地部署触发器 (Local Deployment Trigger)

**职责**: 提供用户界面，触发远程部署流程

**实现方式**: 
- Node.js 脚本或 npm script
- 使用 SSH 客户端库连接远程服务器
- 执行远程部署脚本并实时显示输出

**接口**:
```typescript
interface DeploymentTrigger {
  // 执行部署
  deploy(options: DeployOptions): Promise<DeploymentResult>
  
  // 检查远程服务器状态
  checkServerStatus(): Promise<ServerStatus>
}

interface DeployOptions {
  branch?: string          // Git 分支，默认 main
  skipBackup?: boolean     // 是否跳过备份
  verbose?: boolean        // 详细日志输出
}

interface DeploymentResult {
  success: boolean
  duration: number         // 部署耗时（秒）
  steps: StepResult[]      // 各步骤结果
  message: string
}
```

### 2. 远程部署脚本 (Remote Deployment Script)

**职责**: 在远程服务器上执行完整的部署流程

**位置**: `/root/deploy-openim-h5.sh`

**主要函数**:
- `check_dependencies()`: 检查必要的依赖（git, node, npm, nginx）
- `sync_code()`: 同步代码（git pull 或 git clone）
- `build_project()`: 构建项目
- `backup_current()`: 备份当前部署
- `deploy_to_nginx()`: 部署到 Nginx
- `verify_deployment()`: 验证部署结果
- `cleanup()`: 清理旧备份

### 3. 配置管理 (Configuration Management)

**配置文件位置**: `.kiro/deployment/config.json`

**配置内容**:
```json
{
  "remote": {
    "host": "161.248.14.73",
    "port": 46310,
    "username": "root",
    "projectPath": "/root/openim-h5-demo"
  },
  "git": {
    "repository": "git@github.com:walnut1014/openim-h5-demo.git",
    "branch": "main"
  },
  "build": {
    "command": "npm run build",
    "outputDir": "dist"
  },
  "nginx": {
    "webRoot": "/var/www/html/openim-h5",
    "backupDir": "/root/backups/openim-h5"
  },
  "options": {
    "maxBackups": 5,
    "buildTimeout": 600,
    "deployTimeout": 120
  }
}
```

## Data Models

### 部署日志模型

```typescript
interface DeploymentLog {
  id: string
  timestamp: Date
  triggeredBy: string
  branch: string
  commitHash: string
  status: 'success' | 'failed' | 'rolled_back'
  duration: number
  steps: StepLog[]
  errorMessage?: string
}

interface StepLog {
  name: string
  status: 'success' | 'failed' | 'skipped'
  startTime: Date
  endTime: Date
  output: string
  errorMessage?: string
}
```

### 服务器状态模型

```typescript
interface ServerStatus {
  connected: boolean
  diskSpace: {
    total: number
    used: number
    available: number
  }
  dependencies: {
    git: boolean
    node: boolean
    npm: boolean
    nginx: boolean
  }
  currentDeployment: {
    commitHash: string
    deployTime: Date
  }
}
```

## Error Handling

### 错误分类

1. **连接错误**
   - SSH 连接失败
   - 网络超时
   - 认证失败

2. **环境错误**
   - 依赖缺失（Git、Node.js、npm、Nginx）
   - 磁盘空间不足
   - 权限不足

3. **代码同步错误**
   - Git 仓库不存在
   - Git pull 失败（冲突、网络问题）
   - 分支不存在

4. **构建错误**
   - npm install 失败
   - npm run build 失败
   - 构建产物不存在

5. **部署错误**
   - 备份失败
   - 文件复制失败
   - 权限设置失败

### 错误处理策略

```bash
# 伪代码示例
function deploy() {
  try {
    check_dependencies() || exit_with_error "依赖检查失败"
    
    sync_code() || exit_with_error "代码同步失败"
    
    build_project() || exit_with_error "构建失败"
    
    backup_current() || exit_with_error "备份失败"
    
    deploy_to_nginx() || exit_with_error "部署失败"
    
    verify_deployment() || exit_with_error "验证失败"
    
    cleanup()
    log_success()
  } catch (error) {
    log_error(error)
    send_notification(error)
  }
}
```

### 备份机制

- 每次部署前自动创建备份
- 保留最近 5 个备份版本
- 备份文件以时间戳命名便于识别

## Testing Strategy

### 手动验证

- 部署后访问网站验证功能正常
- 检查 Nginx 日志
- 验证文件权限正确
- 确认备份文件存在

## Implementation Notes

### 技术选型

1. **SSH 连接**: 使用现有的 MCP SSH 工具或 Node.js 的 `ssh2` 库
2. **脚本语言**: Bash（远程脚本）+ TypeScript/JavaScript（本地触发器）
3. **日志记录**: 使用 `tee` 命令同时输出到终端和日志文件
4. **配置管理**: JSON 配置文件

### 安全考虑

1. **SSH 密钥认证**: 使用 SSH 密钥而非密码
2. **权限控制**: 部署脚本仅对 root 用户可执行
3. **敏感信息**: 配置文件不包含密码，使用 SSH 配置
4. **备份加密**: 可选的备份文件加密

### 性能优化

1. **增量构建**: 利用 npm 缓存加速依赖安装
2. **并行操作**: 备份和构建可以并行进行
3. **压缩传输**: 使用 rsync 或 tar 压缩传输大文件
4. **清理策略**: 定期清理旧的 node_modules 和构建缓存

### 扩展性

1. **多环境支持**: 支持 dev、staging、production 环境
2. **多项目支持**: 配置文件支持多个项目
3. **通知集成**: 支持钉钉、企业微信等通知渠道
4. **CI/CD 集成**: 可集成到 GitHub Actions 或 GitLab CI
5. **手动恢复**: 如需恢复旧版本，可手动从备份目录复制文件

## Deployment Workflow Detail

### 详细步骤流程

```
1. 预检查 (Pre-check)
   ├─ 检查本地 SSH 配置
   ├─ 测试远程服务器连接
   └─ 验证配置文件有效性

2. 环境检查 (Environment Check)
   ├─ 检查 Git 版本
   ├─ 检查 Node.js 版本
   ├─ 检查 npm 版本
   ├─ 检查 Nginx 状态
   └─ 检查磁盘空间

3. 代码同步 (Code Sync)
   ├─ 判断项目目录是否存在
   ├─ 存在: git pull origin main
   └─ 不存在: git clone <repository>

4. 依赖安装 (Dependencies Installation)
   ├─ npm install --production
   └─ 验证 node_modules 目录

5. 项目构建 (Build)
   ├─ npm run build
   ├─ 验证 dist 目录存在
   └─ 检查关键文件 (index.html, assets/)

6. 备份当前版本 (Backup)
   ├─ 创建备份目录 (timestamp)
   ├─ 复制当前 Nginx 目录到备份
   └─ 清理超过 5 个的旧备份

7. 部署新版本 (Deploy)
   ├─ 删除 Nginx 目录旧文件
   ├─ 复制 dist/* 到 Nginx 目录
   ├─ 设置文件权限 (644)
   └─ 设置目录权限 (755)

8. 验证部署 (Verify)
   ├─ 检查 index.html 存在
   ├─ 检查文件权限正确
   └─ 可选: curl 测试网站响应

9. 清理 (Cleanup)
   ├─ 清理构建临时文件
   └─ 记录部署日志

10. 完成 (Complete)
    ├─ 输出部署摘要
    ├─ 显示访问 URL
    └─ 返回成功状态
```

## Directory Structure

### 远程服务器目录结构

```
/root/
├── openim-h5-demo/              # 项目代码目录
│   ├── src/
│   ├── dist/                    # 构建产物
│   ├── node_modules/
│   ├── package.json
│   └── ...
├── backups/                     # 备份目录
│   └── openim-h5/
│       ├── 2025-11-07_143022/   # 时间戳备份
│       ├── 2025-11-07_150315/
│       └── ...
├── deploy-openim-h5.sh          # 部署脚本
└── logs/                        # 日志目录
    └── deployment/
        ├── deploy-2025-11-07.log
        └── ...

/var/www/html/
└── openim-h5/                   # Nginx 网站根目录
    ├── index.html
    ├── assets/
    └── ...
```

### 本地项目目录结构

```
openim-h5-demo/
├── .kiro/
│   └── deployment/
│       ├── config.json          # 部署配置
│       ├── deploy.js            # 本地部署脚本
│       └── deploy.sh            # 远程部署脚本模板
├── src/
├── dist/
└── ...
```
