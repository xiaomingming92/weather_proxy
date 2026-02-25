#!/usr/bin/env node

/**
 * 检查 Prisma 迁移文件是否为破坏性变更
 * 在 pre-commit 钩子中调用
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// 破坏性变更关键字
const DESTRUCTIVE_PATTERNS = [
  /DROP\s+TABLE/i,
  /DROP\s+COLUMN/i,
  /ALTER\s+TABLE\s+\w+\s+DROP/i,
  /ALTER\s+TABLE\s+\w+\s+CHANGE/i,
  /ALTER\s+TABLE\s+\w+\s+MODIFY.*NOT\s+NULL/i,
  /ALTER\s+TABLE\s+\w+\s+RENAME/i,
];

// 警告性变更关键字
const WARNING_PATTERNS = [
  /ALTER\s+TABLE\s+\w+\s+MODIFY/i,
  /ALTER\s+TABLE\s+\w+\s+ALTER\s+COLUMN/i,
  /CREATE\s+UNIQUE\s+INDEX/i,
];

function getStagedMigrationFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=A', {
      encoding: 'utf-8',
    });
    return output
      .trim()
      .split('\n')
      .filter(
        file =>
          file.startsWith('prisma/migrations/') &&
          file.endsWith('/migration.sql')
      );
  } catch {
    return [];
  }
}

function checkMigrationFile(filePath) {
  const fullPath = resolve(filePath);
  const content = readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  const destructiveChanges = [];
  const warningChanges = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 检查破坏性变更
    for (const pattern of DESTRUCTIVE_PATTERNS) {
      if (pattern.test(line)) {
        destructiveChanges.push({
          line: lineNum,
          content: line.trim(),
          pattern: pattern.toString(),
        });
        break;
      }
    }

    // 检查警告性变更
    for (const pattern of WARNING_PATTERNS) {
      if (pattern.test(line)) {
        warningChanges.push({
          line: lineNum,
          content: line.trim(),
          pattern: pattern.toString(),
        });
        break;
      }
    }
  });

  return { destructiveChanges, warningChanges };
}

function main() {
  const migrationFiles = getStagedMigrationFiles();

  if (migrationFiles.length === 0) {
    console.log('✓ 没有新的迁移文件');
    process.exit(0);
  }

  console.log(`检测到 ${migrationFiles.length} 个新的迁移文件:`);
  migrationFiles.forEach(f => console.log(`  - ${f}`));
  console.log('');

  let hasDestructive = false;
  let hasWarning = false;

  for (const file of migrationFiles) {
    const result = checkMigrationFile(file);

    if (result.destructiveChanges.length > 0) {
      hasDestructive = true;
      console.log(`\n❌ 文件 ${file} 包含破坏性变更:`);
      result.destructiveChanges.forEach(change => {
        console.log(`   第 ${change.line} 行: ${change.content}`);
      });
    }

    if (result.warningChanges.length > 0) {
      hasWarning = true;
      console.log(`\n⚠️  文件 ${file} 包含潜在风险变更:`);
      result.warningChanges.forEach(change => {
        console.log(`   第 ${change.line} 行: ${change.content}`);
      });
    }
  }

  if (hasDestructive) {
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  检测到破坏性数据库变更!');
    console.log('='.repeat(60));
    console.log('');
    console.log('破坏性变更包括:');
    console.log('  • DROP TABLE / DROP COLUMN - 删除表/列');
    console.log('  • ALTER TABLE ... DROP - 删除约束/索引');
    console.log('  • ALTER TABLE ... CHANGE - 修改列定义');
    console.log('  • ALTER TABLE ... RENAME - 重命名表/列');
    console.log('');
    console.log('提交前请确认:');
    console.log('  1. 是否已备份现有数据?');
    console.log('  2. 是否需要数据迁移脚本?');
    console.log('  3. 生产环境是否兼容此变更?');
    console.log('');
    console.log('如果确认要提交，请使用: git commit --no-verify');
    console.log('');
    process.exit(1);
  }

  if (hasWarning) {
    console.log('\n⚠️  检测到潜在风险变更，请人工复查');
  }

  console.log('\n✓ 迁移文件检查通过');
  process.exit(0);
}

main();
