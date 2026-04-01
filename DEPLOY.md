# 部署详细指南

## 一、准备工作

### 1.1 注册微信小程序

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 注册小程序账号（选择"小程序"类型）
3. 完成邮箱验证和主体认证
4. 获取 AppID

### 1.2 开通云开发

1. 登录小程序后台
2. 点击左侧菜单"云开发"
3. 点击"开通"按钮
4. 选择环境名称（如 yiming-prod）
5. 记录环境ID

### 1.3 安装开发工具

1. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 使用小程序管理员微信扫码登录

## 二、项目配置

### 2.1 修改云开发环境ID

打开 `app.js`，修改第7行：

```javascript
cloudEnv: 'your-env-id', // 替换为实际的云开发环境ID
```

### 2.2 修改项目配置

打开 `project.config.json`，修改第43行：

```json
"appid": "wxappid", // 替换为实际的小程序AppID
```

## 三、数据库初始化

### 3.1 创建集合

在微信开发者工具中：

1. 点击"云开发"按钮
2. 切换到"数据库"标签
3. 点击"添加集合"，依次创建：
   - users
   - daily_quota
   - generation_records
   - favorites
   - share_records
   - system_config

### 3.2 配置系统参数

1. 点击 `system_config` 集合
2. 点击"添加记录"
3. 选择"导入JSON"
4. 粘贴以下内容：

```json
{
  "_id": "quota_rules",
  "baseDailyCount": 1,
  "maxDailyCount": 3,
  "shareBonusPerTime": 1,
  "maxShareBonusPerDay": 2,
  "aiModel": "deepseek-chat",
  "maxResultsPerGen": 5,
  "enableShare": true,
  "enablePayment": false,
  "updateTime": {
    "$date": "2026-02-12T00:00:00.000Z"
  }
}
```

### 3.3 设置数据库权限

对每个集合设置权限：

**users 集合：**
```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

**daily_quota 集合：**
```json
{
  "read": "doc._openid == auth.openid",
  "write": false
}
```

**generation_records 集合：**
```json
{
  "read": "doc._openid == auth.openid",
  "write": false
}
```

**favorites 集合：**
```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

**share_records 集合：**
```json
{
  "read": false,
  "write": false
}
```

**system_config 集合：**
```json
{
  "read": true,
  "write": false
}
```

## 四、部署云函数

### 4.1 创建云函数

在微信开发者工具中：

1. 展开 `cloudfunctions` 文件夹
2. 右键点击 `getQuota`
3. 选择"创建并部署：云端安装依赖"
4. 等待部署完成
5. 对其余7个云函数重复上述步骤

### 4.2 验证部署

在云开发控制台：

1. 点击"云函数"标签
2. 确认所有函数都显示为绿色（部署成功）
3. 点击 `getQuota`，测试调用是否成功

## 五、配置图片资源

### 5.1 准备图片

准备以下图片（建议尺寸和格式）：

| 图片名称 | 尺寸 | 格式 |
|---------|------|------|
| hero-bg.png | 750x800 | PNG |
| default-avatar.png | 200x200 | PNG |
| empty-fav.png | 200x200 | PNG |
| share-cover.png | 500x400 | PNG/JPG |
| tab_home.png | 48x48 | PNG |
| tab_home_active.png | 48x48 | PNG |
| tab_user.png | 48x48 | PNG |
| tab_user_active.png | 48x48 | PNG |

### 5.2 上传到云存储

1. 在云开发控制台点击"存储"
2. 点击"上传文件"
3. 将所有图片上传到根目录或 images/ 目录

### 5.3 更新代码中的图片路径

如有需要，修改页面中引用的图片路径。

## 六、测试验证

### 6.1 本地测试

1. 点击开发者工具"编译"按钮
2. 测试完整流程：
   - 首页显示
   - 填写信息（步骤1/2）
   - 八字分析
   - 生成名字
   - 结果列表
   - 收藏功能
   - 分享功能

### 6.2 真机测试

1. 点击"真机调试"
2. 使用手机微信扫描二维码
3. 在真机上测试各项功能

### 6.3 常见问题和解决

**问题1：云函数调用失败**
- 检查云开发环境ID是否正确
- 检查云函数是否已部署
- 检查网络连接

**问题2：数据库读取失败**
- 检查数据库权限设置
- 检查集合名称是否正确
- 检查记录ID是否存在

**问题3：分享功能无效**
- 检查是否配置了 onShareAppMessage
- 检查分享图片路径是否正确

## 七、提交审核

### 7.1 准备工作

1. 完善小程序信息（名称、头像、简介）
2. 上传小程序截图（5张）
3. 配置服务器域名（如有）
4. 配置业务域名（如有）

### 7.2 提交审核

1. 点击"上传"按钮
2. 填写版本号（如 1.0.0）
3. 填写项目备注
4. 上传成功后，在公众平台提交审核
5. 等待审核结果（通常1-3个工作日）

### 7.3 审核通过后发布

1. 收到审核通过通知
2. 在公众平台点击"发布"
3. 小程序正式上线

## 八、运营建议

### 8.1 数据分析

在云开发控制台查看：
- 云函数调用次数
- 数据库读写次数
- 用户增长趋势

### 8.2 用户反馈

关注：
- 用户评价
- 分享转化率
- 次留/日留数据

### 8.3 持续优化

根据数据优化：
- AI生成质量
- UI交互体验
- 分享引导策略

## 九、联系方式

如遇部署问题，请检查：
1. 云开发文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html
2. 小程序文档：https://developers.weixin.qq.com/miniprogram/dev/framework/
