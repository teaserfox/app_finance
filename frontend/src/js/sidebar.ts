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

        SessionManager.subscribe((user: StoredUserType | null): void => {
            this.updateUserUI(user);
        });

        void this.updateBalance();
    }

    private async updateBalance(): Promise<void> {
        if (!this.balanceUI) return;
        try {
            await this.balanceUI.updateUserBalance();
        } catch (err) {
            console.error('Ошибка при обновлении баланса:', err);
        }

    }

    /** Обновление имени пользователя в сайдбаре */
    private updateUserUI(user: StoredUserType | null): void {
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
    private initLogout(): void {
        const logoutBtn: HTMLAnchorElement | null = document.querySelector<HTMLAnchorElement>('.dropdown-item[href="#logout"]');
        if (!logoutBtn) return;

        logoutBtn.addEventListener('click', async (e: Event): Promise<void> => {
            e.preventDefault();
            await SessionManager.handleLogout();
            this.router.navigate('#/login', { replace: true });
        });
    }

    /** Инициализация кликов по меню */
    private init(): void {
        this.navLinks.forEach((link: HTMLAnchorElement): void => {
            link.addEventListener('click', (e: PointerEvent): void => this.handleClick(e, link));
        });
    }

    /** Подсветка текущего маршрута */
    private highlightCurrentRoute(): void {
        const currentHash: string = window.location.hash;
        if (!currentHash) return;

        this.navLinks.forEach((link: HTMLAnchorElement): void => {
            const href: string | null = link.getAttribute('href');
            if (href === currentHash) this.activateLink(link);
            else this.deactivateLink(link);
        });
    }

    private handleClick(e: Event, link: HTMLAnchorElement): void {
        e.preventDefault();

        const route: string | null = link.getAttribute('href');
        const linkText: string | undefined = link.querySelector<HTMLElement>('.menu, .text-white')?.textContent?.trim();

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

    private isInsideCategory(link: HTMLAnchorElement): boolean {
        const parentLi: HTMLElement | null = link.closest<HTMLLIElement>('.nav-item');
        const prev1 = parentLi?.previousElementSibling as HTMLLIElement | null;
        const prev2 = prev1?.previousElementSibling as HTMLLIElement | null;
        const getText = (li: HTMLLIElement | null): string | undefined => li?.querySelector<HTMLElement>('.menu, .text-white')?.textContent?.trim();
        return getText(prev1) === 'Категории' || getText(prev2) === 'Категории';
    }

    private toggleCategories(link: HTMLAnchorElement): void {
        const svg: SVGPathElement | null = link.querySelector<SVGPathElement>('svg path');
        const parentLi: HTMLElement | null = link.closest<HTMLLIElement>('.nav-item');
        if (!parentLi) return;

        let subLinks: HTMLLIElement[] = [
            parentLi.nextElementSibling as HTMLLIElement | null,
            parentLi.nextElementSibling?.nextElementSibling as HTMLLIElement | null
        ].filter((el: HTMLLIElement | null): el is HTMLLIElement => !!el);

        if (!subLinks.length) {
            const incomeLi: HTMLLIElement = document.createElement('li');
            incomeLi.className = 'nav-item d-none';
            incomeLi.innerHTML = `<a class="nav-link" href="#"><div class="menu">Доходы</div></a>`;

            const expenseLi: HTMLLIElement = document.createElement('li');
            expenseLi.className = 'nav-item d-none';
            expenseLi.innerHTML = `<a class="nav-link" href="#"><div class="menu">Расходы</div></a>`;

            parentLi.parentNode?.insertBefore(incomeLi, parentLi.nextSibling);
            parentLi.parentNode?.insertBefore(expenseLi, incomeLi.nextSibling);

            subLinks = [incomeLi, expenseLi];

            subLinks.forEach((li: HTMLLIElement): void => {
                const a: HTMLAnchorElement | null = li.querySelector<HTMLAnchorElement>('a');
                if (a) {
                    a.addEventListener('click', (e: PointerEvent): void => {
                        e.preventDefault();
                        this.handleSubCategory(a);
                    });
                }
            });
        }

        const isActive: boolean = link.classList.contains('active');
        this.resetTopLinksExceptCategories();

        const svgPath: SVGPathElement | undefined = link.querySelector<SVGPathElement>('svg path') ?? undefined;
        const svgEl: SVGElement | null = link.querySelector<SVGElement>('svg');

        if (!isActive) {
            this.activateLink(link, svgPath);
            if (svgEl) svgEl.style.transform = 'rotate(90deg)';
            subLinks.forEach((li: HTMLLIElement): void => li.classList.remove('d-none'));
        } else {
            this.deactivateLink(link, svgPath);
            if (svgEl) svgEl.style.transform = '';
            subLinks.forEach((li: HTMLLIElement):void => li.classList.add('d-none'));
        }
    }

    private resetTopLinksExceptCategories(): void {
        this.navLinks.forEach((link: HTMLAnchorElement): void => {
            const text: string | undefined = link.querySelector<HTMLElement>('.menu, .text-white')?.textContent?.trim();
            if (text !== 'Категории') this.deactivateLink(link);
        });
    }

    private handleSubCategory(link: HTMLAnchorElement): void {
        const parentUl: HTMLUListElement | null = link.closest<HTMLUListElement>('ul');
        const allItems = parentUl?.querySelectorAll<HTMLAnchorElement>('.nav-link') || [];
        allItems.forEach((l: HTMLAnchorElement): void => {
            const txt: string | undefined = l.querySelector<HTMLElement>('.menu, .text-white')?.textContent?.trim();
            if (txt === 'Доходы' || txt === 'Расходы') this.deactivateLink(l);
        });

        this.activateLink(link);

        const categoryLink: HTMLAnchorElement | undefined = Array.from(this.navLinks).find((l: HTMLAnchorElement): boolean => {
            const txt: string | undefined = l.querySelector<HTMLElement>('.menu, .text-white')?.textContent?.trim();
            return txt === 'Категории';
        });

        if (categoryLink) {
            const svgPath: SVGPathElement | undefined = categoryLink.querySelector<SVGPathElement>('svg path') ?? undefined;
            this.activateLink(categoryLink, svgPath);

            const svgElement: SVGElement | null = categoryLink.querySelector<SVGElement>('svg');
            if (svgElement) {
                svgElement.style.transform = 'rotate(90deg)';
            }
        }

        const subText: string | undefined = link.querySelector<HTMLElement>('.menu, .text-white')?.textContent?.trim();
        if (subText === 'Доходы') this.router.navigate('#/dashboard/categories?type=income');
        else if (subText === 'Расходы') this.router.navigate('#/dashboard/categories?type=expense');
    }

    private handleRegularLink(link: HTMLAnchorElement): void {
        this.navLinks.forEach((l: HTMLAnchorElement): void => this.deactivateLink(l));
        this.activateLink(link);
    }

    private activateLink(link: HTMLAnchorElement, svg?: SVGPathElement): void {
        const textDiv: HTMLElement | null = link.querySelector<HTMLElement>('.menu, .text-white');
        link.classList.add('active');
        if (textDiv) {
            textDiv.classList.remove('menu');
            textDiv.classList.add('text-white');
        }
        if (svg) svg.setAttribute('fill', '#fff');
        link.querySelectorAll<SVGPathElement>('svg path').forEach((path: SVGPathElement): void => path.setAttribute('fill', '#fff'));
    }

    private deactivateLink(link: HTMLAnchorElement, svg?: SVGPathElement): void {
        const textDiv: HTMLElement | null = link.querySelector<HTMLElement>('.menu, .text-white');
        link.classList.remove('active');
        if (textDiv) {
            textDiv.classList.remove('text-white');
            textDiv.classList.add('menu');
        }
        if (svg) svg.setAttribute('fill', '#052C65');
        link.querySelectorAll<SVGPathElement>('svg path').forEach(path => path.setAttribute('fill', '#052C65'));
    }
}












