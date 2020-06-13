const colors = require('colors');
const { paddingNumber } = require('./util');

// 에러 로그 레벨에 따른 출력 색상
const LEVEL_COLORS = {
  info: colors.green,
  debug: colors.blue,
  success: colors.green,
  warning: colors.yellow,
  danger: colors.red,
  error: colors.red,
  critical: colors.magenta
};

/**
 * 현재 시점의 날짜, 시간 문자열을 반환합니다
 */
const timestamp = () => {
  const d = new Date();

  const yyyy = d.getFullYear();
  const MM = paddingNumber(d.getMonth() + 1, 2);
  const dd = paddingNumber(d.getDate(), 2);

  const hh = paddingNumber(d.getHours(), 2);
  const mm = paddingNumber(d.getMinutes(), 2);
  const ss = paddingNumber(d.getSeconds(), 2);
  const aaa = paddingNumber(d.getMilliseconds(), 3);

  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}.${aaa}`;
};

// 해당 레벨의 로그를 출력합니다
const printLog = (level, ...msg) => {
  console.log(
    `[${timestamp()}]`.gray,
    `${LEVEL_COLORS[level](level.toUpperCase())}`,
    '-',
    ...msg
  );
};

const log = {
  info (...msg) {
    printLog('info', ...msg);
  },
  debug (...msg) {
    printLog('debug', ...msg);
  },
  success (...msg) {
    printLog('success', ...msg);
  },
  warning (...msg) {
    printLog('warning', ...msg);
  },
  danger (...msg) {
    printLog('danger', ...msg);
  },
  error (...msg) {
    printLog('error', ...msg);
  },
  critical (...msg) {
    printLog('critical', ...msg);
  }
};

module.exports = log;
