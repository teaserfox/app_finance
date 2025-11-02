import { SessionManager } from '@/utils/session-manager.js';
import { routerInstance } from '@/router.js';
import { BalanceUI } from '@/js/balance.js'; // класс для работы с балансом

console.log('%c✅ sidebar.js успешно подключён!', 'color: green; font-weight: bold;');

export class Sidebar {
    constructor(router = routerInstance) {
        this.router = router;
        this.navLinks = document.querySelectorAll('.nav-link');

        if (!this.navLinks.length) {
            console.warn('⚠️ Sidebar: ссылки меню не найдены.');
            return;
        }

        this.init();
        this.initLogout();
        this.highlightCurrentRoute();

        // Инициализация баланса
        this.balanceUI = new BalanceUI();

        // Инициализация UI текущего пользователя
        this.userDiv = document.getElementById('user');
        this.updateUserUI(SessionManager.getCurrentUser());

        // Подписка на смену пользователя
        SessionManager.subscribe((user) => {
            this.updateUserUI(user);
        });
    }

    /** Обновление имени пользователя в сайдбаре */
    updateUserUI(user) {
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
    initLogout() {
        const logoutBtn = document.querySelector('.dropdown-item[href="#logout"]');
        if (!logoutBtn) return;

        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await SessionManager.handleLogout();
            this.router.navigate('#/login', { replace: true });
        });
    }

    /** Инициализация кликов по меню */
    init() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', e => this.handleClick(e, link));
        });
    }

    /** Подсветка текущего маршрута */
    highlightCurrentRoute() {
        const currentHash = window.location.hash;
        if (!currentHash) return;

        this.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentHash) this.activateLink(link);
            else this.deactivateLink(link);
        });
    }

    /** Главный обработчик клика */
    handleClick(e, link) {
        e.preventDefault();

        const route = link.getAttribute('href');
        const linkText = link.querySelector('.menu, .text-white')?.textContent.trim();

        // Категории
        if (linkText === 'Категории') {
            this.toggleCategories(link);
            return;
        }

        // Подкатегории
        if (this.isInsideCategory(link)) {
            this.handleSubCategory(link);
        } else {
            this.handleRegularLink(link);
        }

        // Навигация через роутер
        if (this.router && route && route.startsWith('#/')) {
            this.router.navigate(route);
        }
    }

    isInsideCategory(link) {
        const parentLi = link.closest('.nav-item');
        const prev1 = parentLi?.previousElementSibling;
        const prev2 = prev1?.previousElementSibling;
        const getText = li => li?.querySelector('.menu, .text-white')?.textContent.trim();
        return getText(prev1) === 'Категории' || getText(prev2) === 'Категории';
    }

    toggleCategories(link) {
        const svg = link.querySelector('svg path');
        const parentLi = link.closest('.nav-item');

        let subLinks = [
            parentLi.nextElementSibling,
            parentLi.nextElementSibling?.nextElementSibling
        ].filter(Boolean);

        if (subLinks.length === 0) {
            const incomeLi = document.createElement('li');
            incomeLi.className = 'nav-item d-none';
            incomeLi.innerHTML = `<a class="nav-link" href="#"><div class="menu">Доходы</div></a>`;

            const expenseLi = document.createElement('li');
            expenseLi.className = 'nav-item d-none';
            expenseLi.innerHTML = `<a class="nav-link" href="#"><div class="menu">Расходы</div></a>`;

            parentLi.parentNode.insertBefore(incomeLi, parentLi.nextSibling);
            parentLi.parentNode.insertBefore(expenseLi, incomeLi.nextSibling);

            subLinks = [incomeLi, expenseLi];
            subLinks.forEach(li => {
                li.querySelector('a').addEventListener('click', e => {
                    e.preventDefault();
                    this.handleSubCategory(li.querySelector('a'));
                });
            });
        }

        const isActive = link.classList.contains('active');
        this.resetTopLinksExceptCategories();

        if (!isActive) {
            this.activateLink(link, svg);
            link.querySelector('svg').style.transform = 'rotate(90deg)';
            subLinks.forEach(li => li.classList.remove('d-none'));
        } else {
            this.deactivateLink(link, svg);
            link.querySelector('svg').style.transform = '';
            subLinks.forEach(li => li.classList.add('d-none'));
        }
    }

    resetTopLinksExceptCategories() {
        this.navLinks.forEach(link => {
            const text = link.querySelector('.menu, .text-white')?.textContent.trim();
            if (text !== 'Категории') this.deactivateLink(link);
        });
    }

    handleSubCategory(link) {
        const parentUl = link.closest('ul');
        const allItems = parentUl?.querySelectorAll('.nav-link') || [];
        allItems.forEach(l => {
            const txt = l.querySelector('.menu, .text-white')?.textContent.trim();
            if (txt === 'Доходы' || txt === 'Расходы') this.deactivateLink(l);
        });

        this.activateLink(link);

        const categoryLink = Array.from(this.navLinks).find(l => {
            const txt = l.querySelector('.menu, .text-white')?.textContent.trim();
            return txt === 'Категории';
        });
        if (categoryLink) {
            this.activateLink(categoryLink, categoryLink.querySelector('svg path'));
            categoryLink.querySelector('svg').style.transform = 'rotate(90deg)';
        }

        const subText = link.querySelector('.menu, .text-white')?.textContent.trim();
        if (subText === 'Доходы') this.router.navigate('#/dashboard/categories?type=income');
        else if (subText === 'Расходы') this.router.navigate('#/dashboard/categories?type=expense');
    }

    handleRegularLink(link) {
        this.navLinks.forEach(l => this.deactivateLink(l));
        this.activateLink(link);
    }

    activateLink(link, svg) {
        const textDiv = link.querySelector('.menu, .text-white');
        link.classList.add('active');
        if (textDiv) {
            textDiv.classList.remove('menu');
            textDiv.classList.add('text-white');
        }
        if (svg) svg.setAttribute('fill', '#fff');
        link.querySelectorAll('svg path').forEach(path => path.setAttribute('fill', '#fff'));
    }

    deactivateLink(link, svg) {
        const textDiv = link.querySelector('.menu, .text-white');
        link.classList.remove('active');
        if (textDiv) {
            textDiv.classList.remove('text-white');
            textDiv.classList.add('menu');
        }
        if (svg) svg.setAttribute('fill', '#052C65');
        link.querySelectorAll('svg path').forEach(path => path.setAttribute('fill', '#052C65'));
    }
}











