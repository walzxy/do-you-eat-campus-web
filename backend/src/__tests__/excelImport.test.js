import { afterEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import XLSX from 'xlsx';
import excelImportService from '../services/excelImportService.js';

const inputFile = path.resolve(__dirname, '..', '..', '..', '食堂菜品数据_v3_真实_20261008.xlsx');
const tempDirs = [];

function makeTempDir() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'canteen-import-test-'));
  tempDirs.push(directory);
  return directory;
}

function readJson(directory, name) {
  return JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
}

function makeBrokenSheet(originalFile, mutateFn) {
  const workbook = XLSX.readFile(originalFile);
  mutateFn(workbook);
  const brokenFile = path.join(makeTempDir(), 'broken.xlsx');
  XLSX.writeFile(workbook, brokenFile);
  return brokenFile;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    fs.rmSync(tempDirs.pop(), { recursive: true, force: true });
  }
});
describe('Excel v3 全量导入', () => {
  it('导入 5 个食堂、42 个窗口和 262 条菜品', () => {
    const result = excelImportService.import(inputFile, { outputDir: makeTempDir() });

    expect(result.success).toBe(true);
    expect(result.counts).toMatchObject({
      acceptedCafeterias: 5,
      acceptedWindows: 42,
      acceptedDishes: 262,
      rejectedRows: 0,
    });
    expect(readJson(result.outputDir, 'dishes.json').find(item => item.dish_id === 'D080').price_max).toBeNull();
    expect(fs.existsSync(result.reportPath)).toBe(true);
  });

  it('重复导入时核心数据结果一致', () => {
    const outputDir = makeTempDir();
    const first = excelImportService.import(inputFile, { outputDir });
    const firstData = ['cafeterias.json', 'windows.json', 'dishes.json'].map(name => fs.readFileSync(path.join(outputDir, name), 'utf8'));
    const second = excelImportService.import(inputFile, { outputDir });
    const secondData = ['cafeterias.json', 'windows.json', 'dishes.json'].map(name => fs.readFileSync(path.join(outputDir, name), 'utf8'));

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(secondData).toEqual(firstData);
  });

  it('单行关系错误时拒绝该行并保留其余合法数据', () => {
    const brokenFile = makeBrokenSheet(inputFile, (workbook) => {
      const sheet = workbook.Sheets['菜品数据'];
      const headers = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })[0];
      const windowColumn = headers.indexOf('窗口编号');
      sheet[XLSX.utils.encode_cell({ c: windowColumn, r: 1 })].v = 'W999';
    });

    const result = excelImportService.import(brokenFile, { outputDir: makeTempDir() });

    expect(result.success).toBe(true);
    expect(result.counts.acceptedDishes).toBe(261);
    expect(result.counts.rejectedRows).toBe(1);
    expect(result.rejected[0].sheet).toBe('菜品数据');
    expect(result.rejected[0].rowNumber).toBe(2);
    expect(result.rejected[0].errors.join('、')).toContain('窗口不存在');
  });
  it('结构性导入失败时不替换已有数据', () => {
    const outputDir = makeTempDir();
    excelImportService.import(inputFile, { outputDir });
    const before = fs.readFileSync(path.join(outputDir, 'dishes.json'), 'utf8');
    const brokenFile = path.join(makeTempDir(), 'missing-sheets.xlsx');
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['错误表头'], ['value']]), '错误表');
    XLSX.writeFile(workbook, brokenFile);

    const result = excelImportService.import(brokenFile, { outputDir });

    expect(result.success).toBe(false);
    expect(fs.readFileSync(path.join(outputDir, 'dishes.json'), 'utf8')).toBe(before);
  });

  it('编号格式错误时拒绝对应行', () => {
    const brokenFile = makeBrokenSheet(inputFile, (workbook) => {
      const sheet = workbook.Sheets['食堂表'];
      const headers = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })[0];
      const idCol = headers.indexOf('食堂编号');
      sheet[XLSX.utils.encode_cell({ c: idCol, r: 1 })].v = 'C-bad';
    });

    const result = excelImportService.import(brokenFile, { outputDir: makeTempDir() });

    expect(result.success).toBe(true);
    expect(result.counts.acceptedCafeterias).toBe(4);
    expect(result.counts.rejectedRows).toBeGreaterThanOrEqual(1);
  });

  it('编号重复时拒绝对应行', () => {
    const brokenFile = makeBrokenSheet(inputFile, (workbook) => {
      const sheet = workbook.Sheets['菜品数据'];
      const headers = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })[0];
      const idCol = headers.indexOf('菜品编号');
      sheet[XLSX.utils.encode_cell({ c: idCol, r: 2 })].v = 'D001';
    });

    const result = excelImportService.import(brokenFile, { outputDir: makeTempDir() });

    expect(result.success).toBe(true);
    expect(result.counts.acceptedDishes).toBeLessThan(262);
    expect(result.counts.rejectedRows).toBeGreaterThanOrEqual(1);
    const dishErrors = result.rejected.filter(r => r.sheet === '菜品数据');
    expect(dishErrors.some(e => e.errors.join('、').includes('重复'))).toBe(true);
  });
  it('price_min 大于 price_max 时拒绝该行', () => {
    const brokenFile = makeBrokenSheet(inputFile, (workbook) => {
      const sheet = workbook.Sheets['菜品数据'];
      const headers = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })[0];
      const priceMinCol = headers.indexOf('price_min');
      sheet[XLSX.utils.encode_cell({ c: priceMinCol, r: 1 })].v = 99;
    });

    const result = excelImportService.import(brokenFile, { outputDir: makeTempDir() });

    expect(result.success).toBe(true);
    expect(result.counts.acceptedDishes).toBe(261);
    expect(result.counts.rejectedRows).toBe(1);
    expect(result.rejected[0].errors.join('、')).toContain('price_min 不能大于 price_max');
  });

  it('菜品所属食堂不存在时拒绝该行', () => {
    const brokenFile = makeBrokenSheet(inputFile, (workbook) => {
      const sheet = workbook.Sheets['菜品数据'];
      const headers = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })[0];
      const col = headers.indexOf('食堂编号');
      sheet[XLSX.utils.encode_cell({ c: col, r: 1 })].v = 'C999';
    });

    const result = excelImportService.import(brokenFile, { outputDir: makeTempDir() });

    expect(result.success).toBe(true);
    expect(result.counts.acceptedDishes).toBe(261);
    expect(result.counts.rejectedRows).toBe(1);
    expect(result.rejected[0].errors.join('、')).toContain('食堂不存在');
  });

  it('完好数据可导入到指定目录', () => {
    const tempDir = makeTempDir();
    const result = excelImportService.import(inputFile, { outputDir: tempDir });

    expect(result.success).toBe(true);
    expect(result.counts.acceptedDishes).toBe(262);
    expect(result.counts.acceptedWindows).toBe(42);
    expect(result.counts.acceptedCafeterias).toBe(5);
    const dishes = readJson(result.outputDir, 'dishes.json');
    expect(dishes.length).toBe(262);
    expect(dishes.find(d => d.dish_id === 'D001').cafeteria_id).toBe('C001');
    expect(dishes.find(d => d.dish_id === 'D262').cafeteria_id).toBe('C005');
  });

  it('导入报告包含完整的拒绝记录', () => {
    const brokenFile = makeBrokenSheet(inputFile, (workbook) => {
      const sheet = workbook.Sheets['窗口表'];
      const headers = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })[0];
      const col = headers.indexOf('所属食堂编号');
      sheet[XLSX.utils.encode_cell({ c: col, r: 1 })].v = 'C999';
    });

    const result = excelImportService.import(brokenFile, { outputDir: makeTempDir() });

    expect(result.success).toBe(true);
    expect(result.rejected.length).toBeGreaterThanOrEqual(1);
    expect(result.rejected[0]).toHaveProperty('sheet');
    expect(result.rejected[0]).toHaveProperty('rowNumber');
    expect(result.rejected[0]).toHaveProperty('errors');
    expect(Array.isArray(result.rejected[0].errors)).toBe(true);
    expect(result.rejected[0].errors.join('、')).toContain('食堂不存在');
  });

  it('食堂编号格式错误时，其窗口和菜品也被级联拒绝', () => {
    const brokenFile = makeBrokenSheet(inputFile, (workbook) => {
      const headers = XLSX.utils.sheet_to_json(workbook.Sheets['食堂表'], { header: 1, defval: null, raw: true })[0];
      const idCol = headers.indexOf('食堂编号');
      workbook.Sheets['食堂表'][XLSX.utils.encode_cell({ c: idCol, r: 1 })] = { v: 'C-bad' };
    });

    const result = excelImportService.import(brokenFile, { outputDir: makeTempDir() });

    expect(result.success).toBe(true);
    // C001 被改为 C-bad → 格式错误，食堂被拒绝 → 仅 4 个食堂通过
    expect(result.counts.acceptedCafeterias).toBe(4);
    // C001 的 7 个窗口因食堂不存在也被拒绝 → 剩 35 个
    expect(result.counts.acceptedWindows).toBe(35);
    // C001 的 38 道菜品因食堂不存在也被拒绝 → 剩 224 道
    expect(result.counts.acceptedDishes).toBe(224);
    // 拒绝列表应包含食堂格式错误、窗口和菜品因食堂不存在
    const dishRejects = result.rejected.filter(r => r.sheet === '菜品数据');
    expect(dishRejects.length).toBe(38);
  });

  it('窗口编号格式错误时，其菜品也被级联拒绝', () => {
    const brokenFile = makeBrokenSheet(inputFile, (workbook) => {
      const headers = XLSX.utils.sheet_to_json(workbook.Sheets['窗口表'], { header: 1, defval: null, raw: true })[0];
      const idCol = headers.indexOf('窗口编号');
      workbook.Sheets['窗口表'][XLSX.utils.encode_cell({ c: idCol, r: 6 })] = { v: 'W-bad' };
    });

    const result = excelImportService.import(brokenFile, { outputDir: makeTempDir() });

    expect(result.success).toBe(true);
    // 食堂仍然 5 个不变
    expect(result.counts.acceptedCafeterias).toBe(5);
    // W001 被改坏 → 窗口少 1 个
    expect(result.counts.acceptedWindows).toBe(41);
    // W001 的菜品因窗口不存在也被拒绝（W001 有 2 道菜，261-2=259）
    expect(result.counts.acceptedDishes).toBe(246); // W006 有 16 道菜品
    // 拒绝列表中应有 16 条菜品因窗口不存在记录
    const dishRejects = result.rejected.filter(r => r.sheet === '菜品数据' && r.errors.some(e => e.includes('窗口不存在')));
    expect(dishRejects.length).toBeGreaterThanOrEqual(1);
  });

  it('写入异常时不污染已有目标目录', () => {
    const outputDir = makeTempDir();
    // 先正常导入一次，保存文件内容和目录结构
    const first = excelImportService.import(inputFile, { outputDir });
    expect(first.success).toBe(true);
    const beforeFiles = fs.readdirSync(outputDir).sort();
    const beforeContent = fs.readFileSync(path.join(outputDir, 'dishes.json'), 'utf8');

    // 模拟 v3 Excel 文件损坏导致 readFile 抛出异常
    const corruptFile = path.join(makeTempDir(), 'corrupt.xlsx');
    fs.writeFileSync(corruptFile, 'not an excel file');

    const result = excelImportService.import(corruptFile, { outputDir });

    expect(result.success).toBe(false);
    // 已有目录内容不变
    expect(fs.readdirSync(outputDir).sort()).toEqual(beforeFiles);
    expect(fs.readFileSync(path.join(outputDir, 'dishes.json'), 'utf8')).toBe(beforeContent);
  });
});








