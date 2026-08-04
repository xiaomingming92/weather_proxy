export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // bug修复
        'docs', // 文档更新
        'style', // 代码格式（不影响功能）
        'refactor', // 代码重构
        'test', // 测试相关
        'chore', // 构建过程或辅助工具变动
        'ci', // CI/CD 配置变更（workflows、部署脚本）
        'perf', // 性能优化
        'revert', // 回滚
      ],
    ],
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
  },
};
