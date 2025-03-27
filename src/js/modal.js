// modal.js
import Swiper from "swiper";

export default function modalComponent() {
  return {
    modalOpen: false,
    currentModalContent: null, // feature, spec, option 共通
    currentOptions: [], // option 用 (Swiper)
    swiper: null, // Swiper インスタンス
    scrollPosition: 0,

    features: [], // 初期値は空。init() で JSON から読み込む
    specs: [], // 初期値は空。init() で JSON から読み込む
    products: [], // 初期値を空にする

    async init() {
      // async キーワードを追加
      try {
        // Promise.all で JSON ファイルを並行して読み込む
        const [featuresRes, specsRes, productsRes] = await Promise.all([
          fetch("/data/features.json"),
          fetch("/data/specs.json"),
          fetch("/data/products.json"), // products.json の読み込みを追加
        ]);
        if (!featuresRes.ok || !specsRes.ok || !productsRes.ok) {
          throw new Error("Failed to fetch data");
        }
        this.features = await featuresRes.json();
        this.specs = await specsRes.json();
        this.products = await productsRes.json(); // 読み込んだデータを格納
      } catch (error) {
        console.error("Error loading modal data:", error);
      }

      this.$watch("modalOpen", (value) => {
        if (value) {
          this.scrollPosition =
            window.pageYOffset || document.documentElement.scrollTop;
          document.body.classList.add("is_modalOpen");
          document.body.style.top = `-${this.scrollPosition}px`;
        } else {
          document.body.classList.remove("is_modalOpen");
          document.body.style.top = "";
          window.scrollTo(0, this.scrollPosition);
          if (this.swiper) {
            this.swiper.destroy();
            this.swiper = null;
          }
        }
      });

      // currentOptions の監視 (変更なし)
      this.$watch("currentOptions", () => {
        if (this.swiper) {
          this.$nextTick(() => {
            this.swiper.update();
          });
        }
      });
    },

    openModal(sectionType, itemId) {
      if (sectionType === "option") {
        // option の場合 (Swiper)
        const [productId, optionId] = itemId.split("-");
        const product = this.products.find((p) => p.id === productId);
        if (!product) {
          console.error("Product not found:", productId);
          return;
        }
        this.currentOptions = product.options; // JSONから読み込んだ options を使う
        const currentOptionIndex = this.currentOptions.findIndex(
          (o) =>
            `<span class="math-inline">\{product\.id\}\-</span>{o.id}` ===
            itemId,
        ); // ここを修正: option.id ではなく itemId で比較

        this.currentModalContent = { section: "option" };
        this.modalOpen = true;

        this.$nextTick(() => {
          requestAnimationFrame(() => {
            if (!this.swiper) {
              this.swiper = new Swiper(this.$refs.swiperContainer, {
                direction: "horizontal",
                loop: false,
                navigation: {
                  nextEl: ".swiper-button-next",
                  prevEl: ".swiper-button-prev",
                },
              });
            }
            this.swiper.update(); // スライド内容が更新されたことを Swiper に伝える
            this.swiper.slideTo(currentOptionIndex, 0, false);

            const modalOverlay = document.querySelector(`.modal-overlay`);
            if (modalOverlay) {
              modalOverlay.focus();
            }
          });
        });
      } else {
        // feature, spec の場合
        let item;
        if (sectionType === "feature") {
          item = this.features.find((i) => i.id === itemId);
        } else if (sectionType === "spec") {
          item = this.specs.find((i) => i.id === itemId);
        }
        if (!item) {
          console.warn(
            `Item not found: <span class="math-inline">\{sectionType\}\-</span>{itemId}`,
          );
          return;
        }
        this.setCurrentModalContent(
          sectionType,
          itemId,
          item.name,
          item.content,
        ); // content を渡す
        this.modalOpen = true;
      }
    },

    closeModal() {
      this.modalOpen = false;
      this.currentModalContent = null;
      this.currentOptions = [];
      if (this.swiper) {
        this.swiper.destroy();
        this.swiper = null;
      }
    },

    gotoModal(sectionType, itemId) {
      if (!itemId || sectionType === "option") return;

      let item;
      if (sectionType === "feature") {
        item = this.features.find((i) => i.id === itemId);
      } else if (sectionType === "spec") {
        item = this.specs.find((i) => i.id === itemId);
      }

      if (!item) {
        console.warn(
          `Item not found: <span class="math-inline">\{sectionType\}\-</span>{itemId}`,
        );
        return;
      }
      this.setCurrentModalContent(sectionType, itemId, item.name, item.content); // content を渡す
    },

    setCurrentModalContent(sectionType, itemId, title, content) {
      // description を content に変更
      // feature, spec 用のデータ設定
      const { next, prev, hasNext, hasPrev } = this.getNextPrev(
        sectionType,
        itemId,
      );
      this.currentModalContent = {
        section: sectionType,
        title: title,
        content: content, // description を content に変更
        nextId: next,
        prevId: prev,
        hasNext: hasNext,
        hasPrev: hasPrev,
      };
    },

    getNextPrev(sectionType, itemId) {
      // feature, spec 用
      let items = [];
      if (sectionType === "feature") {
        items = this.features;
      } else if (sectionType === "spec") {
        items = this.specs;
      } else {
        return { next: null, prev: null, hasNext: false, hasPrev: false };
      }

      const currentIndex = items.findIndex((item) => item.id === itemId);
      const nextIndex = currentIndex + 1;
      const prevIndex = currentIndex - 1;

      const hasNext = nextIndex < items.length;
      const hasPrev = prevIndex >= 0;

      const nextId = hasNext ? items[nextIndex].id : null;
      const prevId = hasPrev ? items[prevIndex].id : null;

      return { next: nextId, prev: prevId, hasNext, hasPrev };
    },
  };
}
