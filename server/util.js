const fs = require('fs');
const path = require('path');

/**
 * 해당 filepath 파일을 읽어 resolve 하는 프라미스를 반환합니다.
 * @param {string} filePath
 */
const readFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const target = path.join(process.env.PAPER_DIR, filePath);
    fs.readFile(target, 'utf-8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * number 자릿수가 length 보다 작을경우 0을 추가하여 반환합니다
 * @param {number} number
 * @param {number} length
 */
const paddingNumber = (number, length) => {
  const sNumber = number.toString();
  if (sNumber.length >= length) {
    return sNumber;
  } else {
    let padding = '';
    for (let i = 0; i < length - sNumber.length; i++) {
      padding += '0';
    }
    return padding + sNumber;
  }
};

/**
 * 현재 시점의 날짜 포맷을 반환합니다
 */
const getDatestamp = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = paddingNumber(d.getMonth() + 1, 2);
  const date = paddingNumber(d.getDate(), 2);
  return `${year}-${month}-${date}`;
};

/**
 * 헤더에서 사용자 이름값을 가져옵니다
 * @param {object} header 헤더 객체
 */
const getUser = (header) => {
  return decodeURI(header['x-paper-user']);
};

exports.readFile = readFile;
exports.paddingNumber = paddingNumber;
exports.getDatestamp = getDatestamp;
exports.getUser = getUser;
