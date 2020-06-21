const config = require('config');
const webpush = require('web-push');

// config에서 키 값 가져오기
const gcmKey = config.get('gcmKey');
const subject = config.get('subject');
const vapidPublic = config.get('vapidPublic');
const vapidPrivate = config.get('vapidPrivate');

// @ch10. 푸시 설정
webpush.setGCMAPIKey(gcmKey);
webpush.setVapidDetails(
  subject,
  vapidPublic,
  vapidPrivate
);

/**
 * 푸시 알림을 전송합니다.
 * @param {any} subscription 구독 정보 객체
 * @param {any} data 푸시 알림으로 전달할 데이터 객체
 */
function sendNotification (subscription, data) {
  return webpush.sendNotification(
    subscription,
    JSON.stringify(data)
  );
}

exports.publicKey = vapidPublic;
exports.sendNotification = sendNotification;
