// src/js/hero.js
import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";

// GSAP プラグイン登録 (PixiPluginはGSAPでPixiオブジェクトを操作するために必要)
gsap.registerPlugin(PixiPlugin);
PixiPlugin.registerPIXI(PIXI); // PIXIインスタンスをGSAPに教える

const imgDir = "/assets/images/";

// --- 初期化関数を async function としてエクスポート ---
export default async function initHero(targetElementId) {
  const target = document.getElementById(targetElementId);
  if (!target) {
    console.warn(`Hero target element #${targetElementId} not found. Skipping hero animation.`);
    return;
  }

  const app = new PIXI.Application();

  // PixiJS v8 の非同期初期化
  try {
    await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        antialias: true,
        resizeTo: window, // ウィンドウにリサイズを追従させる
        backgroundAlpha: 0, // CSS側で背景を設定する場合は透過に
        // background: "#FFF", // 背景色指定する場合
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
    });
    target.appendChild(app.canvas); // CanvasをDOMに追加
  } catch(err) {
      console.error("PixiJS initialization failed:", err);
      return; // 初期化失敗時は以降の処理を中断
  }


  try {
      // --- ロゴの読み込みとアニメーション ---
      const logoSvg = await PIXI.Assets.load({
        src: imgDir + "hero_logo_ochp.svg",
        data: { resolution: window.devicePixelRatio || 1 },
      });
      const logo = new PIXI.Sprite(logoSvg);
      logo.pivot.set(logo.width / 2, logo.height / 2);
      logo.position.set(app.screen.width / 2, app.screen.height / 2);
      logo.alpha = 0; // 初期状態は透明
      logo.scale.set(0); // 初期状態はスケール0
      app.stage.addChild(logo);

      const logoTl = gsap.timeline({ delay: 1 }); // 1秒待ってから開始
      logoTl
        .to(logo, { pixi: { alpha: 1 }, duration: 0.25 })
        .to(logo, { pixi: { scale: 1 }, duration: 0.75, ease: "elastic.out(1.75,0.75)" }, "-=0.25")
        .to(logo, {
            pixi: { alpha: 0, scale: 1.2, y: logo.y - 5 }, // positionY ではなく y を使う
            duration: 0.25,
            onComplete: function () {
                // 0.5秒後にグリッド作成を開始
                setTimeout(createGrid, 500);
                // グローバルヘッダー表示 (必要なら)
                const header = document.querySelector(".ly_globalHeader");
                if(header) header.classList.add("is-show");
            },
        }, "+=2"); // 2秒待つ

      // --- グリッドアニメーション関連 ---
      const imgWidth = 230;
      const imgHeight = 168;
      const spacingX = 64;
      const spacingY = 64;
      const rows = 15;
      const cols = 21;
      const imagePaths = {
        red: imgDir + "hero_illust_red.svg",
        green: imgDir + "hero_illust_green.svg",
        yellow: imgDir + "hero_illust_yellow.svg",
      };
      const colors = ["red", "green", "yellow"];

      const loopContainer = new PIXI.Container();
      app.stage.addChild(loopContainer);
      const sprites = [];

      async function loadTextures() {
        const textures = {};
        for (const color of colors) {
            // アセットのロードエラーハンドリングを追加（オプション）
            try {
                 textures[color] = await PIXI.Assets.load({
                    src: imagePaths[color],
                    data: { resolution: window.devicePixelRatio || 1 },
                 });
            } catch (err) {
                console.error(`Failed to load texture: ${imagePaths[color]}`, err);
                // エラー時用の代替テクスチャなどを用意しても良い
            }

        }
        return textures;
      }

      async function createGrid() {
        const textures = await loadTextures();
        if (Object.keys(textures).length === 0) {
            console.error("No textures loaded for grid.");
            return;
        }

        for (let row = 0; row < rows; row++) {
          sprites[row] = [];
          for (let col = 0; col < cols; col++) {
            let colorIndex = (col + row) % colors.length;
            let color = colors[colorIndex];

            // テクスチャが存在するか確認してからスプライト作成
            if (!textures[color]) continue;

            const sprite = new PIXI.Sprite(textures[color]);
            sprite.width = imgWidth;
            sprite.height = imgHeight;
            sprite.anchor.set(0.5);
            sprite.x = col * (imgWidth + spacingX);
            sprite.y = row * (imgHeight + spacingY);
            loopContainer.addChild(sprite);

            let group = (row % 2 === 0) ? ((col % 2 === 0) ? "D" : "C") : ((col % 2 === 0) ? "B" : "A");
            sprite.group = group;

            sprite.startDelay = Math.floor(Math.random() * 6) + 1;
            sprite.scale.set(0);
            sprite.alpha = 0;
            sprites[row][col] = sprite;
          }
        }
        centerLoopContainer();
        animateStartGrid();
      }

      function animateStartGrid() {
          sprites.flat().forEach(sprite => { // flat()で一次元配列に
              if (!sprite) return;
              gsap.to(sprite, {
                  pixi: { scale: 1, alpha: 1 }, // scaleX/Yをまとめてscaleに
                  duration: 0.5,
                  delay: sprite.startDelay * 0.2,
                  ease: "back.out(2)",
              });
          });
        // ループアニメーション開始を遅延
        gsap.delayedCall(2, animateLoopGrid); // GSAPの遅延呼び出しを使う方が管理しやすい
      }

      function centerLoopContainer() {
        if (loopContainer.width > 0 && loopContainer.height > 0) { // サイズが計算されてから実行
            loopContainer.position.set(app.screen.width / 2, app.screen.height / 2);
            loopContainer.pivot.set(loopContainer.width / 2, loopContainer.height / 2);
        }
      }

      // リサイズハンドラ（debounce推奨）
      let resizeTimeout;
      const debouncedResize = () => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
              // app.resize(); // resizeTo: window があれば不要な場合が多い
              centerLoopContainer();
          }, 100);
      };
      window.addEventListener("resize", debouncedResize);

      // --- ループアニメーション ---
      let zoomCount = 1;
      const zoomRate = [0.7, 1, 1.2, 1, 0.8, 1.5];

      function zoomCheck() {
          if (zoomCount % 3 === 0) {
            const scaleIndex = zoomCount / 3 - 1;
            if (scaleIndex < zoomRate.length) {
                gsap.to(loopContainer, {
                  pixi: { scale: zoomRate[scaleIndex] }, // scaleX/Yをまとめてscaleに
                  duration: 1,
                  delay: 1,
                  ease: "power1.inOut",
                });
            }
          }
          zoomCount++;
          if (zoomCount > zoomRate.length * 3) {
            zoomCount = 1;
          }
      }

        function animateLoopGrid() {
          const allSprites = sprites.flat().filter(s => s); // 存在するものだけ一次元配列に
          if (allSprites.length === 0) return; // スプライトがなければ終了

          const tl = gsap.timeline({
              onComplete: animateLoopGrid, // アニメーション完了時に自身を再帰呼び出し
              delay: 1, // 各ステップ間の遅延
          });

          // Step 1: Horizontal move
          tl.addLabel("step1")
            .to(allSprites, {
                pixi: { rotation: (i, target) => -10 * ((target.group === 'C' || target.group === 'D') ? -1 : 1) },
                duration: 0.5, stagger: 0, ease: "expo.out",
            }, "step1+=0.5")
            .to(allSprites, {
                pixi: { rotation: 0 },
                duration: 0.5, stagger: 0, ease: "power1.inOut",
            }, "step1+=1.1")
            .to(allSprites, {
                pixi: { x: (i, target) => target.x + ((target.group === 'C' || target.group === 'D') ? -1 : 1) * (imgWidth + spacingX) },
                duration: 1, stagger: 0, ease: "power1.inOut",
            }, "step1+=1")
            .call(zoomCheck, [], "step1+=1"); // zoomCheckをタイムラインに追加

          // Step 2: Vertical move
          tl.addLabel("step2", "+=0.5") // 前のステップ終了から0.5秒後
            .to(allSprites, { pixi: { scaleY: 0.9 }, duration: 0.5, stagger: 0, ease: "expo.out" }, "step2")
            .to(allSprites, { pixi: { scaleY: 1 }, duration: 0.5, stagger: 0, ease: "back.out(2)" }, "step2+=0.6")
            .to(allSprites, {
                pixi: { y: (i, target) => target.y + ((target.group === 'B' || target.group === 'D') ? -1 : 1) * (imgHeight + spacingY) },
                duration: 1, stagger: 0, ease: "power1.inOut",
            }, "step2+=0.5")
            .call(zoomCheck, [], "step2+=0.5");

          // Step 3: Horizontal move 2
           tl.addLabel("step3", "+=0.5")
             .to(allSprites, {
                 pixi: { rotation: (i, target) => (-10 * ((target.group === 'A' || target.group === 'B') ? -2 : 2)) / 2 },
                 duration: 0.5, stagger: 0, ease: "expo.out",
             }, "step3")
             .to(allSprites, { pixi: { rotation: 0 }, duration: 0.5, stagger: 0, ease: "power1.inOut" }, "step3+=0.6")
             .to(allSprites, {
                 pixi: { x: (i, target) => target.x + ((target.group === 'A' || target.group === 'B') ? -2 : 2) * (imgWidth + spacingX) },
                 duration: 1, stagger: 0, ease: "power1.inOut",
             }, "step3+=0.5")
             .call(zoomCheck, [], "step3+=0.5");

          // Step 4: Vertical move 2
          tl.addLabel("step4", "+=0.5")
            .to(allSprites, { pixi: { scaleY: 0.9 }, duration: 0.5, stagger: 0, ease: "expo.out" }, "step4")
            .to(allSprites, { pixi: { scaleY: 1 }, duration: 0.5, stagger: 0, ease: "back.out(2)" }, "step4+=0.6")
            .to(allSprites, {
                pixi: { y: (i, target) => target.y + ((target.group === 'A' || target.group === 'C') ? -1 : 1) * (imgHeight + spacingY) },
                duration: 1, stagger: 0, ease: "power1.inOut",
            }, "step4+=0.5")
            .call(zoomCheck, [], "step4+=0.5");

          // Step 5: Horizontal move back
          tl.addLabel("step5", "+=0.5")
            .to(allSprites, {
                pixi: { rotation: (i, target) => (-10 * ((target.group === 'C' || target.group === 'D') ? -1 : 1)) / 2 }, // /2は不要かも？
                duration: 0.5, stagger: 0, ease: "expo.out",
            }, "step5")
            .to(allSprites, { pixi: { rotation: 0 }, duration: 0.5, stagger: 0, ease: "power1.inOut" }, "step5+=0.6")
            .to(allSprites, {
                pixi: { x: (i, target) => target.x + ((target.group === 'C' || target.group === 'D') ? -1 : 1) * (imgWidth + spacingX) },
                duration: 1, stagger: 0, ease: "power1.inOut",
            }, "step5+=0.5")
             .call(zoomCheck, [], "step5+=0.5");

      } // animateLoopGrid end

    console.log('Hero animation setup complete for:', targetElementId);

  } catch(err) {
      console.error("Error during hero animation setup:", err);
  }
}