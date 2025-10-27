
import { SessionManager } from '@/utils/session-manager.js';
import { routerInstance } from '@/router.js'; // ✅ Импортируем существующий экземпляр


console.log('%c✅ sidebar.js успешно подключён!', 'color: green; font-weight: bold;');

export class Sidebar {
    constructor(router = routerInstance)  {
        this.router = router;
        this.navLinks = document.querySelectorAll('.nav-link');

        if (!this.navLinks.length) {
            console.warn('⚠️ Sidebar: ссылки меню не найдены.');
            return;
        }

        this.init();
        this.initLogout();
        SessionManager.initUserUI();
        this.highlightCurrentRoute();

        console.log('%c✅ Sidebar инициализирован', 'color: green; font-weight: bold;');
    }

    /** Инициализация выхода */
    initLogout() {
        const logoutBtn = document.querySelector('.dropdown-item[href="#logout"]');
        if (!logoutBtn) {
            console.warn('⚠️ Кнопка выхода не найдена.');
            return;
        }

        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await SessionManager.handleLogout();
            SessionManager.initUserUI();
            this.router.navigate('#/login', {replace: true});
        });
    }

    /** Инициализация событий меню */
    init() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', e => this.handleClick(e, link));
        });
    }

    /** Подсветка текущего маршрута при загрузке */
    highlightCurrentRoute() {
        const currentHash = window.location.hash;
        if (!currentHash) return;

        this.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentHash) {
                this.activateLink(link);
            } else {
                this.deactivateLink(link);
            }
        });
    }

    /** Главный обработчик клика */
    handleClick(e, link) {
        e.preventDefault();

        const route = link.getAttribute('href');
        const linkText = link.querySelector('.menu, .text-white')?.textContent.trim();

        // Переключение категорий
        if (linkText === 'Категории') {
            this.toggleCategories(link);
            return;
        }

        // Подкатегории (Доходы, Расходы)
        if (this.isInsideCategory(link)) {
            this.handleSubCategory(link);
        } else {
            this.handleRegularLink(link);
        }

        // ✅ Навигация через роутер для всех ссылок с href="#/"
        if (this.router && route && route.startsWith('#/')) {
            this.router.navigate(route);
        }
    }

    /** Проверяет, находится ли ссылка внутри блока "Категории" */
    isInsideCategory(link) {
        const parentLi = link.closest('.nav-item');
        const prev1 = parentLi?.previousElementSibling;
        const prev2 = prev1?.previousElementSibling;
        const getText = li => li?.querySelector('.menu, .text-white')?.textContent.trim();
        return getText(prev1) === 'Категории' || getText(prev2) === 'Категории';
    }

    /** Раскрытие/сворачивание блока "Категории" */
    toggleCategories(link) {
        const svg = link.querySelector('svg path');
        const parentLi = link.closest('.nav-item');
        const subLinks = [
            parentLi.nextElementSibling,
            parentLi.nextElementSibling?.nextElementSibling
        ].filter(Boolean);

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

    /** Сброс активности у остальных пунктов верхнего уровня */
    resetTopLinksExceptCategories() {
        this.navLinks.forEach(link => {
            const text = link.querySelector('.menu, .text-white')?.textContent.trim();
            if (text !== 'Категории') this.deactivateLink(link);
        });
    }

    /** Подкатегории (Доходы, Расходы) */
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

        // ✅ Навигация на универсальную страницу с параметром type
        const subText = link.querySelector('.menu, .text-white')?.textContent.trim();
        if (subText === 'Доходы') {
            this.router.navigate('#/dashboard/categories?type=income');
        } else if (subText === 'Расходы') {
            this.router.navigate('#/dashboard/categories?type=expense');
        }
    }

    /** Обычные ссылки (Главная, Аналитика и т.д.) */
    handleRegularLink(link) {
        this.navLinks.forEach(l => this.deactivateLink(l));
        this.activateLink(link);
    }

    /** Активирует ссылку */
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

    /** Деактивирует ссылку */
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








