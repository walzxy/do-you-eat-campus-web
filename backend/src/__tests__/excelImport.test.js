import { afterEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import XLSX from 'xlsx';
import excelImportService from '../services/excelImportService.js';

const tempDirs = [];

function buildTestWorkbook() {
  const workbook = XLSX.utils.book_new();
  const cafeteriaSheet = XLSX.utils.aoa_to_sheet([
    ['食堂编号', '食堂名称', '备注'],
    ['C001', '国定一食堂', '一楼'],
    ['C002', '国定二食堂', '二楼'],
    ['C003', '武川食堂', ''],
  ]);
  XLSX.utils.book_append_sheet(workbook, cafeteriaSheet, '食堂表');
  const windowSheet = XLSX.utils.aoa_to_sheet([
    ['窗口编号', '所属食堂编号', '窗口显示名称', '楼层'],
    ['W001', 'C001', '川味窗口', '1F'],
    ['W002', 'C001', '面食窗口', '1F'],
    ['W003', 'C002', '快餐窗口', '1F'],
    ['W004', 'C002', '饮料窗口', 'B1'],
    ['W005', 'C003', '拉面窗口', '1F'],
  ]);
  XLSX.utils.book_append_sheet(workbook, windowSheet, '窗口表');
  const dishSheet = XLSX.utils.aoa_to_sheet([
    ['菜品编号', '菜品名称', '关键词', '食堂编号', '食堂名称', '窗口编号', '窗口名称', 'price_min', 'price_max', '口味', 'category_major', 'category_minor', '是否支持打包', '供应时段', '供应状态', '备注', '数据来源', '最后核对日期'],
    ['D001', '麻辣香锅', '香锅', 'C001', '国定一食堂', 'W001', '川味窗口', 12, 18, '辣', '川湘小炒', '盖浇饭', '是', '午餐', '已核实售卖', '', '食堂', '2026-10-01'],
    ['D002', '酸辣粉', '酸辣粉', 'C001', '国定一食堂', 'W001', '川味窗口', 8, 8, '酸辣', '米线面条', '', '是', '午餐', '已核实售卖', '', '食堂', '2026-10-01'],
    ['D003', '回锅肉', '回锅肉', 'C001', '国定一食堂', 'W001', '川味窗口', 14, 14, '辣', '川湘小炒', '盖浇饭', '是', '午餐', '已核实售卖', '', '食堂', '2026-10-01'],
    ['D004', '牛肉面', '牛肉面', 'C001', '国定一食堂', 'W002', '面食窗口', 10, 12, '清淡', '米线面条', '', '是', '午餐晚餐', '已核实售卖', '', '食堂', '2026-10-01'],
    ['D005', '炸酱面', '炸酱面', 'C001', '国定一食堂', 'W002', '面食窗口', 8, 8, '咸', '米线面条', '', '是', '午餐', '已核实售卖', '', '食堂', '2026-10-01'],
    ['D006', '宫保鸡丁', '宫保鸡丁', 'C002', '国定二食堂', 'W003', '快餐窗口', 10, 10, '辣', '川湘小炒', '盖浇饭', '是', '午餐晚餐', '已核实售卖', '', '食堂', '2026-10-01'],
    ['D007', '番茄炒蛋', '番茄炒蛋', 'C002', '国定二食堂', 'W003', '快餐窗口', 6, 8, '清淡', '家常小炒', '', '是', '午餐晚餐', '已核实售卖', '', '食堂', '2026-10-01'],
    ['D008', '可乐', '可乐', 'C002', '国定二食堂', 'W004', '饮料窗口', 3, 3, '甜', '饮品', '', '是', '全天', '已核实售卖', '', '食堂', '2026-10-01'],
    ['D009', '雪碧', '雪碧', 'C002', '国定二食堂', 'W004', '饮料窗口', 3, 3, '甜', '饮品', '', '是', '全天', '已核实售卖', '', '食堂', '2026-10-01'],
    ['D010', '兰州拉面', '拉面', 'C003', '武川食堂', 'W005', '拉面窗口', 12, 12, '清淡', '米线面条', '', '是', '午餐晚餐', '已核实售卖', '', '食堂', '2026-10-01'],
  ]);
  XLSX.utils.book_append_sheet(workbook, dishSheet, '菜品数据');
  return workbook;
}

function makeTempDir() { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'canteen-import-test-')); tempDirs.push(d); return d; }
function readJson(directory, name) { return JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8')); }
function makeBrokenSheet(mutateFn) { const wb = buildTestWorkbook(); mutateFn(wb); const f = path.join(makeTempDir(), 'broken.xlsx'); XLSX.writeFile(wb, f); return f; }
afterEach(() => { while (tempDirs.length > 0) fs.rmSync(tempDirs.pop(), { recursive: true, force: true }); });
describe('Excel v3 导入（动态构造工作簿）', () => {
  it('正确导入测试数据集：3 个食堂、5 个窗口和 10 条菜品', () => {
    const testFile = path.join(makeTempDir(), 'test.xlsx');
    XLSX.writeFile(buildTestWorkbook(), testFile);

    const result = excelImportService.import(testFile, { outputDir: makeTempDir() });

    expect(result.success).toBe(true);
    expect(result.counts).toMatchObject({
      acceptedCafeterias: 3,
      acceptedWindows: 5,
      acceptedDishes: 10,
      rejectedRows: 0,
    });
    expect(readJson(result.outputDir, 'dishes.json').find(item => item.dish_id === 'D001').price_max).toBe(18);
    expect(fs.existsSync(result.reportPath)).toBe(true);
  });

  it('重复导入时核心数据结果一致', () => {
    const testFile = path.join(makeTempDir(), 'test.xlsx');
    XLSX.writeFile(buildTestWorkbook(), testFile);
    const outputDir = makeTempDir();

    const first = excelImportService.import(testFile, { outputDir });
    const firstData = ['cafeterias.json', 'windows.json', 'dishes.json']
      .map(name => fs.readFileSync(path.join(outputDir, name), 'utf8'));
    const second = excelImportService.import(testFile, { outputDir });
    const secondData = ['cafeterias.json', 'windows.json', 'dishes.json']
      .map(name => fs.readFileSync(path.join(outputDir, name), 'utf8'));

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(secondData).toEqual(firstData);
  });

  it('单行关系错误时拒绝该行并保留其余合法数据', () => {
    const brokenFile = makeBrokenSheet((workbook) => {
      const sheet = workbook.Sheets['菜品数据'];
      const headers = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })[0];
      const windowColumn = headers.indexOf('窗口编号');
      sheet[XLSX.utils.encode_cell({ c: windowColumn, r: 1 })].v = 'W999';
    });

    const result = excelImportService.import(brokenFile, { outputDir: makeTempDir() });

    expect(result.success).toBe(true);
    expect(result.counts.acceptedDishes).toBe(9);
    expect(result.counts.rejectedRows).toBe(1);
    expect(result.rejected[0].sheet).toBe('菜品数据');
    expect(result.rejected[0].rowNumber).toBe(2);
    expect(result.rejected[0].errors.join('、')).toContain('窗口不存在');
  });

  it('结构性导入失败时不替换已有数据', () => {
    const testFile = path.join(makeTempDir(), 'test.xlsx');
    XLSX.writeFile(buildTestWorkbook(), testFile);
    const outputDir = makeTempDir();

    const first = excelImportService.import(testFile, { outputDir });
    expect(first.success).toBe(true);
    const beforeData = fs.readFileSync(path.join(outputDir, 'dishes.json'), 'utf8');

    const brokenFile = path.join(makeTempDir(), 'missing-sheets.xlsx');
    const brokenWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(brokenWorkbook, XLSX.utils.aoa_to_sheet([['错误表头'], ['value']]), '错误表');
    XLSX.writeFile(brokenWorkbook, brokenFile);

    const result = excelImportService.import(brokenFile, { outputDir });

    expect(result.success).toBe(false);
    expect(fs.readFileSync(path.join(outputDir, 'dishes.json'), 'utf8')).toBe(beforeData);
  });

  it('菜品 price_max 为空时正常导入（单值价格场景）', () => {
    const workbook = buildTestWorkbook();
    const headers = XLSX.utils.sheet_to_json(workbook.Sheets['菜品数据'], { header: 1, defval: null, raw: true })[0];
    const col = headers.indexOf('price_max');
    workbook.Sheets['菜品数据'][XLSX.utils.encode_cell({ c: col, r: 7 })] = { t: 's', v: '' };
    const modifiedFile = path.join(makeTempDir(), 'modified.xlsx');
    XLSX.writeFile(workbook, modifiedFile);

    const result = excelImportService.import(modifiedFile, { outputDir: makeTempDir() });
    expect(result.success).toBe(true);
    const dishes = readJson(result.outputDir, 'dishes.json');
    const target = dishes.find(item => item.dish_id === 'D007');
    expect(target).toBeDefined();
    expect(target.price_max === null || target.price_max === '').toBe(true);
  });

  it('price_min 为空（无值）时拒绝该行', () => {
    const brokenFile = makeBrokenSheet((workbook) => {
      const sheet = workbook.Sheets['菜品数据'];
      const headers = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })[0];
      const col = headers.indexOf('price_min');
      delete sheet[XLSX.utils.encode_cell({ c: col, r: 1 })];
    });

    const result = excelImportService.import(brokenFile, { outputDir: makeTempDir() });
    expect(result.success).toBe(true);
    expect(result.counts.rejectedRows).toBeGreaterThanOrEqual(1);
    expect(result.rejected.some(r => r.errors.join('、').includes('price_min'))).toBe(true);
  });
it('price_min 大于 price_max 时拒绝该行', () => {
    const brokenFile = makeBrokenSheet((workbook) => {
      const headers = XLSX.utils.sheet_to_json(workbook.Sheets['菜品数据'], { header: 1, defval: null, raw: true })[0];
      const pMinCol = headers.indexOf('price_min');
      const pMaxCol = headers.indexOf('price_max');
      workbook.Sheets['菜品数据'][XLSX.utils.encode_cell({ c: pMinCol, r: 2 })] = { t: 'n', v: 15 };
      workbook.Sheets['菜品数据'][XLSX.utils.encode_cell({ c: pMaxCol, r: 2 })] = { t: 'n', v: 8 };
    });

    const result = excelImportService.import(brokenFile, { outputDir: makeTempDir() });
    expect(result.success).toBe(true);
    expect(result.counts.rejectedRows).toBe(1);
    expect(result.rejected[0].errors.join('、')).toContain('大于');
  });

  it('缺少 category_major 时拒绝该行', () => {
    const brokenFile = makeBrokenSheet((workbook) => {
      const headers = XLSX.utils.sheet_to_json(workbook.Sheets['菜品数据'], { header: 1, defval: null, raw: true })[0];
      const col = headers.indexOf('category_major');
      workbook.Sheets['菜品数据'][XLSX.utils.encode_cell({ c: col, r: 1 })] = { t: 's', v: '' };
    });

    const result = excelImportService.import(brokenFile, { outputDir: makeTempDir() });
    expect(result.success).toBe(true);
    expect(result.counts.rejectedRows).toBe(1);
    expect(result.rejected[0].errors.join('、')).toContain('大类');
  });

  it('食堂编号格式错误时拒绝该食堂', () => {
    const brokenFile = makeBrokenSheet((workbook) => {
      const headers = XLSX.utils.sheet_to_json(workbook.Sheets['食堂表'], { header: 1, defval: null, raw: true })[0];
      const idCol = headers.indexOf('食堂编号');
      workbook.Sheets['食堂表'][XLSX.utils.encode_cell({ c: idCol, r: 1 })] = { v: 'C-bad' };
    });

    const result = excelImportService.import(brokenFile, { outputDir: makeTempDir() });
    expect(result.success).toBe(true);
    expect(result.counts.acceptedCafeterias).toBe(2);
  });

  it('食堂编号格式错误时，其窗口和菜品也被级联拒绝', () => {
    const brokenFile = makeBrokenSheet((workbook) => {
      const headers = XLSX.utils.sheet_to_json(workbook.Sheets['食堂表'], { header: 1, defval: null, raw: true })[0];
      const idCol = headers.indexOf('食堂编号');
      workbook.Sheets['食堂表'][XLSX.utils.encode_cell({ c: idCol, r: 1 })] = { v: 'C-bad' };
    });

    const result = excelImportService.import(brokenFile, { outputDir: makeTempDir() });
    expect(result.success).toBe(true);
    expect(result.counts.acceptedCafeterias).toBe(2);
    expect(result.counts.acceptedWindows).toBe(3);
    expect(result.counts.acceptedDishes).toBe(5);
    const dishRejects = result.rejected.filter(r => r.sheet === '菜品数据');
    expect(dishRejects.length).toBe(5);
  });

  it('窗口编号格式错误时，其菜品也被级联拒绝', () => {
    const brokenFile = makeBrokenSheet((workbook) => {
      const headers = XLSX.utils.sheet_to_json(workbook.Sheets['窗口表'], { header: 1, defval: null, raw: true })[0];
      const idCol = headers.indexOf('窗口编号');
      workbook.Sheets['窗口表'][XLSX.utils.encode_cell({ c: idCol, r: 5 })] = { v: 'W-bad' };
    });

    const result = excelImportService.import(brokenFile, { outputDir: makeTempDir() });
    expect(result.success).toBe(true);
    expect(result.counts.acceptedCafeterias).toBe(3);
    expect(result.counts.acceptedWindows).toBe(4);
    expect(result.counts.acceptedDishes).toBe(9);
    const dishRejects = result.rejected.filter(r => r.sheet === '菜品数据' && r.errors.some(e => e.includes('窗口不存在')));
    expect(dishRejects.length).toBeGreaterThanOrEqual(1);
  });

  it('写入异常时不污染已有目标目录', () => {
    const testFile = path.join(makeTempDir(), 'test.xlsx');
    XLSX.writeFile(buildTestWorkbook(), testFile);
    const outputDir = makeTempDir();

    const first = excelImportService.import(testFile, { outputDir });
    expect(first.success).toBe(true);
    const beforeFiles = fs.readdirSync(outputDir).sort();
    const beforeContent = fs.readFileSync(path.join(outputDir, 'dishes.json'), 'utf8');

    const corruptFile = path.join(makeTempDir(), 'corrupt.xlsx');
    fs.writeFileSync(corruptFile, 'not an excel file');

    const result = excelImportService.import(corruptFile, { outputDir });
    expect(result.success).toBe(false);
    expect(fs.readdirSync(outputDir).sort()).toEqual(beforeFiles);
    expect(fs.readFileSync(path.join(outputDir, 'dishes.json'), 'utf8')).toBe(beforeContent);
  });

  it('未知食堂编号的窗口导致菜品所属窗口与食堂不匹配', () => {
    const brokenFile = makeBrokenSheet((workbook) => {
      const headers = XLSX.utils.sheet_to_json(workbook.Sheets['窗口表'], { header: 1, defval: null, raw: true })[0];
      const col = headers.indexOf('所属食堂编号');
      workbook.Sheets['窗口表'][XLSX.utils.encode_cell({ c: col, r: 1 })].v = 'C999';
    });

    const result = excelImportService.import(brokenFile, { outputDir: makeTempDir() });
    expect(result.success).toBe(true);
    expect(result.rejected.length).toBeGreaterThanOrEqual(1);
    expect(result.rejected[0]).toHaveProperty('sheet');
    expect(result.rejected[0]).toHaveProperty('rowNumber');
    expect(result.rejected[0]).toHaveProperty('errors');
    expect(Array.isArray(result.rejected[0].errors)).toBe(true);
    expect(result.rejected[0].errors.join('、')).toContain('不匹配');
  });
});