// modal.js
import Swiper from "swiper";

export default function modalComponent() {
  return {
    modalOpen: false,
    currentModalContent: null, // feature, spec, option 共通
    swiper: null, // Swiper インスタンス
    scrollPosition: 0,

    features: [], // 初期値は空。init() で JSON から読み込む
    specs: [], // 初期値は空。init() で JSON から読み込む

    allTypes: [],
    allLineup: [],
    allAttachments: [],
    selectedType: "ochp", // 初期選択タイプ (ID)
    selectedLineup: "OC-17HP", // 初期選択ラインナップ (ID)
    displayedLineup: [], // フィルタリングされたラインナップ
    displayedAttachments: [], // フィルタリングされたアタッチメント

    async init() {
      // async キーワードを追加
      try {
        // Promise.all で JSON ファイルを並行して読み込む
        const [typesRes, lineupRes, attachmentsRes, featuresRes, specsRes] =
          await Promise.all([
            fetch("/data/types.json"),
            fetch("/data/lineup.json"),
            fetch("/data/attachments.json"),
            fetch("/data/features.json"), // ★ 追加
            fetch("/data/specs.json"), // ★ 追加
          ]);
        if (
          !typesRes.ok ||
          !lineupRes.ok ||
          !attachmentsRes.ok ||
          !featuresRes.ok ||
          !specsRes.ok
        ) {
          throw new Error("Failed to fetch data");
        }
        this.allTypes = await typesRes.json();
        this.allLineup = await lineupRes.json();
        this.allAttachments = await attachmentsRes.json();
        this.features = await featuresRes.json(); // ★ 追加
        this.specs = await specsRes.json(); // ★ 追加
        // --- 初期表示のフィルタリング ---
        this.filterLineup();
        this.filterAttachments();
      } catch (error) {
        console.error("Error loading data:", error);
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

      // --- selectedType の変更を監視してラインナップとアタッチメントを更新 ---
      this.$watch("selectedType", () => {
        this.filterLineup();
        // タイプが変わったら、ラインナップの先頭をデフォルト選択
        if (this.displayedLineup.length > 0) {
          this.selectedLineup = this.displayedLineup[0].id;
        } else {
          this.selectedLineup = null; //該当がなければnull
        }
        this.filterAttachments();
      });

      // --- selectedLineup の変更を監視してアタッチメントを更新 ---
      this.$watch("selectedLineup", () => {
        this.filterAttachments();
      });
    },
    // --- フィルタリング関数 ---
    filterLineup() {
      this.displayedLineup = this.allLineup.filter(
        (item) => item.type === this.selectedType,
      );
    },
    filterAttachments() {
      if (!this.selectedLineup) {
        this.displayedAttachments = [];
        return;
      }
      this.displayedAttachments = this.allAttachments.filter((attachment) =>
        attachment.compatibleLineup.includes(this.selectedLineup),
      );
    },

    // --- 選択関数 ---
    selectType(typeId) {
      this.selectedType = typeId;
    },
    selectLineup(lineupId) {
      this.selectedLineup = lineupId;
    },

    // --- モーダル関連関数 ---
    openModal(sectionType, itemId) {
      if (sectionType === "option") {
        // --- Option Modal (Swiper) ---
        const currentOptionIndex = this.displayedAttachments.findIndex(
          (a) => a.id === itemId,
        );
        if (currentOptionIndex === -1) {
          console.warn(
            "Selected attachment not found in displayed list:",
            itemId,
          );
          return;
        }

        this.currentModalContent = { section: "option" }; // option用と識別
        this.modalOpen = true;

        this.$nextTick(() => {
          requestAnimationFrame(() => {
            if (!this.swiper) {
              this.swiper = new Swiper(this.$refs.swiperContainer, {
                direction: "horizontal",
                loop: false, // ループしない
                navigation: {
                  nextEl: ".swiper-button-next",
                  prevEl: ".swiper-button-prev",
                },
                initialSlide: currentOptionIndex, // ★ 初期スライドを指定
                observer: true, // DOM変更を監視
                observeParents: true, // 親要素の変更を監視
              });
            } else {
              // スライド内容を更新してインデックスを再設定
              this.swiper.update();
              this.swiper.slideTo(currentOptionIndex, 0, false);
            }
            const modalOverlay = document.querySelector(".modal-overlay");
            if (modalOverlay) modalOverlay.focus();
          });
        });
      } else {
        // --- Feature/Spec Modal ---
        let item;
        if (sectionType === "feature") {
          item = this.features.find((i) => i.id === itemId);
        } else if (sectionType === "spec") {
          item = this.specs.find((i) => i.id === itemId);
        }
        if (!item) {
          console.warn(`Item not found: ${sectionType}-${itemId}`);
          return;
        }
        this.setCurrentModalContent(
          sectionType,
          itemId,
          item.name,
          item.content,
        );
        this.modalOpen = true;
        this.$nextTick(() => {
          const modalOverlay = document.querySelector(".modal-overlay");
          if (modalOverlay) modalOverlay.focus();
        });
      }
    },

    closeModal() {
      this.modalOpen = false;
      // currentModalContent は残しても良いかもしれない (Swiper以外)
      // this.currentModalContent = null;
      // this.currentOptions = []; // displayedAttachments を使うので不要
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
