import { SessionManager } from '@/utils/session-manager';
import { routerInstance } from '@/router';
import { BalanceUI } from '@/js/balance';
import { StoredUserType } from '@/types/stored-user.type';

console.log('%c✅ sidebar.ts успешно подключён!', 'color: green; font-weight: bold;');

export class Sidebar {
    readonly router: typeof routerInstance;
    private navLinks: NodeListOf<HTMLAnchorElement>;
    private balanceUI: BalanceUI = new BalanceUI();
    readonly userDiv: HTMLElement | null;

    constructor(router: typeof routerInstance = routerInstance) {
        this.router = router;
        this.navLinks = document.querySelectorAll('.nav-link');

        this.userDiv = document.getElementById('user');
        (window as any).balanceUI || new BalanceUI();
        (window as any).balanceUI = this.balanceUI; // чтобы использовать глобально

        if (!this.navLinks.length) {
            console.warn('⚠️ Sidebar: ссылки меню не найдены.');
            return;
        }

        this.init();
        this.initLogout();
        this.highlightCurrentRoute();
        this.updateUserUI(SessionManager.getCurrentUser());

        SessionManager.subscribe((user: StoredUserType | null) => {
            this.updateUserUI(user);
        });
        this.updateBalance();
    }

    private async updateBalance() {
        if (!this.balanceUI) return;
        try {
            await this.balanceUI.updateUserBalance();
        } catch (err) {
            console.error('Ошибка при обновлении баланса:', err);
        }

    }

    /** Обновление имени пользователя в сайдбаре */
    updateUserUI(user: StoredUserType | null): void {
        if (this.userDiv) {
            if (user?.fullName) {
                this.userDiv.textContent = user.fullName;
                console.log(`👤 Текущий пользователь: ${user.fullName}`);
            } else {
                this.userDiv.textContent = '';
                console.warn('⚠️ Нет данных пользователя — перенаправляем на login');
                this.router.navigate('#/login', { replace: true });
            }
        }
    }

    /** Инициализация выхода */
    initLogout(): void {
        const logoutBtn = document.querySelector<HTMLAnchorElement>('.dropdown-item[href="#logout"]');
        if (!logoutBtn) return;

        logoutBtn.addEventListener('click', async (e: Event) => {
            e.preventDefault();
            await SessionManager.handleLogout();
            this.router.navigate('#/login', { replace: true });
        });
    }

    /** Инициализация кликов по меню */
    init(): void {
        this.navLinks.forEach(link => {
            link.addEventListener('click', e => this.handleClick(e, link));
        });
    }

    /** Подсветка текущего маршрута */
    highlightCurrentRoute(): void {
        const currentHash = window.location.hash;
        if (!currentHash) return;

        this.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentHash) this.activateLink(link);
            else this.deactivateLink(link);
        });
    }

    handleClick(e: Event, link: HTMLAnchorElement): void {
        e.preventDefault();

        const route = link.getAttribute('href');
        const linkText = link.querySelector<HTMLElement>('.menu, .text-white')?.textContent?.trim();

        if (linkText === 'Категории') {
            this.toggleCategories(link);
            return;
        }

        if (this.isInsideCategory(link)) {
            this.handleSubCategory(link);
        } else {
            this.handleRegularLink(link);
        }

        if (this.router && route && route.startsWith('#/')) {
            this.router.navigate(route);
        }
    }

    isInsideCategory(link: HTMLAnchorElement): boolean {
        const parentLi = link.closest<HTMLLIElement>('.nav-item');
        const prev1 = parentLi?.previousElementSibling as HTMLLIElement | null;
        const prev2 = prev1?.previousElementSibling as HTMLLIElement | null;
        const getText = (li: HTMLLIElement | null) => li?.querySelector<HTMLElement>('.menu, .text-white')?.textContent?.trim();
        return getText(prev1) === 'Категории' || getText(prev2) === 'Категории';
    }

    toggleCategories(link: HTMLAnchorElement): void {
        const svg = link.querySelector<SVGPathElement>('svg path');
        const parentLi = link.closest<HTMLLIElement>('.nav-item');
        if (!parentLi) return;

        let subLinks: HTMLLIElement[] = [
            parentLi.nextElementSibling as HTMLLIElement | null,
            parentLi.nextElementSibling?.nextElementSibling as HTMLLIElement | null
        ].filter((el): el is HTMLLIElement => !!el);

        if (!subLinks.length) {
            const incomeLi = document.createElement('li');
            incomeLi.className = 'nav-item d-none';
            incomeLi.innerHTML = `<a class="nav-link" href="#"><div class="menu">Доходы</div></a>`;

            const expenseLi = document.createElement('li');
            expenseLi.className = 'nav-item d-none';
            expenseLi.innerHTML = `<a class="nav-link" href="#"><div class="menu">Расходы</div></a>`;

            parentLi.parentNode?.insertBefore(incomeLi, parentLi.nextSibling);
            parentLi.parentNode?.insertBefore(expenseLi, incomeLi.nextSibling);

            subLinks = [incomeLi, expenseLi];

            subLinks.forEach(li => {
                const a = li.querySelector<HTMLAnchorElement>('a');
                if (a) {
                    a.addEventListener('click', e => {
                        e.preventDefault();
                        this.handleSubCategory(a);
                    });
                }
            });
        }

        const isActive = link.classList.contains('active');
        this.resetTopLinksExceptCategories();

        const svgPath = link.querySelector<SVGPathElement>('svg path') ?? undefined;
        const svgEl = link.querySelector<SVGElement>('svg');

        if (!isActive) {
            this.activateLink(link, svgPath);
            if (svgEl) svgEl.style.transform = 'rotate(90deg)';
            subLinks.forEach(li => li.classList.remove('d-none'));
        } else {
            this.deactivateLink(link, svgPath);
            if (svgEl) svgEl.style.transform = '';
            subLinks.forEach(li => li.classList.add('d-none'));
        }
    }

    resetTopLinksExceptCategories(): void {
        this.navLinks.forEach(link => {
            const text = link.querySelector<HTMLElement>('.menu, .text-white')?.textContent?.trim();
            if (text !== 'Категории') this.deactivateLink(link);
        });
    }

    handleSubCategory(link: HTMLAnchorElement): void {
        const parentUl = link.closest<HTMLUListElement>('ul');
        const allItems = parentUl?.querySelectorAll<HTMLAnchorElement>('.nav-link') || [];
        allItems.forEach(l => {
            const txt = l.querySelector<HTMLElement>('.menu, .text-white')?.textContent?.trim();
            if (txt === 'Доходы' || txt === 'Расходы') this.deactivateLink(l);
        });

        this.activateLink(link);

        const categoryLink = Array.from(this.navLinks).find(l => {
            const txt = l.querySelector<HTMLElement>('.menu, .text-white')?.textContent?.trim();
            return txt === 'Категории';
        });

        if (categoryLink) {
            const svgPath = categoryLink.querySelector<SVGPathElement>('svg path') ?? undefined;
            this.activateLink(categoryLink, svgPath);

            const svgElement = categoryLink.querySelector<SVGElement>('svg');
            if (svgElement) {
                svgElement.style.transform = 'rotate(90deg)';
            }
        }

        const subText = link.querySelector<HTMLElement>('.menu, .text-white')?.textContent?.trim();
        if (subText === 'Доходы') this.router.navigate('#/dashboard/categories?type=income');
        else if (subText === 'Расходы') this.router.navigate('#/dashboard/categories?type=expense');
    }

    handleRegularLink(link: HTMLAnchorElement): void {
        this.navLinks.forEach(l => this.deactivateLink(l));
        this.activateLink(link);
    }

    activateLink(link: HTMLAnchorElement, svg?: SVGPathElement): void {
        const textDiv = link.querySelector<HTMLElement>('.menu, .text-white');
        link.classList.add('active');
        if (textDiv) {
            textDiv.classList.remove('menu');
            textDiv.classList.add('text-white');
        }
        if (svg) svg.setAttribute('fill', '#fff');
        link.querySelectorAll<SVGPathElement>('svg path').forEach(path => path.setAttribute('fill', '#fff'));
    }

    deactivateLink(link: HTMLAnchorElement, svg?: SVGPathElement): void {
        const textDiv = link.querySelector<HTMLElement>('.menu, .text-white');
        link.classList.remove('active');
        if (textDiv) {
            textDiv.classList.remove('text-white');
            textDiv.classList.add('menu');
        }
        if (svg) svg.setAttribute('fill', '#052C65');
        link.querySelectorAll<SVGPathElement>('svg path').forEach(path => path.setAttribute('fill', '#052C65'));
    }
}












