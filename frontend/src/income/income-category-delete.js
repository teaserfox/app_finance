// src/income/income-category-delete.js
import { CustomHttp } from "@/services/custom-http.js";
import config from "../../config/config.js";

export class IncomeCategoryDelete {
    constructor(modalElementId, confirmButtonId, onConfirmCallback) {
        this.modal = document.getElementById(modalElementId);
        this.confirmButton = document.getElementById(confirmButtonId);
        this.currentCategoryId = null;
        this.onConfirmCallback = onConfirmCallback;

        this.setupEvents();
    }

    setupEvents() {
        if (this.confirmButton) {
            this.confirmButton.addEventListener("click", async () => {
                if (!this.currentCategoryId) return;

                try {
                    console.log(`🗑 Удаление категории ID=${this.currentCategoryId}`);

                    // пока без API — имитация
                    // await CustomHttp.delete(`${config.host}/categories/income/${this.currentCategoryId}`);

                    if (typeof this.onConfirmCallback === "function") {
                        this.onConfirmCallback(this.currentCategoryId);
                    }

                    const modalInstance = bootstrap.Modal.getInstance(this.modal);
                    modalInstance.hide();

                } catch (err) {
                    console.error("Ошибка при удалении категории:", err);
                } finally {
                    this.currentCategoryId = null;
                }
            });
        }
    }

    open(categoryId) {
        this.currentCategoryId = categoryId;
        const modalInstance = new bootstrap.Modal(this.modal);
        modalInstance.show();
    }
}

