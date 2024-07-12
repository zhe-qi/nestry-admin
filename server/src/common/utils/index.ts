import * as fs from 'node:fs';
import day from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/zh-cn';
import { camelCase } from 'lodash';
import { isNotEmpty } from 'class-validator';

day.extend(utc);
day.extend(timezone);
day.locale('zh-cn');
day.tz.setDefault('Asia/Shanghai');

/** dayjs 时区设置 */
export const dayjs = day.tz;

/** 获取当前日期 */
export const nowDate = () => dayjs().format('YYYY-MM-DD');

/** 获取当前时间 */
export const nowDateTime = () => dayjs().format('YYYY-MM-DD HH:mm:ss');

/** 格式化日期 */
export function formatDate(date: Date, format = 'YYYY-MM-DD HH:mm:ss') {
  return date && dayjs(date).format(format);
}

/** 获取本地时间 */
export const localDate = () => new Date(new Date().toLocaleString());

/** 创建文件夹 */
export const createFolder = function (folder) {
  try {
    fs.accessSync(folder);
  } catch {
    fs.mkdirSync(folder, { recursive: true });
  }
};

/**
 * @desc 执行具有并发限制的异步任务池。
 * @param  poolLimit - 并发限制，指定同时执行的最大异步任务数量。
 * @param  iterable - 包含异步任务的可迭代对象。
 * @param iteratorFn - 异步任务的迭代函数，接受一个参数并返回一个Promise。
 * @returns - 返回一个Promise，当所有异步任务完成时解析为一个包含所有结果的数组。
 */
export async function asyncPool<T, R>(poolLimit: number, iterable: T[], iteratorFn: (item: T, iterable: T[]) => Promise<R>): Promise<R[]> {
  let i = 0;
  const results: Promise<R>[] = [];
  const executing = new Set<Promise<R>>();

  const enqueue = async () => {
    if (i === iterable.length) { return; }
    const item = iterable[i++];
    const promise = (async () => iteratorFn(item, iterable))();
    results.push(promise);

    executing.add(promise);
    const clean = () => executing.delete(promise);
    promise.then(clean).catch(clean);

    if (executing.size >= poolLimit) {
      await Promise.race(executing);
    }
    await enqueue();
  };

  await enqueue();
  return Promise.all(results);
}

/** @desc 数组树形化 */
export function tree(
  arr = [],
  id = 'id',
  pid = 'pid',
  rootValue = 0,
) {
  const result = []; // 存放根节点
  const map = {}; // 用于快速查找节点

  // 首先，构建映射表
  for (const item of arr) {
    if (!map[item[id]]) {
      map[item[id]] = { ...item, children: [] };
    } else {
      // 如果已经有children数组，保留该数组
      map[item[id]] = { ...item, children: map[item[id]].children };
    }

    const node = map[item[id]];

    if (item[pid] === rootValue) {
      // 根节点直接加入结果集
      result.push(node);
    } else {
      // 非根节点，加入父节点的children数组
      if (!map[item[pid]]) {
        // 如果父节点不存在，先创建父节点
        map[item[pid]] = { children: [] };
      }
      map[item[pid]].children.push(node);
    }
  }

  return result;
}

/** @desc 转换为camelCase并且首字母大写 */
export function toPascalCase(str) {
  return str[0].toUpperCase() + camelCase(str).slice(1);
}

// 全局通用处理函数，用于构建查询条件
export function buildQueryCondition<T, R>(q: T, conditions: Record<string, any>): R {
  const queryCondition: Record<string, any> = {};

  Object.entries(conditions).forEach(([key, value]) => {
    if (q[key] !== undefined && q[key] !== null && q[key] !== '') {
      const condition = value(q[key]);
      if (condition !== undefined) {
        queryCondition[key] = condition;
      }
    }
  });

  return queryCondition as R;
}

// 封装日期范围查询条件处理函数
export function addDateRangeConditions(queryCondition: Record<string, any>, params: Record<string, any>, dateRanges: Record<string, [string, string]>) {
  Object.entries(dateRanges).forEach(([field, [begin, end]]) => {
    if (isNotEmpty(params[begin]) && isNotEmpty(params[end])) {
      queryCondition[field] = {
        gte: params[begin],
        lte: params[end],
      };
    }
  });
}
