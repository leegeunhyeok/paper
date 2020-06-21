const fs = require('fs');

class SimpleDatabase {
  constructor (config) {
    this._config = {};
    this.setConfig(config);
  }

  setConfig (config) {
    this._config = config;
  }

  getConfig () {
    return this._config;
  }

  /**
   * 테이블 목록에 해당하는 json 파일을 로드합니다
   * @param {array} tableList Table name list
   */
  load (tableList) {
    this.table = {};
    this.model = {};
    this._index = {};

    tableList.forEach((tableName) => {
      const tableData = require(`./data/${tableName}.json`);
      const model = require(`./model/${tableName}`);
      this._createIndex(tableName, tableData);
      this.model[tableName] = model;
    });
  }

  /**
   * 테이블 맵을 생성하고 데이터의 id를 인덱스(키)로 하는 맵을 초기화합니다
   * @param {string} tableName
   * @param {array} tableData
   */
  _createIndex (tableName, tableData) {
    const indexedDataMap = new Map();

    tableData.forEach((data) => {
      indexedDataMap.set(data.id, data);
    });

    this.table[tableName] = indexedDataMap;
  }

  /**
   * 해당 테이블의 유효성 검증
   * @param {string} tableName
   * @param {object} config
   */
  _validate (tableName, config) {
    const model = this.model[tableName];
    const { where, data, offset, limit } = config || {};

    if (offset !== undefined && offset < 0) {
      throw new Error('offset은 0보다 작을 수 없습니다.', offset);
    }

    if (limit !== undefined && limit < 0) {
      throw new Error('limit은 0보다 작을 수 없습니다.', limit);
    }

    if (Object.entries(where || {}).length) {
      for (let k of Object.keys(where)) {
        if (model[k] === undefined) {
          throw new Error('존재하지 않는 필드입니다', tableName);
        } else if (where[k] && model[k]().__proto__ !== where[k].__proto__) {
          throw new Error(`데이터 타입을 확인해주세요 ${tableName}.${k}`);
        }
      }
    }

    if (Object.entries(data || {}).length) {
      for (let k of Object.keys(data)) {
        if (model[k] === undefined) {
          throw new Error('존재하지 않는 필드입니다', tableName);
        } else if (data[k] && model[k]().__proto__ !== data[k].__proto__) {
          throw new Error(`데이터 타입을 확인해주세요 ${tableName}.${k}`);
        }
      }
    }
  }

  /**
   * 해당 옵션에 offset 또는 limit이 있는지 확인
   * @param {object} config
   */
  _hasOffsetOrLimit (config) {
    return config.offset !== undefined || config.limit !== undefined;
  }

  /**
   * 지정된 테이블의 ID 데이터를 obj로 치환 (주의: __replace는 유효성 검증을 진행하지 않음)
   * @param {string} tableName
   * @param {object} config
   * @param {object} obj
   */
  __replace(tableName, config, obj) {
    this.table[tableName].set(config.where.id, Object.assign({}, obj));
    if (this._config.autoCommit) {
      this.commit();
    }
  }

  /**
   * 지정한 테이블에서 데이터 조회
   * @param {string} tableName
   * @param {object} config
   */
  select (tableName, config) {
    const { where } = config || {};
    const keys = Object.keys(where || {});
    const list = [];

    this._validate(tableName, config);

    // id 값을 기준으로 조회한 경우 배열이 아닌 단일 레코드 반환
    //    - 레코드가 없다면 null 반환
    if ((where || {}).id !== undefined) {
      const row = this.table[tableName].get(where.id);

      if (row) {
        let valid = 0;
        for (let k of keys) {
          if (row[k] === where[k]) {
            ++valid;
          }
        }

        if (valid === keys.length) {
          return row;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else {
      for (let row of this.table[tableName]) {
        let valid = 0;
        row = row.pop();
        for (let k of keys) {
          if (row[k] === where[k]) {
            ++valid;
          }
        }

        if (valid === keys.length) {
          list.push(row);
        }
      }
    }

    if (list.length === 0) {
      return [];
    } else  {
      if (config.offset !== undefined && config.limit !== undefined) {
        return list.reverse().splice(config.offset, config.limit);
      } else if (config.offset !== undefined) {
        return list.reverse().splice(config.offset);
      } else if (config.limit !== undefined) {
        return list.reverse().splice(0, config.limit);
      } else {
        return list.reverse();
      }
    }
  }

  /**
   * 지정 테이블에 데이터 추가
   * @param {string} tableName
   * @param {object} config
   */
  insert (tableName, config) {
    if (config && !config.data) {
      throw new Error('삽입 데이터가 존재하지 않습니다.');
    }

    if (config.data.id === undefined) {
      throw new Error('id 필드는 필수값 입니다.');
    }

    if (this._hasOffsetOrLimit(config)) {
      throw new Error('insert는 offset 또는 limit 옵션을 사용할 수 없습니다.');
    }

    this._validate(tableName, config);
    const obj = {};
    for (let k in this.model[tableName]) {
      obj[k] = config.data[k] === undefined ? null : config.data[k];
    }

    this.table[tableName].set(config.data.id, obj);

    if (this._config.autoCommit) {
      this.commit();
    }

    return obj;
  }

  /**
   * 데이터 업데이트
   * @param {string} tableName
   * @param {object} config
   */
  update (tableName, config) {
    const _config = config || {};
    if (this._hasOffsetOrLimit(_config)) {
      throw new Error('update는 offset 또는 limit 옵션을 사용할 수 없습니다.');
    }

    const { data } = _config;
    const keys = Object.keys(data || {});
    let rows = this.select(tableName, config);
    let affectedRowsCount = 0;

    if (rows === null) {
      return {};
    }

    for (let row of Array.isArray(rows) ? rows : [ rows ]) {
      const updateData = Object.assign({}, row);
      for (let k of keys) {
        if (updateData[k] !== undefined) {
          updateData[k] = data[k];
          ++affectedRowsCount;
        }
      }

      this.table[tableName].set(row.id, updateData);
    }

    if (this._config.autoCommit) {
      this.commit();
    }

    if (rows.length === 1) {
      return rows[0];
    } else {
      return affectedRowsCount;
    }
  }

  /**
   * 데이터를 업데이트합니다. 만약 데이터가 없다면 새로 삽입합니다
   * @param {string} tableName
   * @param {object} config
   */
  upsert (tableName, config) {
    if (this._hasOffsetOrLimit(config)) {
      throw new Error('upsert는 offset 또는 limit 옵션을 사용할 수 없습니다.');
    }

    let rows = this.select(tableName, config);

    if (rows === null) {
      config.data.id = config.where.id;
      return this.insert(tableName, config);
    }

    rows = Array.isArray(rows) ? rows : [ rows ];

    if (rows.length !== 0) {
      return this.update(tableName, config);
    } else {
      config.data.id = config.where.id;
      return this.insert(tableName, config);
    }
  }

  /**
   * 데이터를 삭제합니다
   * @param {string} tableName
   * @param {object} config
   */
  delete (tableName, config) {
    if (this._hasOffsetOrLimit(config)) {
      throw new Error('delete는 offset 또는 limit 옵션을 사용할 수 없습니다.');
    }

    let rows = this.select(tableName, config);
    let affectedRowsCount = 0;

    if (rows === null) {
      return {};
    }

    rows = Array.isArray(rows) ? rows : [ rows ];

    for (let { id } of rows) {
      this.table[tableName].delete(id);
      ++affectedRowsCount;
    }

    if (this._config.autoCommit) {
      this.commit();
    }

    if (rows.length === 1) {
      return rows[0];
    } else {
      return affectedRowsCount;
    }
  }

  /**
   * 메모리에 저장된 데이터를 json 파일로 저장합니다
   */
  commit () {
    const tableList = Object.keys(this.table);
    tableList.forEach((tableName) => {
      const list = [];
      for (let data of this.table[tableName].values()) {
        list.push(data);
      }

      fs.writeFileSync(
        `${__dirname}/data/${tableName}.json`,
        JSON.stringify(list, null, 2)
      );
    });
  }
}

exports.SimpleDatabase = new SimpleDatabase();
