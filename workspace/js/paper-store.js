class PaperStore {
  constructor () {
    this._VERSION = 2;
  }

  _openDatabase () {
    return new Promise((resolve, reject) => {
      const request = self.indexedDB.open('paper-db', this._VERSION);

      request.onerror = (event) => {
        reject(event);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('IndexedDB 기존 버전:', event.oldVersion);
        console.log('IndexedDB 최신 버전:', this._VERSION);

        if (event.oldVersion < 1) {
          console.log('IndexedDB 버전 업데이트: 1');
          db.createObjectStore('post', {
            keyPath: 'id'
          });
        }

        if (event.oldVersion < 2) {
          console.log('IndexedDB 버전 업데이트: 2');
          const jobStore = db.createObjectStore('job', {
            keyPath: 'id'
          });

          jobStore.createIndex('job_owner', 'user');
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  clearPost () {
    return new Promise((resolve, reject) => {
      this._openDatabase().then((db) => {
        const transaction = db.transaction('post', 'readwrite');
        const postObjectStore = transaction.objectStore('post');
        postObjectStore.clear();

        transaction.oncomplete = (event) => {
          resolve(event);
        };

        transaction.onerror = (event) => {
          reject(event);
        };
      }).catch((err) => {
        reject(err);
      });
    });
  }

  savePost (data) {
    return new Promise((resolve, reject) => {
      this._openDatabase().then((db) => {
        const transaction = db.transaction('post', 'readwrite');
        const postObjectStore = transaction.objectStore('post');
        postObjectStore.add(data);

        transaction.oncomplete = (event) => {
          resolve(event);
        };

        transaction.onerror = (event) => {
          reject(event);
        };
      }).catch((err) => {
        reject(err);
      });
    });
  }

  getPosts () {
    return new Promise((resolve, reject) => {
      this._openDatabase().then((db) => {
        const posts = [];
        const cursorRequest = db.transaction('post')
          .objectStore('post')
          .openCursor(null, 'prev');

        cursorRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            posts.push(cursor.value);
            cursor.continue();
          } else {
            resolve(posts);
          }
        };

        cursorRequest.onerror = (event) => {
          reject(event);
        };
      }).catch((err) => {
        reject(err);
      });
    });
  }

  updatePost (key, state) {
    return new Promise((resolve, reject) => {
      this._openDatabase().then((db) => {
        const transation = db.transaction('post', 'readwrite');
        const postObjectStore = transation.objectStore('post');
        const cursorRequest = postObjectStore.openCursor(IDBKeyRange.only(key));

        cursorRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          const targetPost = cursor.value;

          if (cursor && targetPost) {
            targetPost.favorite = state;

            if (state) {
              targetPost.favoriteCount++;
            } else {
              targetPost.favoriteCount--;
            }

            cursor.update(targetPost);
          } else {
            reject();
          }
        };

        cursorRequest.onerror = (event) => {
          reject(event);
        };

        transation.oncomplete = (event) => {
          resolve(event);
        };

        transation.onerror = (event) => {
          reject(event);
        };
      }).catch((err) => {
        reject(err);
      });
    });
  }

  deletePost (key) {
    return new Promise((resolve, reject) => {
      this._openDatabase().then((db) => {
        const transaction = db.transaction('post', 'readwrite');
        const postObjectStore = transaction.objectStore('post');
        postObjectStore.delete(key);

        transaction.oncomplete = (event) => {
          resolve(event);
        };

        transaction.onerror = (event) => {
          reject(event);
        };
      }).catch((err) => {
        reject(err);
      });
    });
  }

  addJob (job) {
    return new Promise((resolve, reject) => {
      this._openDatabase().then((db) => {
        job.id = job.postId + '_' + job.action; // 작업 ID는 별도로 생성

        const transaction = db.transaction('job', 'readwrite');
        const jobObjectStore = transaction.objectStore('job');
        jobObjectStore.put(job);

        transaction.oncomplete = (event) => {
          resolve(event);
        };

        transaction.onerror = (event) => {
          reject(event);
        };
      }).catch((err) => {
        reject(err);
      });
    });
  }

  getJob (jobId) {
    return new Promise((resolve, reject) => {
      this._openDatabase().then((db) => {
        const getRequest = db.transaction('job', 'readonly')
          .objectStore('job')
          .get(jobId);

        getRequest.onsuccess = () => {
          resolve(getRequest.result);
        };

        getRequest.onerror = (event) => {
          reject(event);
        };
      }).catch((err) => {
        reject(err);
      });
    });
  }

  getJobs (user) {
    return new Promise((resolve, reject) => {
      this._openDatabase().then((db) => {
        const jobList = [];
        const cursor = db.transaction('job', 'readonly')
          .objectStore('job')
          .index('job_owner')
          .openCursor(IDBKeyRange.only(user));

        cursor.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            jobList.push(cursor.value);
            cursor.continue();
          } else {
            resolve(jobList);
          }
        };

        cursor.onerror = (event) => {
          reject(event);
        };
      }).catch((err) => {
        reject(err);
      });
    });
  }

  deleteJob (key) {
    return new Promise((resolve, reject) => {
      this._openDatabase().then((db) => {
        const transaction = db.transaction('job', 'readwrite');
        const jobObjectStore = transaction.objectStore('job');
        jobObjectStore.delete(key);

        transaction.oncomplete = (event) => {
          resolve(event);
        };

        transaction.onerror = (event) => {
          reject(event);
        };
      }).catch((err) => {
        reject(err);
      });
    });
  }
}
