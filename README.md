# 易名宝宝 - AI周易取名宝宝小程序

基于微信云开发的AI智能起名工具，结合传统八字五行与现代AI技术，为您提供专业的起名服务。

## 功能特点

- **八字分析**：根据出生时间计算八字、五行分布
- **AI取名宝宝**：智能生成5个吉祥好名，附带详细解析
- **五行平衡**：根据八字喜用神推荐合适的汉字
- **易经卦象**：每个名字对应易经卦象解读
- **音律美学**：分析名字的声调和韵母搭配
- **收藏分享**：收藏喜欢的名字，分享给好友

## 技术栈

- 微信小程序原生框架
- 微信云开发（云函数 + 云数据库 + 云存储）
- 新中式UI设计风格

## 项目结构

```
.
├── app.js                 # 小程序入口
├── app.json               # 全局配置
├── app.wxss               # 全局样式
├── project.config.json    # 项目配置
├── sitemap.json           # 站点地图
├── cloudfunctions/        # 云函数
│   ├── getQuota/         # 获取用户配额
│   ├── checkAndUseQuota/ # 检查并消耗配额
│   ├── recordShare/      # 记录分享
│   ├── generateNames/    # AI生成名字
│   ├── getBazi/          # 计算八字
│   ├── toggleFavorite/   # 切换收藏
│   ├── getFavorites/     # 获取收藏列表
│   └── generatePoster/   # 生成海报
├── pages/                 # 页面
│   ├── index/            # 首页
│   ├── form/             # 表单（步骤1/2）
│   ├── bazi/             # 八字分析
│   ├── loading/          # 生成中
│   ├── result/           # 结果（列表/详情）
│   ├── share/            # 分享海报
│   └── user/             # 用户中心/收藏
├── components/           # 组件
│   ├── quota-indicator/  # 次数指示器
│   └── name-card/        # 名字卡片
├── utils/                # 工具类
│   ├── util.js          # 通用工具
│   ├── quota.js         # 配额管理
│   └── bazi.js          # 八字计算
└── images/              # 图片资源
```

## 部署指南

### 1. 准备工作

- 注册微信小程序账号
- 开通微信云开发环境
- 安装微信开发者工具

### 2. 导入项目

1. 下载本项目代码
2. 在微信开发者工具中选择"导入项目"
3. 选择项目目录，填写AppID
4. 选择已开通的云开发环境

### 3. 配置云开发

#### 创建数据库集合

在云开发控制台的数据库中创建以下集合：

- `users` - 用户基础信息
- `daily_quota` - 每日配额
- `generation_records` - 取名宝宝记录
- `favorites` - 收藏的名字
- `share_records` - 分享记录
- `system_config` - 系统配置

#### 配置系统配置

在 `system_config` 集合中添加文档：

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
  "updateTime": "服务器时间"
}
```

#### 配置数据库权限

设置各集合的安全规则，参考 `RPD.md` 中的权限配置。

### 4. 部署云函数

在微信开发者工具中：

1. 右键点击 `cloudfunctions/getQuota` 文件夹
2. 选择"创建并部署：云端安装依赖"
3. 对所有云函数重复上述操作

### 5. 更新配置

修改 `app.js` 中的云开发环境ID：

```javascript
cloud.init({
  env: 'your-env-id',  // 替换为您的云开发环境ID
  traceUser: true
})
```

### 6. 上传代码

在微信开发者工具中点击"上传"，填写版本号和项目备注。

### 7. 提交审核

在微信公众平台提交小程序审核。

## 图片资源

项目需要以下图片资源（请自行准备或生成）：

- `images/hero-bg.png` - 首页背景图（水墨山水风格）
- `images/default-avatar.png` - 默认用户头像
- `images/empty-fav.png` - 空收藏图标
- `images/share-cover.png` - 分享封面图
- `images/tab_home.png` - 首页标签图标
- `images/tab_home_active.png` - 首页标签图标（选中）
- `images/tab_user.png` - 我的标签图标
- `images/tab_user_active.png` - 我的标签图标（选中）

## 自定义配置

### 修改免费额度

在 `system_config` 集合中修改：
- `baseDailyCount` - 每日基础次数
- `maxDailyCount` - 每日最大次数
- `maxShareBonusPerDay` - 每日分享奖励上限

### 接入真实AI

修改 `cloudfunctions/generateNames/index.js` 中的 `generateNamesByAI` 函数，接入真实的AI API（如DeepSeek、OpenAI等）。

## 注意事项

1. 小程序涉及传统文化内容，请确保文案合规
2. 分享功能需要配置 onShareAppMessage
3. 建议配置订阅消息用于提醒功能
4. 正式环境需要配置用户隐私协议

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎反馈。
