'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'processed');
const REQUIRED_FILES = ['cafeterias.json', 'windows.json', 'dishes.json'];

/**
 * 读取并验证一份 JSON 数据文件
 * @param {string} filename - 文件名
 * @returns {Array} 解析后的数组
 * @throws {Error} 文件缺失、解析失败或数据为空时抛出
 */
function loadDataFile(filename) {
  const filePath = path.join(DATA_DIR, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`数据文件 ${filename} 缺失，拒绝服务`);
  }

  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    throw new Error(`读取数据文件 ${filename} 失败: ${err.message}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`数据文件 ${filename} 损坏，无法解析 JSON: ${err.message}`);
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`数据文件 ${filename} 内容为空，拒绝回退到构造数据`);
  }

  return data;
}

/**
 * 云函数入口
 */
exports.main_handler = async (event, context) => {
  try {
    // 检查所有必需文件是否存在（快速失败）
    for (const file of REQUIRED_FILES) {
      if (!fs.existsSync(path.join(DATA_DIR, file))) {
        return {
          error: true,
          message: `数据文件 ${file} 缺失，拒绝服务`,
        };
      }
    }

    const cafeterias = loadDataFile('cafeterias.json');
    const windows = loadDataFile('windows.json');
    const dishes = loadDataFile('dishes.json');

    return {
      success: true,
      data: {
        cafeterias,
        windows,
        dishes,
      },
      counts: {
        cafeterias: cafeterias.length,
        windows: windows.length,
        dishes: dishes.length,
      },
    };
  } catch (err) {
    console.error('[campus-canteen-api] 严重错误:', err.message);
    return {
      error: true,
      message: `服务初始化失败: ${err.message}`,
    };
  }
};