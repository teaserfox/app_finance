// src/js/router
/**
 * SPA Router — загружает HTML-шаблоны в #app-content и инициализирует page-specific JS.
 *
 * Принципы:
 * - все шаблоны ожидаются в папке ./templates/ (можно изменить templatesBasePath)
 * - маршруты описаны в routes (массив объектов) с полями:
 *   - path: '#/login'
 *   - template: 'login.html' (относительно templatesBasePath)
 *   - protected: true|false
 *   - initModule: './js/pages/login.init.js' (опционально) — ES module, будет импортирован через import()
 *
 * - Router.navigate(hash, { replace: false }) — централизованная навигация
 * - Router избегает многократной динамической загрузки одного и того же initModule
 */
import { Auth } from "@/services/auth";
import { Form } from "@/js/form";
import { Sidebar } from "@/js/sidebar";
import { CategoriesPage } from "@/pages/categories";
import { OperationsPage } from "@/pages/operations";
import { IndexPage } from "@/pages";
import { RouteType } from "@/types/router.type";

export class Router {
    readonly templatesBasePath = "./templates/";
    readonly defaultRoute = "#/login";

    private appContainer: HTMLElement;
    private sidebarLoaded = false;
    private routes: RouteType[];

    constructor() {
        this.routes = [
            {
                path: "#/signup",
                template: "signup.html",
                protected: false,
                name: "signup",
                load: (router, container) => {
                    new Form("signup", router, container);
                }
            },
            {
                path: "#/login",
                template: "login.html",
                protected: false,
                name: "login",
                load: (router, container) => {
                    new Form("login", router, container);
                }
            },
            {
                path: "#/sidebar",
                template: "sidebar.html",
                protected: true,
                name: "sidebar",
                load: router => {
                    new Sidebar(router);
                }
            },
            {
                path: "#/dashboard/categories",
                template: "dashboard/categories.html",
                protected: true,
                name: "categories",
                load: () => new CategoriesPage(navigate)
            },
            {
                path: "#/dashboard/category-form",
                template: "dashboard/income-category-form.html",
                protected: true,
                name: "category-form",
                load: router => {
                    const params = new URLSearchParams(window.location.hash.split("?")[1]);
                    const type = params.get("type") ?? "income";
                    new CategoriesPage(navigate, type);
                }
            },
            {
                path: "#/dashboard/category-edit",
                template: "dashboard/income-category-edit.html",
                protected: true,
                name: "category-edit",
                load: router => {
                    const params = new URLSearchParams(window.location.hash.split("?")[1]);
                    const type = params.get("type") ?? "income";
                    const id = params.get("id") ?? undefined;
                    new CategoriesPage(navigate, type, id);
                }
            },
            {
                path: "#/dashboard/operations",
                template: "dashboard/operations.html",
                protected: true,
                name: "operations",
                load: router => new OperationsPage(navigate)
            },
            {
                path: "#/dashboard/operation-form",
                template: "dashboard/operation-form.html",
                protected: true,
                name: "operation-form",
                load: router => new OperationsPage(navigate)
            },
            {
                path: "#/dashboard/operation-edit",
                template: "dashboard/operation-edit.html",
                protected: true,
                name: "operation-edit",
                load: router => new OperationsPage(navigate)
            },
            {
                path: "#/dashboard/index",
                template: "dashboard/index.html",
                protected: true,
                name: "index",
                load: router => new IndexPage(navigate)
            }
        ];

        this.appContainer = document.body; // временно — заменится в init()
    }

    // ---------------- INIT ----------------

    init(): void {
        const container = document.getElementById("app-content");
        this.appContainer = container ?? document.body;

        window.addEventListener("hashchange", () => this.handleRouteChange());
        window.addEventListener("DOMContentLoaded", () => this.handleRouteChange());

        console.log("%cRouter инициализирован", "color:green;font-weight:bold");
    }

    // ---------------- HELPERS ----------------

    private getCurrentRouteHash(): string | undefined {
        if (window.location.hash || this.defaultRoute) {
            return (window.location.hash || this.defaultRoute).split("?")[0];
        }
    }

    private findRouteByHash(hash: string): RouteType | undefined {
        return this.routes.find(r => r.path === hash);
    }

    private isAuthenticated(): boolean {
        return Boolean(localStorage.getItem(Auth.accessTokenKey));
    }

    // ---------------- NAVIGATION ----------------

    navigate(hash: string, options: { replace?: boolean } = {}): void {
        if (!hash) return;

        if (!hash.startsWith("#/")) {
            hash = "#/" + hash.replace(/^#\/?/, "");
        } else {
            hash = hash.replace(/^#+/, "#");
        }

        if (options.replace) {
            history.replaceState(null, "", hash);
            this.handleRouteChange();
            return;
        }

        if (window.location.hash !== hash) {
            window.location.hash = hash;
        } else {
            this.handleRouteChange();
        }
    }

    // ---------------- MAIN ROUTER ----------------

    private async handleRouteChange(): Promise<void> {
        const currentHash = this.getCurrentRouteHash();
        if (currentHash) {
            const route = this.findRouteByHash(currentHash);
            if (!route) {
                console.warn(`Маршрут ${currentHash} не найден`);
                return this.loadNotFound();
            }
            // Access control
            if (route.protected && !this.isAuthenticated()) {
                return this.navigate("#/login");
            }
            // Redirect logged users from login/signup
            if (!route.protected && this.isAuthenticated() &&
                (route.path === "#/login" || route.path === "#/signup")) {
                return this.navigate("#/sidebar");
            }
            await this.handleSidebar(currentHash);

            return this.loadTemplateAndInit(route);
        }
    }

    private async handleSidebar(currentHash: string): Promise<void> {
        const sidebarContainer = document.getElementById("sidebar-container");
        const mainWrapper = document.getElementById("index");

        if (!sidebarContainer || !mainWrapper) return;

        if (currentHash.startsWith("#/dashboard")) {
            if (!this.sidebarLoaded) {
                const html = await fetch(this.templatesBasePath + "sidebar.html").then(r => r.text());
                sidebarContainer.innerHTML = html;
                new Sidebar(this);
                this.sidebarLoaded = true;
            }

            sidebarContainer.style.display = "block";
            mainWrapper.classList.remove("justify-content-center");
        } else {
            sidebarContainer.style.display = "none";
            mainWrapper.classList.add("justify-content-center");
        }
    }

    // ---------------- PAGE LOADER ----------------

    private async loadTemplateAndInit(route: RouteType): Promise<void> {
        const path = this.templatesBasePath + route.template;

        try {
            const res = await fetch(path);
            if (!res.ok) return this.loadNotFound();

            const html = await res.text();
            this.appContainer.innerHTML = html;

            await route.load(this, this.appContainer);
        } catch (e) {
            console.warn("Ошибка загрузки шаблона:", path, e);
            return this.loadNotFound();
        }
    }

    private async loadNotFound(): Promise<void> {
        const res = await fetch(this.templatesBasePath + "404.html").catch(() => null);

        if (!res || !res.ok) {
            this.appContainer.innerHTML = `<div class="p-5 text-center">Страница не найдена</div>`;
            return;
        }

        this.appContainer.innerHTML = await res.text();
    }
}

export const routerInstance = new Router();
export const navigate = (path: string) => routerInstance.navigate(path);
