我来将这份PRD改为云开发版本，移除所有传统后端元素，完全基于微信云开发。

---

# AI周易取名宝宝小程序 - MVP产品需求文档（云开发版）

**文档版本**：v2.0  
**技术栈**：微信小程序原生 + 微信云开发（云函数 + 云数据库 + 云存储）  
**目标周期**：4周  
**核心目标**：零后端运维，快速上线验证

---

## 1. 产品概述

### 1.1 产品定位
基于微信云开发的AI智能起名工具，通过云函数完成八字计算与AI取名宝宝，定位为"国学文化起名助手"。

### 1.2 核心价值
- **快**：3秒出结果，无需等待后端接口
- **轻**：云开发免运维，自动扩缩容
- **省**：MVP阶段完全免费（在免费额度内）

### 1.3 目标用户
- 新生儿父母（60%）：讲究寓意、五行平衡
- 成年人改名（25%）：事业提升、个人品牌
- 笔名/艺名需求（15%）：文艺感、独特性

---

## 2. 技术架构

### 2.1 云开发架构

```
┌─────────────────────────────────────────┐
│           微信小程序端                   │
│  ├─ 页面渲染（WXML/WXSS/JS）            │
│  ├─ 本地逻辑（表单验证、简单计算）         │
│  └─ 云开发SDK（wx.cloud）               │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│           微信云开发环境                 │
│                                         │
│  ┌─────────────┐  ┌─────────────┐      │
│  │   云函数    │  │   云数据库   │      │
│  │  ├─ getQuota│  │  ├─ users   │      │
│  │  ├─ useQuota│  │  ├─ daily_quota    │
│  │  ├─ generate│  │  ├─ records │      │
│  │  ├─ recordShare    │  ├─ favorites│      │
│  │  ├─ poster  │  │  ├─ shares  │      │
│  │  └─ ...     │  │  └─ config  │      │
│  └──────┬──────┘  └─────────────┘      │
│         │                               │
│  ┌──────▼──────┐  ┌─────────────┐      │
│  │   云存储    │  │  外部API    │      │
│  │  ├─ 海报模板│  │  ├─ AI大模型 │      │
│  │  ├─ 生成图片│  │  └─ 历法库  │      │
│  │  └─ 静态资源│  │             │      │
│  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────┘
```

### 2.2 云开发优势

| 能力 | 传统方案 | 云开发方案 |
|-----|---------|-----------|
| 服务器 | 购买ECS/容器 | 无需购买，自动弹性 |
| 数据库 | MySQL+Redis | 云数据库（MongoDB） |
| 文件存储 | 单独购买OSS | 内置云存储+CDN |
| 用户登录 | JWT/Session维护 | 微信匿名登录，自动鉴权 |
| 运维部署 | 手动部署Nginx | 一键上传，自动发布 |
| 费用 | 最低¥100/月 | 免费额度内¥0 |

---

## 3. 数据库设计（云数据库）

### 3.1 集合清单

| 集合名 | 用途 | 权限 |
|-------|------|------|
| users | 用户基础信息 | 用户只可读写自己的文档 |
| daily_quota | 每日次数配额 | 用户只读，云函数写入 |
| generation_records | 取名宝宝记录 | 用户只读自己的，云函数写入 |
| favorites | 收藏的名字 | 用户可读写自己的 |
| share_records | 分享追踪记录 | 用户无权限，云函数管理 |
| system_config | 系统配置（次数规则等） | 公开只读 |

### 3.2 文档结构

#### users 集合

```javascript
{
  _id: "系统自动生成",
  _openid: "微信用户openid（自动注入）",
  
  // 微信信息
  nickName: "微信昵称",
  avatarUrl: "头像URL",
  
  // 累计统计
  totalGenerations: 0,        // 累计取名宝宝次数
  totalShares: 0,             // 累计分享次数
  firstGenerationTime: Date,  // 首次使用
  
  // VIP预留（MVP均为0）
  vipLevel: 0,
  vipExpireAt: null,
  
  // 快捷输入缓存
  lastUsedSurname: "李",
  
  createTime: "服务器时间",
  updateTime: "服务器时间"
}
```

#### daily_quota 集合（核心，按天+用户分文档）

```javascript
{
  _id: "系统自动生成",
  _openid: "微信用户openid",
  
  date: "2026-02-12",         // 日期字符串，YYYY-MM-DD
  dateObj: Date,              // Date对象，用于查询
  
  // 次数统计
  baseCount: 1,               // 基础次数（每日1次）
  usedCount: 0,               // 已使用
  shareCount: 0,              // 已分享次数
  bonusCount: 0,              // 已获得奖励次数
  
  // 分享明细（防刷）
  shareDetails: [
    {
      shareTime: Date,
      scene: "分享场景码",
      type: "friend",         // friend或timeline
      isEffective: true       // 是否有效（好友点击）
    }
  ],
  
  // 状态标记
  isExhausted: false,         // 今日是否已用完
  
  createTime: "服务器时间",
  updateTime: "服务器时间"
}
```

#### generation_records 集合

```javascript
{
  _id: "系统自动生成",
  _openid: "微信用户openid",
  
  // 用户输入
  input: {
    surname: "李",
    gender: 1,                // 1男 2女
    purpose: "baby",          // baby/adult/pen/company
    solarDate: "2024-03-15",
    solarTime: "14:30",
    birthPlace: "北京市",
    tags: ["健康", "学业"],
    avoidChars: ["明", "红"]
  },
  
  // 八字计算结果
  bazi: {
    lunarDate: "甲辰年二月初六",
    year: "甲辰",
    month: "丁卯",
    day: "戊寅",
    hour: "己未",
    wuxing: { 金:0, 木:3, 水:0, 火:1, 土:4 },
    xiyongshen: "水",
    dayMaster: "戊土"
  },
  
  // AI生成结果（5个名字）
  results: [
    {
      name: "李沐辰",
      score: 96,
      wuxing: "水+土",
      gua: { name: "兑卦", meaning: "刚中而柔外" },
      interpretation: "如沐春风，温润而泽",
      poetic: "沐仁浴义，灿若星辰",
      singleChars: [
        { char: "沐", pinyin: "mù", wuxing: "水", strokes: 7, meaning: "润泽" },
        { char: "辰", pinyin: "chén", wuxing: "土", strokes: 7, meaning: "星辰" }
      ]
    }
  ],
  
  // 消耗记录
  costType: "free",           // free/share/vip
  costQuotaId: "对应daily_quota文档ID",
  
  createTime: "服务器时间"
}
```

#### favorites 集合

```javascript
{
  _id: "系统自动生成",
  _openid: "微信用户openid",
  
  recordId: "关联的generation_records._id",
  name: "李沐辰",             // 名字
  score: 96,
  wuxing: "水+土",
  interpretation: "如沐春风，温润而泽",
  
  createTime: "服务器时间"
}
```

#### system_config 集合（只读配置）

```javascript
{
  _id: "quota_rules",
  
  // 次数规则
  baseDailyCount: 1,          // 每日基础次数
  maxDailyCount: 3,           // 每日上限
  shareBonusPerTime: 1,       // 每次分享奖励
  maxShareBonusPerDay: 2,     // 每日分享奖励上限
  
  // AI配置
  aiModel: "deepseek-chat",
  maxResultsPerGen: 5,
  
  // 功能开关
  enableShare: true,
  enablePayment: false,       // MVP关闭
  
  updateTime: "服务器时间"
}
```

---

## 4. 云函数清单

### 4.1 云函数目录

```
cloudfunctions/
├── getQuota/                 # 获取用户今日次数
├── checkAndUseQuota/         # 检查并消耗次数（原子操作）
├── recordShare/              # 记录分享并奖励次数
├── generateNames/            # 八字计算 + AI取名宝宝
├── getBazi/                  # 仅计算八字（确认页用）
├── toggleFavorite/           # 切换收藏状态
├── getFavorites/             # 获取收藏列表
└── generatePoster/           # 生成分享海报
```

### 4.2 云函数详细说明

#### getQuota - 获取今日次数

**功能**：查询用户今日剩余次数，无记录则自动创建

**输入**：无（自动获取openid）

**输出**：
```javascript
{
  remaining: 2,           // 剩余次数
  total: 3,               // 今日总额度
  used: 1,                // 已使用
  canShare: true,         // 是否还可分享
  maxShareBonus: 2        // 还可获得几次分享奖励
}
```

**逻辑**：
1. 获取用户openid
2. 查询今日daily_quota文档
3. 无记录则创建（从system_config读取默认配置）
4. 计算remaining = baseCount + bonusCount - usedCount
5. 返回结果

---

#### checkAndUseQuota - 检查并消耗次数

**功能**：原子性检查次数并扣除，防止并发超刷

**输入**：
```javascript
{ type: "free" }  // 消耗类型，MVP只有free
```

**输出**：
```javascript
// 成功
{ success: true, remaining: 2, quotaId: "文档ID" }

// 失败
{ success: false, error: "QUOTA_EXHAUSTED" }
```

**关键逻辑**：
- 使用数据库原子操作（inc）增加usedCount
- 先查询确认有剩余，再执行扣除
- 扣除后检查是否用完，更新isExhausted标记

---

#### recordShare - 记录分享并奖励次数

**功能**：用户分享后调用，验证有效性并增加次数

**输入**：
```javascript
{
  scene: "分享场景码",
  type: "friend"  // 或"timeline"
}
```

**输出**：
```javascript
// 成功
{
  success: true,
  bonusAdded: 1,
  totalBonus: 2,          // 该用户今日总奖励次数
  message: "获得1次取名宝宝机会"
}

// 失败
{ success: false, error: "SHARE_LIMIT_REACHED" }
```

**防刷机制**：
- 同一scene码24小时内只能记录一次
- 每日分享次数上限2次（从config读取）
- 可选：追踪好友点击回流才生效（MVP简化）

---

#### generateNames - AI取名宝宝核心

**功能**：完整取名宝宝流程，包含八字计算、AI调用、结果保存

**输入**：用户填写的所有信息（同generation_records.input）

**输出**：
```javascript
{
  success: true,
  names: [/*5个名字对象*/],
  bazi: { /*八字分析结果*/ },
  recordId: "保存的记录ID"
}
```

**内部流程**：
1. 调用checkAndUseQuota检查次数
2. 使用lunar-javascript计算八字五行
3. 构建Prompt，调用AI大模型API
4. 解析AI返回，格式化结果
5. 保存到generation_records
6. 更新users.totalGenerations

**AI Prompt要求**：
- 生成5个名字
- 每个包含：name、score、wuxing、gua、interpretation、poetic、singleChars
- 严格遵循五行喜用，避开避讳字
- 返回纯JSON数组，无markdown

---

#### getBazi - 仅计算八字

**功能**：八字确认页使用，不消耗次数，仅展示分析

**输入**：solarDate、solarTime、birthPlace（可选）

**输出**：八字、五行、喜用神等（同generation_records.bazi）

---

#### toggleFavorite - 切换收藏

**功能**：收藏或取消收藏名字

**输入**：recordId、name、action（add/remove）

**输出**：{ success: true, isFavorite: true/false }

**权限**：用户只能操作自己的收藏

---

#### getFavorites - 获取收藏列表

**功能**：分页获取用户收藏的名字

**输入**：page、pageSize

**输出**：收藏列表数组

---

#### generatePoster - 生成分享海报

**功能**：生成带二维码的海报图片

**方案A（推荐）**：前端canvas生成，云函数仅提供参数
- 返回模板URL、文字位置坐标、二维码链接
- 前端绘制后上传云存储

**方案B**：云函数生成（需node-canvas）
- 云函数绘制图片
- 上传云存储，返回临时链接

**MVP建议**：方案A，减少云函数资源消耗

---

## 5. 前端关键逻辑

### 5.1 云开发初始化

```javascript
// app.js
App({
  onLaunch() {
    wx.cloud.init({
      env: 'your-env-id',     // 云开发环境ID
      traceUser: true         // 自动追踪用户
    })
  }
})
```

### 5.2 次数管理封装

```javascript
// utils/quota.js
class QuotaManager {
  // 获取今日次数（带本地缓存）
  async getQuota(forceRefresh = false) {
    // 缓存有效期内直接返回
    // 否则调用云函数 getQuota
    // 缓存到本地Storage
  }
  
  // 使用次数（生成名字前调用）
  async useQuota() {
    // 调用云函数 checkAndUseQuota
    // 成功则清除缓存
  }
  
  // 分享后奖励
  async recordShare(scene) {
    // 调用云函数 recordShare
    // 成功提示"获得X次机会"
  }
}
```

### 5.3 分享功能实现

```javascript
// 页面分享配置
onShareAppMessage() {
  const scene = `s${Date.now()}${随机码}`
  
  // 异步记录分享
  quotaManager.recordShare(scene)
  
  return {
    title: `我家宝宝候选名：${this.data.names[0].name}`,
    path: `/pages/index/index?scene=${scene}`,
    imageUrl: this.data.posterUrl
  }
}
```

---

## 6. 安全与权限

### 6.1 数据库安全规则

```json
{
  "users": {
    ".read": "doc._openid == auth.openid",
    ".write": "doc._openid == auth.openid"
  },
  "daily_quota": {
    ".read": "doc._openid == auth.openid",
    ".write": false
  },
  "generation_records": {
    ".read": "doc._openid == auth.openid",
    ".write": false
  },
  "favorites": {
    ".read": "doc._openid == auth.openid",
    ".write": "doc._openid == auth.openid"
  },
  "system_config": {
    ".read": true,
    ".write": false
  }
}
```

### 6.2 云函数安全

- 所有云函数自动获取openid，拒绝未登录调用
- AI API Key存储在云函数环境变量（不暴露前端）
- 敏感操作（消耗次数）使用原子操作
- 分享奖励增加频率限制（单用户单日上限）

---

## 7. 页面结构与交互

### 7.1 页面清单

| 页面 | 路径 | 核心功能 |
|-----|------|---------|
| 首页 | pages/index/index | 次数展示、开始取名宝宝 |
| 基础信息 | pages/form/step1 | 姓氏、性别、用途 |
| 生辰信息 | pages/form/step2 | 日期时间、偏好、避讳 |
| 八字确认 | pages/bazi/confirm | 展示八字分析、确认生成 |
| 生成中 | pages/loading/index | 等待动画 |
| 结果列表 | pages/result/list | 5个名字展示、收藏、分享 |
| 名字详情 | pages/result/detail | 单字解析、卦象、音律 |
| 分享海报 | pages/share/poster | 海报生成、保存、分享 |
| 个人中心 | pages/user/index | 收藏、记录、次数明细 |

### 7.2 关键交互流程

**取名宝宝主流程**：
```
首页 → 基础信息 → 生辰信息 → 八字确认 → 生成中 → 结果列表 → 名字详情
```

**分享裂变流程**：
```
结果列表点击分享 → 调用recordShare云函数 → 次数+1 → 解锁更多/明日再来
```

**收藏流程**：
```
名字详情点击收藏 → 调用toggleFavorite → 更新本地状态 → 同步到云数据库
```

---

## 8. 运营与数据

### 8.1 核心指标

| 指标 | 目标 | 追踪方式 |
|-----|------|---------|
| 日新增 | 300+ | 云函数日志统计openid新增 |
| 分享率 | 30%+ | share_records集合统计 |
| 次留 | 20%+ | 对比连续两天有记录的openid |
| 生成成本 | <¥0.3 | AI调用费用/生成次数 |

### 8.2 数据监控

**云开发控制台监控**：
- 云函数调用次数/错误率
- 数据库读/写次数
- 存储容量/下载流量

**自定义统计**：
- 每日生成次数（generation_records按天统计）
- 分享转化漏斗（share_records有效性分析）
- 热门姓氏/寓意标签（聚合查询）

---

## 9. 成本与风险

### 9.1 成本估算

**云开发免费额度（每月）**：
- 云函数调用：100万次（充足）
- 云函数资源：10万GBs（充足）
- 数据库读：50万次（充足）
- 数据库写：30万次（充足）
- 存储：5GB（充足）
- CDN流量：5GB（充足）

**可能费用**：
- AI API调用：约¥0.005-0.01/次
- 日活1000时，月成本约¥150-300

### 9.2 主要风险

| 风险 | 应对 |
|-----|------|
| 微信审核不通过 | 严格合规文案，预留修改时间 |
| AI生成质量不稳定 | 准备优质案例做Few-shot引导 |
| 八字计算错误 | 购买专业历法数据对比测试 |
| 分享率不达预期 | A/B测试分享文案，优化海报 |

---

## 10. 开发排期

| 周次 | 重点 | 交付 |
|-----|------|------|
| W1 | 环境搭建+八字计算 | 云开发环境就绪，八字计算准确 |
| W2 | AI对接+核心流程 | 完整取名宝宝流程跑通 |
| W3 | 次数系统+分享裂变 | 分享奖励机制完成 |
| W4 | 体验优化+审核上线 | UI调优，通过微信审核 |

---

## 11. 后续迭代

- **V1.1**：收藏对比、历史记录优化
- **V1.2**：微信支付接入，VIP会员（云开发支持微信支付）
- **V1.3**：大师咨询（实时数据推送）
- **V1.4**：公司命名、品牌命名扩展

---
