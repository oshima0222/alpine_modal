import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";

const app = new PIXI.Application();
const imgDir = "/assets/images/";

// GSAP プラグインの登録を行います。
// 下記のコードがないと PixiJS 上で GSAP を扱えません。
gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI);

window.onload = async () => {
  // PixiJS v8 からは、初期化関数が非同期になっています。
  // https://pixijs.com/8.x/guides/migrations/v8#async-initialisation
  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
    resizeTo: window,
    background: "#FFF",
  });
  const target = document.getElementById("hero");
  target.appendChild(app.canvas);

  // ロゴ
  const logoSvg = await PIXI.Assets.load({
    src: imgDir + "hero_logo_ochp.svg",
    data: {
      resolution: window.devicePixelRatio || 1,
    },
  });

  const logo = new PIXI.Sprite(logoSvg);
  logo.pivot.set(logo.width / 2, logo.height / 2);
  logo.position.set(app.screen.width / 2, app.screen.height / 2);
  logo.alpha = 0.5;
  logo.scale = 0;

  // アイテムを配置
  app.stage.addChild(logo);
  // app.stage.addChild(woman);

  // ロゴの動き
  const logoTl = gsap.timeline();
  setTimeout(() => {
    logoTl
      .to(logo, {
        pixi: { alpha: 1 },
        duration: 0.25,
      })
      .to(
        logo,
        {
          pixi: { scale: 1 },
          duration: 0.75,
          ease: "elastic.out(1.75,0.75)",
        },
        "-=0.25",
      )
      .to(
        logo,
        {
          pixi: { alpha: 0, scale: 1.2, positionY: logo.position._y - 5 },
          duration: 0.25,
          onComplete: function () {
            setTimeout(createGrid, 500);
            document.querySelector(".bl_globalHeader").classList.add("is-show");
          },
        },
        "+=2",
      );
  }, "1000");

  // 画像のサイズと間隔
  const imgWidth = 230;
  const imgHeight = 168;
  const spacingX = 64;
  const spacingY = 64;

  // グリッド設定
  const rows = 15;
  const cols = 21;

  // 画像のパス
  const imagePaths = {
    red: imgDir + "hero_illust_red.svg",
    green: imgDir + "hero_illust_green.svg",
    yellow: imgDir + "hero_illust_yellow.svg",
  };
  const colors = ["red", "green", "yellow"];

  // 画像を読み込む
  async function loadTextures() {
    const textures = {};
    for (const color of colors) {
      textures[color] = await PIXI.Assets.load({
        src: imagePaths[color],
        data: { resolution: window.devicePixelRatio || 1 },
      });
    }
    return textures;
  }

  const loopContainer = new PIXI.Container();
  app.stage.addChild(loopContainer);

  const sprites = []; // 各スプライトを格納する配列

  // 画像を配置する関数
  async function createGrid() {
    const textures = await loadTextures();

    for (let row = 0; row < rows; row++) {
      sprites[row] = [];
      for (let col = 0; col < cols; col++) {
        // 色の決定
        let colorIndex = (col + row) % colors.length;
        let color = colors[colorIndex];

        // スプライト作成
        const sprite = new PIXI.Sprite(textures[color]);
        sprite.width = imgWidth;
        sprite.height = imgHeight;
        sprite.anchor.set(0.5);

        // 位置を計算して配置
        sprite.x = col * (imgWidth + spacingX);
        sprite.y = row * (imgHeight + spacingY);
        loopContainer.addChild(sprite);

        // [A], [B], [C], [D] に分類
        let group;
        if (row % 2 === 0 && col % 2 === 0)
          group = "D"; // 偶数行・偶数列
        else if (row % 2 === 0)
          group = "C"; // 偶数行・奇数列
        else if (col % 2 === 0)
          group = "B"; // 奇数行・偶数列
        else group = "A"; // 奇数行・奇数列

        sprite.group = group; // グループ情報を付加

        // 初期表示設定
        sprite.startDelay = Math.floor(Math.random() * 6) + 1;
        sprite.scaleX = 0;
        sprite.scaleY = 0;
        sprite.alpha = 0;

        // 配列に保存
        sprites[row][col] = sprite;
      }
    }
    centerLoopContainer();

    // アニメーション開始
    animateStartGrid();
  }

  function animateStartGrid() {
    for (const i in sprites) {
      for (const t in sprites[i]) {
        gsap.to(sprites[i][t], {
          pixi: { scaleX: 1, scaleY: 1, alpha: 1 },
          duration: 0.5,
          delay: sprites[i][t].startDelay * 0.2,
          ease: "back.out(2)",
        });
      }
    }
    setTimeout(function () {
      animateLoopGrid();
    }, 2000);
  }

  // グリッド作成
  // createGrid();

  function centerLoopContainer() {
    loopContainer.position.set(app.screen.width / 2, app.screen.height / 2);
    loopContainer.pivot.set(loopContainer.width / 2, loopContainer.height / 2);
  }

  // 初回配置 & ウィンドウリサイズ時の対応
  window.addEventListener("resize", centerLoopContainer);

  // アニメーション関数
  let zoomCount = 1;
  const zoomRate = [0.7, 1, 1.2, 1, 0.8, 1.5];

  function zoomCheck() {
    if (zoomCount % 3 === 0) {
      gsap.to(loopContainer, {
        pixi: {
          scaleX: zoomRate[zoomCount / 3 - 1],
          scaleY: zoomRate[zoomCount / 3 - 1],
        },
        duration: 1,
        delay: 1,
        ease: "power1.inOut",
      });
    }
    zoomCount++;
    if (zoomCount > zoomRate.length * 3) {
      zoomCount = 1;
    }
  }

  function animateLoopGrid() {
    // 1. 奇数行 → 右に1マス / 偶数行 → 左に1マス
    for (const i in sprites) {
      for (const t in sprites[i]) {
        let direction = 1;
        if (sprites[i][t].group == "C" || sprites[i][t].group == "D") {
          direction = -1;
        }
        // 予備動作
        gsap.to(sprites[i][t], {
          pixi: { rotation: -10 * direction },
          duration: 0.5,
          delay: 0.5,
          ease: "expo.out",
        });
        gsap.to(sprites[i][t], {
          pixi: { rotation: 0 },
          duration: 0.5,
          delay: 1.1,
          ease: "power1.inOut",
        });
        // 移動
        gsap.to(sprites[i][t], {
          pixi: { x: sprites[i][t].x + direction * (imgWidth + spacingX) },
          duration: 1,
          delay: 1,
          ease: "power1.inOut",
          onComplete: () => {
            if (i == rows - 1 && t == cols - 1) {
              step2();
            }
          },
        });
      }
    }
    zoomCheck();

    function step2() {
      // 2. 奇数列 → 下に1マス / 偶数列 → 上に1マス
      for (const i in sprites) {
        for (const t in sprites[i]) {
          let direction = 1;
          if (sprites[i][t].group == "B" || sprites[i][t].group == "D") {
            direction = -1;
          }
          // 予備動作
          gsap.to(sprites[i][t], {
            pixi: { scaleY: 0.9 },
            duration: 0.5,
            delay: 0.5,
            ease: "expo.out",
          });
          gsap.to(sprites[i][t], {
            pixi: { scaleY: 1 },
            duration: 0.5,
            delay: 1.1,
            ease: "back.out(2)",
          });
          // 移動
          gsap.to(sprites[i][t], {
            pixi: { y: sprites[i][t].y + direction * (imgHeight + spacingY) },
            duration: 1,
            delay: 1,
            ease: "power1.inOut",
            onComplete: () => {
              if (i == rows - 1 && t == cols - 1) {
                step3();
              }
            },
          });
        }
      }
      zoomCheck();
    }

    function step3() {
      // 3. 奇数行 → 左に2マス / 偶数行 → 右に2マス
      for (const i in sprites) {
        for (const t in sprites[i]) {
          let direction = 2;
          if (sprites[i][t].group == "A" || sprites[i][t].group == "B") {
            direction = -2;
          }
          // 予備動作
          gsap.to(sprites[i][t], {
            pixi: { rotation: (-10 * direction) / 2 },
            duration: 0.5,
            delay: 0.5,
            ease: "expo.out",
          });
          gsap.to(sprites[i][t], {
            pixi: { rotation: 0 },
            duration: 0.5,
            delay: 1.1,
            ease: "power1.inOut",
          });
          // 移動
          gsap.to(sprites[i][t], {
            pixi: { x: sprites[i][t].x + direction * (imgWidth + spacingX) },
            duration: 1,
            delay: 1,
            ease: "power1.inOut",
            onComplete: () => {
              if (i == rows - 1 && t == cols - 1) {
                step4();
              }
            },
          });
        }
      }
      zoomCheck();
    }

    function step4() {
      // 4. 奇数列 → 上に1マス / 偶数列 → 下に1マス
      for (const i in sprites) {
        for (const t in sprites[i]) {
          let direction = 1;
          if (sprites[i][t].group == "A" || sprites[i][t].group == "C") {
            direction = -1;
          }
          // 予備動作
          gsap.to(sprites[i][t], {
            pixi: { scaleY: 0.9 },
            duration: 0.5,
            delay: 0.5,
            ease: "expo.out",
          });
          gsap.to(sprites[i][t], {
            pixi: { scaleY: 1 },
            duration: 0.5,
            delay: 1.1,
            ease: "back.out(2)",
          });
          // 移動
          gsap.to(sprites[i][t], {
            pixi: { y: sprites[i][t].y + direction * (imgHeight + spacingY) },
            duration: 1,
            delay: 1,
            ease: "power1.inOut",
            onComplete: () => {
              if (i == rows - 1 && t == cols - 1) {
                step5();
              }
            },
          });
        }
      }
      zoomCheck();
    }

    function step5() {
      // 5. 奇数行 → 右に2マス / 偶数行 → 左に2マス (元の位置に戻る)
      for (const i in sprites) {
        for (const t in sprites[i]) {
          let direction = 1;
          if (sprites[i][t].group == "C" || sprites[i][t].group == "D") {
            direction = -1;
          }
          // 予備動作
          gsap.to(sprites[i][t], {
            pixi: { rotation: (-10 * direction) / 2 },
            duration: 0.5,
            delay: 0.5,
            ease: "expo.out",
          });
          gsap.to(sprites[i][t], {
            pixi: { rotation: 0 },
            duration: 0.5,
            delay: 1.1,
            ease: "power1.inOut",
          });
          // 移動
          gsap.to(sprites[i][t], {
            pixi: { x: sprites[i][t].x + direction * (imgWidth + spacingX) },
            duration: 1,
            delay: 1,
            ease: "power1.inOut",
            onComplete: () => {
              if (i == rows - 1 && t == cols - 1) {
                animateLoopGrid();
              }
            },
          });
        }
      }
      zoomCheck();
    }
  }
};
