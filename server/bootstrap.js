const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const multer = require('multer');
const logger = require('./logger');

const { ArgumentParser } = require('argparse');
const { exit } = require('process');
const parser = new ArgumentParser({
  description: 'PWA | Paper application server!'
});

parser.addArgument(
  ['-p', '--port'],
  {
    help: 'Paper 서버의 포트를 지정합니다.'
  }
);

parser.addArgument(
  ['-m', '--mode'],
  {
    help: 'Paper 실행 모드를 지정합니다.'
  }
);

exports.init = (app) => {
  const { port, chapter, mode } = parser.parseArgs();
  const dir = chapter || 'workspace';
  const IMAGE_PATH = app.get('IMAGE_PATH');

  // 모드 값 확인 (default - 생략시 기본 값, babel)
  if (mode && !(mode === 'default' || mode === 'babel')) {
    logger.error(`알 수 없는 실행 모드입니다(${mode.yellow})`);
    process.exit(-1);
  }

  logger.info(`웹 페이지 루트(/) 디렉토리: ${dir.cyan}`);
  logger.info(`이미지 저장 디렉토리: ${IMAGE_PATH}`);
  logger.info(`실행 모드: ${(mode || 'default').cyan}`);

  process.env.PAPER_DIR = dir;
  process.env.PAPER_MODE = mode;

  app.use(cookieParser());
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // 서버로 오는 모든 요청 핸들링
  app.use('*', (_req, res, next) => {
    const afterResponse = () => {
      res.removeListener('finish', afterResponse);
      res.removeListener('close', afterResponse);

      const url = res.req.originalUrl;
      const method = res.req.method;
      let sStatusCode = res.statusCode.toString();
      let logType = logger.info;

      switch (sStatusCode.charAt(0)) {
        case '2':
          sStatusCode = sStatusCode.green;
          break;

        case '3':
          sStatusCode = sStatusCode.yellow;
          break;

        case '4':
        case '5':
          sStatusCode = sStatusCode.red;
          logType = logger.error;
          break;
      }

      if (url.includes('/api')) {
        logType(`${method} ${sStatusCode} ${' API '.bgBlue.white} ${url}`);
      } else {
        logType(`${method} ${sStatusCode} ${url}`);
      }
    };

    res.on('finish', afterResponse);
    res.on('close', afterResponse);

    next();
  });

  // 기본 리소스 라우팅
  app.use('/js', express.static(
    path.join(dir, mode === 'babel' ? 'dist' : 'js')
  ));
  app.use('/' + IMAGE_PATH, express.static(
    path.join(global.__maindir, IMAGE_PATH)
  ));
  app.use('/', express.static(dir));
  logger.success('Express 서버 설정 완료!');

  // 파일 업로드 관련 설정
  const storage = multer.diskStorage({
    destination (_req, _file, callback) {
      // upload 디렉토리에 파일 저장
      callback(null, path.join(global.__maindir, IMAGE_PATH));
    },
    filename (_req, file, callback) {
      // 현재 시간을 기준으로 파일명을 지정합니다
      const ext = file.originalname.split('.').pop();
      callback(null, `${+new Date()}.${ext}`);
    },
    limits: {
      fileSize: 1024 * 1024 * 10 // 10MB
    }
  });
  const upload = multer({ storage });

  return {
    upload,
    run () {
      const serverPort = port || 8080;
      app.listen(serverPort, () => {
        logger.info('서버 실행 중!:', `http://localhost:${serverPort}`.cyan);
      });
    }
  };
};
