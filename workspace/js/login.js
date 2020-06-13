// 이미 사용자 정보가 존재한다면 메인 페이지로 이동
if (localStorage.getItem('name')) {
  location.href = '/';
}

$(function () {
  let _messageOpen = false;
  let _messageTimeout = null;
  let errorMessage = document.getElementById('error');

  /**
  * 메시지를 표시합니다.
  * @param {string} message
  */
  function showMessage (message) {
    clearTimeout(_messageTimeout);
    if (_messageOpen) {
      errorMessage.classList.add('hidden');
      _messageTimeout = setTimeout(() => {
        _messageOpen = false;
        showMessage(message);
      }, 500);
    } else {
      _messageOpen = true;
      errorMessage.textContent = message;
      errorMessage.classList.remove('hidden');
      _messageTimeout = setTimeout(() => {
        _messageOpen = false;
        errorMessage.classList.add('hidden');
      }, 3000);
    }
  }

  // 로그인 폼
  document.getElementById('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const userName = document.getElementById('userName').value;

    if (userName) {
      if (userName.length > 8) {
        showMessage('이름은 최대 8자리 입니다!');
      } else {
        // 로컬스토리지에 사용자 인증 정보(이름) 저장
        localStorage.setItem('name', userName);
        location.href = '/';
      }
    } else {
      showMessage('이름을 입력해주세요!');
    }
  });
});
