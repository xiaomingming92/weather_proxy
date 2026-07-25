#!/usr/bin/env npx tsx
/**
 * 集中裁决层转录引擎 — caijue.toml 索引 → strategies/*.ts
 *
 * 参考 add-coder caijuehub/transcribe.ts 范式：
 *   1. 读取 caijue.toml 索引
 *   2. 逐条处理 [[caijue]]，读取对应 rules TOML
 *   3. 调用规则生成器产出 GENERATED 区块
 *   4. 与已有 USER CODE 合并写入 strategy 文件
 *
 * 用法：npx tsx caijuehub/transcribe.ts
 *       → npm run generate
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const PROJECT_ROOT = dirname(fileURLToPath(import.meta.url));

// ============================================
// 极简 TOML 解析（仅处理本项目结构）
// ============================================

interface TomlTable { [key: string]: unknown }
type TomlArray = TomlTable[];

function parseToml(content: string): TomlTable {
  const lines = content.split('\n');
  const root: TomlTable = {};
  let currentPath: string[] = [];
  let currentArrayIdx = -1;
  let inMultiline = false;
  let multilineKey = '';
  let multilineBuf: string[] = [];

  for (const raw of lines) {
    const line = raw.split('#')[0].trim();
    if (!line && !inMultiline) continue;

    if (inMultiline) {
      if (line === '"""') {
        setDeep(root, [...currentPath, multilineKey], multilineBuf.join('\n'));
        inMultiline = false;
        multilineBuf = [];
        continue;
      }
      multilineBuf.push(line);
      continue;
    }

    const mqMatch = line.match(/^(\w+)\s*=\s*"""$/);
    if (mqMatch) {
      inMultiline = true; multilineKey = mqMatch[1]; multilineBuf = [];
      continue;
    }

    const arrMatch = line.match(/^\[\[(.+)\]\]$/);
    if (arrMatch) {
      const p = arrMatch[1].split('.');
      const arr = ensureArray(root, p);
      arr.push({});
      currentArrayIdx = arr.length - 1;
      currentPath = [...p, String(currentArrayIdx)];
      continue;
    }

    const secMatch = line.match(/^\[(.+)\]$/);
    if (secMatch) {
      const newPath = secMatch[1].split('.');
      const firstSeg = newPath[0];
      if (root[firstSeg] && Array.isArray(root[firstSeg])) {
        const arr = root[firstSeg] as unknown as TomlTable[];
        if (arr.length > 0)
          currentPath = [firstSeg, String(arr.length - 1), ...newPath.slice(1)];
        else currentPath = newPath;
      } else {
        currentPath = newPath;
      }
      currentArrayIdx = -1;
      ensurePath(root, currentPath);
      continue;
    }

    const kvMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      let val: string | string[] = kvMatch[2].trim();
      if ((val.startsWith('"') || val.startsWith("'"))) {
        const q = val[0];
        const end = val.lastIndexOf(q);
        val = val.slice(1, end > 0 ? end : undefined);
      }
      if (val.startsWith('[') && val.endsWith(']')) {
        const inner = val.slice(1, -1);
        val = inner.split(',').map((s) => {
          const t = s.trim();
          if (t.startsWith('[')) return t.split(',').map((ss: string) => ss.trim().replace(/"/g, ''));
          return t.startsWith('"') ? t.slice(1, -1) : t;
        }) as unknown as string;
      }
      setDeep(root, [...currentPath, key], val);
    }
  }
  return root;
}

function ensurePath(obj: TomlTable, path: string[]): TomlTable {
  let cur = obj;
  for (const seg of path) {
    if (!(seg in cur)) cur[seg] = {};
    cur = cur[seg] as TomlTable;
  }
  return cur;
}

function ensureArray(obj: TomlTable, path: string[]): TomlTable[] {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (!(path[i] in cur)) cur[path[i]] = {};
    cur = cur[path[i]] as TomlTable;
  }
  const last = path[path.length - 1];
  if (!(last in cur)) cur[last] = [];
  return cur[last] as unknown as TomlTable[];
}

function setDeep(obj: TomlTable, path: string[], val: unknown): void {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (!(path[i] in cur)) cur[path[i]] = {};
    cur = cur[path[i]] as TomlTable;
  }
  cur[path[path.length - 1]] = val;
}

function getStr(t: TomlTable, key: string, def = ''): string { return (t[key] as string) || def; }
function getArr(t: TomlTable, key: string): string[] { return (t[key] as string[]) || []; }
function getObj(t: TomlTable, key: string): TomlTable { return (t[key] as TomlTable) || {}; }

// ============================================
// 代码生成标记
// ============================================

const GENERATED_START = '// >>> CAIJUE GENERATED START >>>';
const GENERATED_END = '// <<< CAIJUE GENERATED END <<<';
const HEADER = `// ⚠️ 由 caijuehub/transcribe.ts 自动生成，不要手动编辑！\n// 改 caijuehub/*-rules.toml 后重新运行: npm run generate\n\n`;

// ============================================
// 规则生成器（每个只产出规则数据，不写业务逻辑）
// ============================================

function genDevicesRules(rules: TomlTable): string {
  const deviceList = rules.device as unknown as TomlTable[];
  if (!deviceList?.length) throw new Error('devices-rules.toml: 未找到 [[device]]');

  const lines: string[] = [];
  lines.push('export const DEVICE_REGISTRY = [');

  for (const d of deviceList) {
    const name = getStr(d, 'name');
    const bp = getStr(d, 'basePath');
    const router = getStr(d, 'router');
    const dt = getStr(d, 'dataTransform');
    const cache = getStr(d, 'cache');
    const svc = getStr(d, 'activeCityService');
    const cron = getObj(d, 'cron');

    lines.push(`  {`);
    lines.push(`    name: "${name}",`);
    lines.push(`    basePath: "${bp}",`);
    lines.push(`    router: "${router}",`);
    lines.push(`    dataTransform: "${dt}",`);
    lines.push(`    cache: "${cache}",`);
    lines.push(`    activeCityService: "${svc}",`);
    lines.push(`    cron: {`);
    lines.push(`      forecastUpdate: "${getStr(cron, 'forecastUpdate')}",`);
    lines.push(`      cacheCleanup: "${getStr(cron, 'cacheCleanup')}",`);
    lines.push(`      activeCityCleanup: "${getStr(cron, 'activeCityCleanup')}",`);
    const cs = getStr(cron, 'citySync');
    if (cs) lines.push(`      citySync: "${cs}",`);
    lines.push(`    },`);
    lines.push(`  },`);
  }

  lines.push('];');
  return lines.join('\n');
}

function genScaffoldRules(rules: TomlTable): string {
  const templates = rules.template as unknown as Record<string, TomlTable>;
  const lines: string[] = [];
  lines.push('export const SCAFFOLD_TEMPLATES = {');

  for (const [name, t] of Object.entries(templates)) {
    const cleanName = name.replace(/^"|"$/g, '');  // 去掉 TOML 引号
    const desc = getStr(t, 'description');
    const tables = getArr(t, 'tables');
    const inherits = getStr(t, 'inherits');
    const fields = getObj(t, 'fields');
    const tableDefs = getObj(t, 'tables');

    lines.push(`  "${cleanName}": {`);
    if (desc) lines.push(`    description: "${desc}",`);
    lines.push(`    tables: [${tables.map((x) => `"${x}"`).join(', ')}],`);
    if (inherits) lines.push(`    inherits: "${inherits}",`);

    if (Object.keys(fields).length > 0) {
      lines.push('    fields: {');
      for (const [fk, fv] of Object.entries(fields))
        lines.push(`      ${fk}: "${fv}",`);
      lines.push('    },');
    }

    for (const [tn, td] of Object.entries(tableDefs)) {
      const extra = getStr(td as TomlTable, 'extra');
      const uniqRaw = (td as TomlTable)['unique'];
      const idxRaw = (td as TomlTable)['indexes'];
      if (!extra) continue;
      lines.push(`    ${tn}: {`);
      lines.push(`      extra: "${extra.replace(/\n/g, '\\n').replace(/"/g, '\\"')}",`);
      if (uniqRaw) {
        const uniqStr = JSON.stringify(uniqRaw);
        lines.push(`      unique: ${uniqStr},`);
      }
      if (idxRaw) {
        const idxStr = JSON.stringify(idxRaw);
        lines.push(`      indexes: ${idxStr},`);
      }
      lines.push('    },');
    }

    lines.push('  },');
  }

  lines.push('};');
  return lines.join('\n');
}

// ============================================
// 策略写入（GENERATED + USER CODE 双区块）
// ============================================

function writeStrategy(filePath: string, generated: string) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  let userCodeBefore = '';
  let userCodeAfter = '';
  if (existsSync(filePath)) {
    const existing = readFileSync(filePath, 'utf-8');
    const startIdx = existing.indexOf(GENERATED_START);
    const endIdx = existing.indexOf(GENERATED_END);
    if (startIdx !== -1) {
      userCodeBefore = existing.slice(0, startIdx);
    }
    if (endIdx !== -1) {
      userCodeAfter = existing.slice(endIdx + GENERATED_END.length);
    }
  }

  const content = (userCodeBefore || HEADER) +
    `${GENERATED_START}\n${generated}\n${GENERATED_END}` +
    userCodeAfter;

  writeFileSync(filePath, content, 'utf-8');
  console.log(`  ✅ ${filePath}`);
}

// ============================================
// 主流程
// ============================================

const caijueIndex = parseToml(
  readFileSync(join(PROJECT_ROOT, 'caijue.toml'), 'utf-8')
);
const entries = caijueIndex.caijue as unknown as TomlTable[];

if (!entries?.length) throw new Error('caijue.toml: 未找到 [[caijue]] 条目');

const generators: Record<string, (rules: TomlTable) => string> = {
  'devices-registry': genDevicesRules,
  'scaffold-templates': genScaffoldRules,
};

console.log('集中裁决层转录引擎');
console.log(`  索引: ${entries.length} 个裁决入口\n`);

for (const entry of entries) {
  const id = getStr(entry, 'id');
  const rulesFile = getStr(entry, 'rules');
  const implFile = getStr(entry, 'implementation');
  const desc = getStr(entry, 'description');

  const gen = generators[id];
  if (!gen) { console.log(`  ⚠️  跳过未知裁决: ${id}`); continue; }

  console.log(`  [${id}] ${desc}`);
  const rulesToml = parseToml(
    readFileSync(join(PROJECT_ROOT, rulesFile), 'utf-8')
  );
  const generated = gen(rulesToml);
  writeStrategy(join(PROJECT_ROOT, implFile), generated);
}

console.log(`\n✅ 全部裁决入口处理完成`);
