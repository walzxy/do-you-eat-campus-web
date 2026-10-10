// Excel v3 导入服务：先转换并校验到临时目录，成功后原子替换目标目录。
const fs = require('fs');
const os = require('os');
const path = require('path');
const XLSX = require('xlsx');
const { config } = require('../config');
const { validateDishRow } = require('../schemas/dishSchema');

const SHEETS = { cafeterias: '食堂表', windows: '窗口表', dishes: '菜品数据' };
const HEADERS = {
  cafeterias: ['食堂编号', '食堂名称', '备注'],
  windows: ['窗口编号', '所属食堂编号', '窗口显示名称', '楼层'],
  dishes: [
    '菜品编号', '菜品名称', '关键词', '食堂编号', '食堂名称', '窗口编号', '窗口名称',
    'price_min', 'price_max', '口味', 'category_major', 'category_minor', '是否支持打包',
    '供应时段', '供应状态', '备注', '数据来源', '最后核对日期',
  ],
};
const ID_PATTERNS = {
  cafeteria_id: /^C\d{3}$/,
  window_id: /^W\d{3}$/,
  dish_id: /^D\d{3}$/,
};

function valueOrEmpty(value) {
  return value === undefined || value === null ? '' : value;
}

function dateToString(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return valueOrEmpty(value);
}

function readRows(workbook, sheetName, requiredHeaders) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error('缺少工作表: ' + sheetName);
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });
  const headers = (rows.shift() || []).map(value => String(value || '').trim());
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(sheetName + ' 缺少表头: ' + missingHeaders.join('、'));
  }
  return rows.map((row, index) => ({
    rowNumber: index + 2,
    values: Object.fromEntries(headers.map((header, columnIndex) => [header, row[columnIndex]])),
  }));
}

function mapCafeterias(rows) {
  return rows.map(row => ({
    cafeteria_id: valueOrEmpty(row.values['食堂编号']),
    cafeteria_name: valueOrEmpty(row.values['食堂名称']),
    campus: '',
    remark: valueOrEmpty(row.values['备注']),
  }));
}

function mapWindows(rows) {
  return rows.map(row => ({
    window_id: valueOrEmpty(row.values['窗口编号']),
    cafeteria_id: valueOrEmpty(row.values['所属食堂编号']),
    window_name: valueOrEmpty(row.values['窗口显示名称']),
    remark: valueOrEmpty(row.values['楼层']),
  }));
}

function mapDishes(rows) {
  return rows.map(row => ({
    dish_id: valueOrEmpty(row.values['菜品编号']),
    dish_name: valueOrEmpty(row.values['菜品名称']),
    keywords: valueOrEmpty(row.values['关键词']),
    cafeteria_id: valueOrEmpty(row.values['食堂编号']),
    cafeteria_name: valueOrEmpty(row.values['食堂名称']),
    window_id: valueOrEmpty(row.values['窗口编号']),
    window_name: valueOrEmpty(row.values['窗口名称']),
    price_min: row.values.price_min,
    price_max: row.values.price_max,
    flavor: valueOrEmpty(row.values['口味']),
    category_major: valueOrEmpty(row.values.category_major),
    category_minor: valueOrEmpty(row.values.category_minor),
    is_packable: valueOrEmpty(row.values['是否支持打包']),
    service_period: valueOrEmpty(row.values['供应时段']),
    availability_status: valueOrEmpty(row.values['供应状态']),
    remark: valueOrEmpty(row.values['备注']),
    source: valueOrEmpty(row.values['数据来源']),
    last_verified_date: dateToString(row.values['最后核对日期']),
  }));
}

function addError(errors, rowNumber, message) {
  if (!errors.has(rowNumber)) errors.set(rowNumber, []);
  errors.get(rowNumber).push(message);
}

function validateIds(rows, sourceField, canonicalField, label, errors) {
  const seen = new Map();
  rows.forEach(row => {
    const value = String(row.values[sourceField] || '');
    if (!ID_PATTERNS[canonicalField].test(value)) addError(errors, row.rowNumber, label + '格式不正确: ' + value);
    if (!seen.has(value)) seen.set(value, []);
    seen.get(value).push(row.rowNumber);
  });
  seen.forEach((rowNumbers, value) => {
    if (value && rowNumbers.length > 1) {
      rowNumbers.forEach(rowNumber => addError(errors, rowNumber, label + '重复: ' + value));
    }
  });
}

function validateWorkbook(workbook) {
  const cafeteriaRows = readRows(workbook, SHEETS.cafeterias, HEADERS.cafeterias);
  const windowRows = readRows(workbook, SHEETS.windows, HEADERS.windows);
  const dishRows = readRows(workbook, SHEETS.dishes, HEADERS.dishes);
  const cafeteriaErrors = new Map();
  const windowErrors = new Map();
  const dishErrors = new Map();

  validateIds(cafeteriaRows, '食堂编号', 'cafeteria_id', '食堂编号', cafeteriaErrors);
  validateIds(windowRows, '窗口编号', 'window_id', '窗口编号', windowErrors);
  validateIds(dishRows, '菜品编号', 'dish_id', '菜品编号', dishErrors);

  const cafeterias = mapCafeterias(cafeteriaRows);
  const windows = mapWindows(windowRows);
  const dishes = mapDishes(dishRows);
  const cafeteriaIds = new Set(cafeterias.map(item => item.cafeteria_id));
  const windowById = new Map(windows.map(item => [item.window_id, item]));

  windowRows.forEach((row, index) => {
    const item = windows[index];
    if (!cafeteriaIds.has(item.cafeteria_id)) {
      addError(windowErrors, row.rowNumber, '窗口所属食堂不存在: ' + item.cafeteria_id);
    }
  });

  dishRows.forEach((row, index) => {
    const item = dishes[index];
    validateDishRow(item).forEach(message => addError(dishErrors, row.rowNumber, message));
    const window = windowById.get(item.window_id);
    if (!window) {
      addError(dishErrors, row.rowNumber, '菜品所属窗口不存在: ' + item.window_id);
    } else if (window.cafeteria_id !== item.cafeteria_id) {
      addError(dishErrors, row.rowNumber, '菜品所属窗口与食堂不匹配');
    }
    if (!cafeteriaIds.has(item.cafeteria_id)) {
      addError(dishErrors, row.rowNumber, '菜品所属食堂不存在: ' + item.cafeteria_id);
    }
  });

  const rejected = [
    ...Array.from(cafeteriaErrors, ([rowNumber, errors]) => ({ sheet: SHEETS.cafeterias, rowNumber, errors })),
    ...Array.from(windowErrors, ([rowNumber, errors]) => ({ sheet: SHEETS.windows, rowNumber, errors })),
    ...Array.from(dishErrors, ([rowNumber, errors]) => ({ sheet: SHEETS.dishes, rowNumber, errors })),
  ].sort((a, b) => a.sheet.localeCompare(b.sheet) || a.rowNumber - b.rowNumber);
  const validRows = (rows, mapped, errors) => mapped.filter((_, index) => !errors.has(rows[index].rowNumber));
  let acceptedCafeterias = validRows(cafeteriaRows, cafeterias, cafeteriaErrors);
  let acceptedWindows = validRows(windowRows, windows, windowErrors);
  let acceptedDishes = validRows(dishRows, dishes, dishErrors);

  // 级联拒绝：移除引用已拒绝父级的子级行
  const acceptedCafeteriaIds = new Set(acceptedCafeterias.map(c => c.cafeteria_id));
  const orphanWindows = [];
  acceptedWindows = acceptedWindows.filter(w => {
    if (acceptedCafeteriaIds.has(w.cafeteria_id)) return true;
    orphanWindows.push(w);
    return false;
  });
  const acceptedWindowIds = new Set(acceptedWindows.map(w => w.window_id));
  const orphanDishes = [];
  acceptedDishes = acceptedDishes.filter(d => {
    if (acceptedCafeteriaIds.has(d.cafeteria_id) && acceptedWindowIds.has(d.window_id)) return true;
    orphanDishes.push(d);
    return false;
  });

  // 将级联拒绝记录加入 rejected 列表
  // 查找被级联移除行的原始行号
  orphanWindows.forEach(w => {
    const found = windowRows.find(r => r.values['窗口编号'] === w.window_id);
    if (found) rejected.push({ sheet: SHEETS.windows, rowNumber: found.rowNumber, errors: [`所属食堂行已被拒绝，级联移除该窗口`] });
  });
  orphanDishes.forEach(d => {
    const found = dishRows.find(r => r.values['菜品编号'] === d.dish_id);
    if (found) rejected.push({ sheet: SHEETS.dishes, rowNumber: found.rowNumber, errors: [`所属父级行已被拒绝，级联移除该菜品`] });
  });

  return {
    cafeterias: acceptedCafeterias,
    windows: acceptedWindows,
    dishes: acceptedDishes,
    rejected,
    counts: {
      cafeterias: cafeterias.length,
      windows: windows.length,
      dishes: dishes.length,
      acceptedCafeterias: acceptedCafeterias.length,
      acceptedWindows: acceptedWindows.length,
      acceptedDishes: acceptedDishes.length,
      rejectedRows: rejected.length,
      cascadeRejectedWindows: orphanWindows.length,
      cascadeRejectedDishes: orphanDishes.length,
    },
  };
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function writeOutput(directory, result) {
  fs.mkdirSync(directory, { recursive: true });
  writeJson(path.join(directory, 'cafeterias.json'), result.cafeterias);
  writeJson(path.join(directory, 'windows.json'), result.windows);
  writeJson(path.join(directory, 'dishes.json'), result.dishes);
  const reportPath = path.join(directory, 'import-report.json');
  writeJson(reportPath, {
    source: result.source,
    generated_at: new Date().toISOString(),
    counts: result.counts,
    rejected: result.rejected,
  });
  return reportPath;
}

function replaceDirectory(stagingDir, outputDir) {
  const parent = path.dirname(outputDir);
  fs.mkdirSync(parent, { recursive: true });
  const backupDir = outputDir + '.backup-' + Date.now();
  let movedExisting = false;
  try {
    if (fs.existsSync(outputDir)) {
      fs.renameSync(outputDir, backupDir);
      movedExisting = true;
    }
    fs.renameSync(stagingDir, outputDir);
    if (movedExisting) fs.rmSync(backupDir, { recursive: true, force: true });
  } catch (error) {
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
    if (movedExisting && fs.existsSync(backupDir)) fs.renameSync(backupDir, outputDir);
    throw error;
  }
}

class ExcelImportService {
  constructor() {
    this.importDir = path.resolve(config.dataDir, 'import');
    this.processedDir = path.resolve(config.dataDir, 'processed');
    this.rejectedDir = path.resolve(config.dataDir, 'rejected');
  }

  listPending() {
    if (!fs.existsSync(this.importDir)) return [];
    return fs.readdirSync(this.importDir).filter(file => file.endsWith('.xlsx'));
  }

  validate(filePath) {
    try {
      const workbook = XLSX.readFile(filePath, { cellDates: true });
      const result = validateWorkbook(workbook);
      return { valid: result.rejected.length === 0, ...result };
    } catch (error) {
      return { valid: false, errors: [error.message], rejected: [] };
    }
  }

  import(filePath, options = {}) {
    const outputDir = path.resolve(options.outputDir || config.activeDataDir);
    let stagingDir;
    try {
      const workbook = XLSX.readFile(filePath, { cellDates: true });
      const result = validateWorkbook(workbook);
      result.source = path.resolve(filePath);
      stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), 'canteen-import-'));
      writeOutput(stagingDir, result);
      replaceDirectory(stagingDir, outputDir);
      stagingDir = null;
      return { success: true, outputDir, reportPath: path.join(outputDir, 'import-report.json'), ...result };
    } catch (error) {
      return { success: false, message: error.message, rejected: [] };
    } finally {
      if (stagingDir && fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
    }
  }
}

module.exports = new ExcelImportService();
module.exports.validateWorkbook = validateWorkbook;
