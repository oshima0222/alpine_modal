// modal.js
import Swiper from "swiper";

export default function modalComponent() {
  return {
    modalOpen: false,
    currentModalContent: null, // feature, spec 用
    currentOptions: [], // option 用 (Swiper)
    swiper: null, // Swiper インスタンス
    scrollPosition: 0,

    features: [
      { id: "feature1", name: "特徴1", description: "特徴1の詳細説明..." },
      { id: "feature2", name: "特徴2", description: "特徴2の詳細説明..." },
      { id: "feature3", name: "特徴3", description: "特徴3の詳細説明..." },
      { id: "feature4", name: "特徴4", description: "特徴4の詳細説明..." },
    ],
    specs: [
      { id: "spec1", name: "仕様1", description: "仕様1の詳細説明..." },
      { id: "spec2", name: "仕様2", description: "仕様2の詳細説明..." },
    ],
    products: [
      {
        id: "productA",
        name: "製品A",
        options: [
          {
            id: "option1",
            name: "オプション1",
            description: "製品A オプション1の詳細説明...",
          },
          {
            id: "option2",
            name: "オプション2",
            description: "製品A オプション2の詳細説明...",
          },
          {
            id: "option3",
            name: "オプション3",
            description: "製品A オプション3の詳細説明...",
          },
          {
            id: "option4",
            name: "オプション4",
            description: "製品A オプション4の詳細説明...",
          },
        ],
      },
      {
        id: "productB",
        name: "製品B",
        options: [
          {
            id: "option1",
            name: "オプション1",
            description: "製品B オプション1の詳細説明...",
          },
          {
            id: "option2",
            name: "オプション2",
            description: "製品B オプション2の詳細説明...",
          },
        ],
      },
      {
        id: "productC",
        name: "製品C",
        options: [
          {
            id: "option1",
            name: "オプション1",
            description: "製品C オプション1の詳細説明...",
          },
        ],
      },
    ],

    init() {
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
    },

    openModal(section, itemId) {
      this.modalOpen = true;
      if (section === "option") {
        this.initOptionModal(itemId);
      } else {
        // feature, spec
        this.setFeatureSpecModalContent(section, itemId);
      }
      this.$nextTick(() => {
        const modalOverlay = document.querySelector(`.modal-overlay`);
        if (modalOverlay) {
          modalOverlay.focus();
        }
      });
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

    gotoModal(section, itemId) {
      if (!itemId || section === "option") return; // optionの場合は処理しない
      this.setFeatureSpecModalContent(section, itemId);
    },

    // Feature/Spec モーダル用のコンテンツ設定
    setFeatureSpecModalContent(section, itemId) {
      let item;
      if (section === "feature") {
        item = this.features.find((i) => i.id === itemId);
      } else if (section === "spec") {
        item = this.specs.find((i) => i.id === itemId);
      }

      if (!item) {
        console.warn(`Item not found: ${section}-${itemId}`);
        return;
      }
      const title = item.name;
      const description = item.description;

      const { next, prev, hasNext, hasPrev } = this.getNextPrev(
        section,
        itemId,
      );
      this.currentModalContent = {
        section: section,
        title: title,
        description: description,
        nextId: next,
        prevId: prev,
        hasNext: hasNext,
        hasPrev: hasPrev,
      };
    },
    //オプションモーダル用初期設定
    initOptionModal(itemId) {
      const [productId, optionId] = itemId.split("-");
      const product = this.products.find((p) => p.id === productId);
      if (!product) {
        console.error("Product not found:", productId);
        return;
      }
      this.currentOptions = product.options;
      const currentOptionIndex = this.currentOptions.findIndex(
        (o) => `${product.id}-${o.id}` === itemId,
      );
      this.currentModalContent = { section: "option" };
      this.$nextTick(() => {
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
        this.swiper.update();
        this.swiper.slideTo(currentOptionIndex, 0, false);
      });
    },
    getNextPrev(section, itemId) {
      // feature, spec 用のロジック
      let items = [];
      if (section === "feature") {
        items = this.features;
      } else if (section === "spec") {
        items = this.specs;
      } else {
        return { next: null, prev: null, hasNext: false, hasPrev: false }; // optionの場合は呼ばれない
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
