// fetch API を使った非同期処理 (共通化)
function loadContent(url, targetId) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            document.getElementById(targetId).innerHTML = data;
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
            const errorElement = document.createElement('p');
            errorElement.textContent = `Error loading ${url}`;
            document.getElementById(targetId).appendChild(errorElement);
        });
}

// TextAnimator クラス (修正)
class TextAnimator {
    constructor(element, text, interval = 50) {
        this.element = element;
        this.text = text;
        this.interval = interval;
        this.index = 0;
        this.intervalId = null;
        this.isRunning = false;
        this.isComplete = false;
        TextAnimator.activeAnimators.push(this);
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.intervalId = setInterval(() => {
                this.displayNextCharacter();
            }, this.interval);
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            clearInterval(this.intervalId);
        }
    }

    resume() {
        this.start();
    }

    displayNextCharacter() {
        if (this.index < this.text.length) {
            this.element.textContent += this.text[this.index];
            this.index++;
        } else {
            if (!this.isComplete) {
                this.isComplete = true;
                this.pause();
                TextAnimator.checkAllComplete(); // 完了時にチェック
            }
        }
    }

    changeSpeed(newInterval) {
        this.interval = newInterval;
        if (this.isRunning) {
            this.pause();
            this.start();
        }
    }

    static onAllComplete(callback) {
        TextAnimator.allCompleteCallback = callback;
    }
}

TextAnimator.activeAnimators = [];
TextAnimator.allCompleteCallback = null;

TextAnimator.checkAllComplete = () => {
    if (TextAnimator.activeAnimators.every(animator => animator.isComplete)) {
        // すべてのアニメーションが完了したら、非同期でコールバックを実行
        if (TextAnimator.allCompleteCallback) {
            Promise.resolve().then(TextAnimator.allCompleteCallback); // 非同期化
        }
        TextAnimator.activeAnimators = []; // アニメーターリストをクリア
    }
};

// 揺れアニメーション開始関数 (修正)
function startShakeAnimation() {
    const imageElement = document.getElementById("myImage");
    if (!imageElement) {
      console.error("ID 'myImage' を持つ要素が見つかりません。");
      return;
    }
  
    function shakeAndPulse() {
      imageElement.classList.add("shake-and-pulse");
      setTimeout(() => {
        imageElement.classList.remove("shake-and-pulse");
      }, 1500); // 1500ミリ秒後 (1.5秒後) にクラスを削除
    }
  
    // 最初の実行
    shakeAndPulse();
  
    // 15秒ごとに実行
    setInterval(shakeAndPulse, 15000); // 15000ミリ秒 (15秒) ごとに実行
  }


document.addEventListener("DOMContentLoaded", function() {

    // index.html かどうかを判定
    const isIndexPage = window.location.pathname.endsWith("index.html") || window.location.pathname === "/";

    Promise.all([
        loadContent('header.html', 'header-container'),
        loadContent('footer.html', 'footer-container')
    ])
    .then(() => {

      // ナビゲーションのアクティブ化 (共通)
        const navLinks = document.querySelectorAll('.nav-pills .nav-link');
        const currentPath = window.location.pathname;
        navLinks.forEach(link => {
            let href = link.getAttribute('href');
            if (currentPath.endsWith(href) || (currentPath === "/" && href === "index.html")) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            }
        });

        // MutationObserver の設定 (共通)
        const headerContainer = document.getElementById('header-container');
        if (!headerContainer) {
            console.error("ID 'header-container' を持つ要素が見つかりません。");
            return;
        }

        const observer = new MutationObserver((mutations) => {
            if (document.getElementById("myImage")) {
                if (!isIndexPage) { // index.html でない場合のみ、ここで揺れアニメーション開始
                    startShakeAnimation();
                }
                observer.disconnect();
            }
        });
        observer.observe(headerContainer, { childList: true, subtree: true });


        if (isIndexPage) {
            // index.html の場合の処理 (テキストアニメーション)

            const lines = [
                "こんにちは、粟村倫久(あわむらのりひさ)、a.k.a awaです。",
                "Hello, I am Norihisa Awamura, a.k.a awa. ",
                "你好，我叫粟村倫久，a.k.a awa。"
            ];

            const line1Element = document.getElementById("line1");
            const line2Element = document.getElementById("line2");
            const line3Element = document.getElementById("line3");

            if (!line1Element || !line2Element || !line3Element) {
                console.error("必要な要素が見つかりません。");
                return;
            }

            const animator1 = new TextAnimator(line1Element, lines[0], 35);
            const animator2 = new TextAnimator(line2Element, lines[1], 30);
            const animator3 = new TextAnimator(line3Element, lines[2], 70);

            animator1.start();
            animator2.start();
            animator3.start();

            // テキストアニメーション完了後に揺れアニメーションを開始
            TextAnimator.onAllComplete(startShakeAnimation);
        }
    })
    .catch(error => {
        console.error("ヘッダーまたはフッターの読み込み中にエラーが発生しました:", error);
    });
});