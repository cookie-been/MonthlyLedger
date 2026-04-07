# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-08
**Type:** WeChat Mini-program (微信小程序)

## OVERVIEW
微信小程序月月账单工具。支持信用卡、银行、网贷等账单追踪，含还款日历、记录统计、成就系统。

## STRUCTURE
```
./
├── app.js, app.json, app.wxss    # 小程序入口、配置、全局样式
├── project.config.json           # 微信开发者工具项目配置
├── sitemap.json                  # 页面收录配置
├── utils/util.js                 # 工具函数：formatTime, parseDate
├── pages/
│   ├── index/                    # 首页 - 账单列表、预警、统计
│   ├── detail/                  # 详情页 - 账单详情 + 还款弹窗
│   ├── add/                      # 添加/编辑账单表单
│   ├── calendar/                # 日历页 - 还款日期视图
│   ├── record/                  # 记录页 - 还款历史
│   ├── analytics/              # 分析页 - 数据可视化
│   ├── profile/                 # 我的页 - 头像昵称、统计、导出导入
│   ├── achievement/            # 成就页 - 成就徽章
│   ├── settings/                # 设置页 - 还款提醒、数据管理
│   ├── suggestion/             # 反馈页 - 还款建议
│   └── splash/                  # 启动页 - 1秒启动动画
└── images/                       # TabBar图标
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| 添加新账单 | `pages/add/add.js` | 新增账单渠道 |
| 记录还款 | `pages/detail/detail.js` | 还款弹窗 + 记录写入 |
| 查看历史 | `pages/record/record.js` | 还款记录列表 |
| 数据存储 | `app.js` | `wx.getStorageSync('debt_data')` |
| 日期工具 | `utils/util.js` | formatTime, parseDate |
| 导出/导入 | `pages/profile/profile.js`, `pages/settings/settings.js` | JSON文件操作 |
| 成就系统 | `pages/detail/detail.js` | checkAchievements() |
| 用户信息 | `app.js` | userInfo: nickName, avatarUrl |

## DATA MODEL
```javascript
// Channel (账单渠道)
{
  id, name, type,           // 类型: credit_card/huabei/net_loan/other
  totalAmount,             // 总金额
  monthlyPayment,         // 月还款额
  remaining,               // 剩余欠款
  repaymentDay,            // 还款日 (1-28)
  progress,                // 还款进度 %
  interestRate,           // 年利率 %
  totalPeriods,           // 总期数
  paidPeriods             // 已还期数
}

// Record (还款记录)
{ id, channelId, name, amount, time, note }

// Settings (设置)
{ reminderEnabled, reminderTime, reminderAdvance, hideAmount }

// UserInfo (用户信息)
{ nickName, avatarUrl }

// Achievement (成就)
['first_repay', 'first_clear', 'all_clear']
```

## CONVENTIONS
- **语言**: ES5 JavaScript (var, function 声明)
- **页面结构**: 每页4文件 (.js, .json, .wxml, .wxss)
- **API调用**: 直接使用 wx.* API，无封装
- **数据持久**: `wx.getStorageSync/setStorageSync('debt_data')`
- **日期格式**: `YYYY-MM-DD HH:mm:ss`
- **iOS兼容**: 日期解析需用 `YYYY/MM/DD` 格式 (util.js parseDate)

## ANTI-PATTERNS (禁止)
- ❌ 现代JS (const/let, 箭头函数)
- ❌ async/await
- ❌ 状态管理 (直接 setData)
- ❌ TypeScript

## COMMANDS
```bash
# 在微信开发者工具中打开项目文件夹
# 无需构建，直接预览
```

## BUILD CONFIG (project.config.json)
- compileType: miniprogram
- libVersion: 3.15.1
- es6: true (但代码实际用ES5)
- minifyWXSS: true, minifyWXML: true

## NOTES
- 无 ESLint/EditorConfig/jsconfig.json 配置
- App ID: wxe87fb8ace86a7051
- 启动流程: splash(1秒) → index 首页
- 版本: v1.0.0
- 数据导出为 JSON 文件保存到 USER_DATA_PATH
- 渠道类型: 信用卡、银行、网贷、其他