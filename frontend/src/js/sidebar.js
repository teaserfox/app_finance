// Импортируйте наш пользовательский CSS
import '../scss/styles.scss'
import { SessionManager } from '../utils/session-manager.js'


// Импортируйте весь JS Bootstrap
import * as bootstrap from 'bootstrap'

export class Sidebar {
    constructor() {
        this.navLinks = document.querySelectorAll('.nav-link');
        if (!this.navLinks.length) {
            console.warn('⚠️ Sidebar: ссылки меню не найдены.');
            return;
        }

        this.init();
        this.initLogout(); // 🔹 Добавляем вызов метода инициализации выхода

        console.log('%c✅ Sidebar инициализирован', 'color: green; font-weight: bold;');
    }

    initLogout() {
        const logoutBtn = document.querySelector('.dropdown-item[href="#logout"]');
        if (!logoutBtn) {
            console.warn('⚠️ Кнопка выхода не найдена.');
            return;
        }

        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            SessionManager.handleLogout();
        });
    }

    /**
     * Инициализация обработчиков кликов
     */
    init() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', e => this.handleClick(e, link));
        });
    }

    /**
     * Главный обработчик клика по ссылке меню
     */
    handleClick(e, link) {
        e.preventDefault();

        const textDiv = link.querySelector('.menu, .text-white');
        const linkText = textDiv?.textContent.trim();
        const parentLi = link.closest('.nav-item');

        if (!linkText || !parentLi) return;

        if (linkText === 'Категории') {
            this.toggleCategories(link, textDiv, parentLi);
            return;
        }

        if (this.isInsideCategory(parentLi)) {
            this.handleSubCategory(link, textDiv, parentLi);
            return;
        }

        this.handleRegularLink(link, textDiv);
    }

    /**
     * Проверяет, находится ли ссылка внутри блока "Категории"
     */
    isInsideCategory(parentLi) {
        const prev1 = parentLi.previousElementSibling;
        const prev2 = prev1?.previousElementSibling;
        const getText = li => li?.querySelector('.menu, .text-white')?.textContent.trim();
        return getText(prev1) === 'Категории' || getText(prev2) === 'Категории';
    }

    /**
     * Раскрытие/сворачивание блока "Категории"
     */
    toggleCategories(link, textDiv, parentLi) {
        const svg = link.querySelector('svg path');
        const subLinks = [parentLi.nextElementSibling, parentLi.nextElementSibling?.nextElementSibling].filter(Boolean);
        const isActive = link.classList.contains('active');

        // Сбрасываем активные состояния у остальных верхних ссылок
        this.resetTopLinksExceptCategories();

        if (!isActive) {
            this.activateLink(link, textDiv, svg);
            link.querySelector('svg').style.transform = 'rotate(90deg)';
            subLinks.forEach(li => li.classList.remove('d-none'));
        } else {
            this.deactivateLink(link, textDiv, svg);
            link.querySelector('svg').style.transform = '';
            subLinks.forEach(li => li.classList.add('d-none'));
        }
    }

    /**
     * Сбрасывает активность у всех пунктов верхнего уровня, кроме "Категории"
     */
    resetTopLinksExceptCategories() {
        this.navLinks.forEach(otherLink => {
            const otherTextDiv = otherLink.querySelector('.menu, .text-white');
            const otherText = otherTextDiv?.textContent.trim();

            if (otherText !== 'Категории') {
                otherLink.classList.remove('active');
                if (otherTextDiv) {
                    otherTextDiv.classList.remove('text-white');
                    otherTextDiv.classList.add('menu');
                }
                const svgPaths = otherLink.querySelectorAll('svg path');
                svgPaths.forEach(path => path.setAttribute('fill', '#052C65'));
            }
        });
    }

    /**
     * Обработка кликов по "Доходы"/"Расходы" внутри категории
     */
    handleSubCategory(link, textDiv, parentLi) {
        const allItems = parentLi.parentElement.querySelectorAll('.nav-item');

        // Сбрасываем активность у других подкатегорий
        allItems.forEach(li => {
            const linkEl = li.querySelector('.nav-link');
            const txt = linkEl?.querySelector('.menu, .text-white')?.textContent.trim();
            if (txt === 'Доходы' || txt === 'Расходы') {
                linkEl.classList.remove('active');
                const innerText = linkEl.querySelector('.menu, .text-white');
                if (innerText) {
                    innerText.classList.remove('text-white');
                    innerText.classList.add('menu');
                }
            }
        });

        // Активируем выбранную подкатегорию
        this.activateLink(link, textDiv);

        // Оставляем категорию раскрытой
        const parentCategoryLink = Array.from(this.navLinks).find(l => {
            const txt = l.querySelector('.menu, .text-white')?.textContent.trim();
            return txt === 'Категории';
        });
        if (parentCategoryLink) {
            const catText = parentCategoryLink.querySelector('.menu, .text-white');
            this.activateLink(parentCategoryLink, catText, parentCategoryLink.querySelector('svg path'));
            parentCategoryLink.querySelector('svg').style.transform = 'rotate(90deg)';
        }
    }

    /**
     * Обработка обычных ссылок (Главная, верхние Доходы и т.п.)
     */
    handleRegularLink(link, textDiv) {
        this.navLinks.forEach(otherLink => {
            otherLink.classList.remove('active');
            const otherTextDiv = otherLink.querySelector('.menu, .text-white');
            if (otherTextDiv) {
                otherTextDiv.classList.remove('text-white');
                otherTextDiv.classList.add('menu');
            }
            const svgPaths = otherLink.querySelectorAll('svg path');
            svgPaths.forEach(path => path.setAttribute('fill', '#052C65'));

            const otherText = otherTextDiv?.textContent.trim();
            if (otherText === 'Категории') {
                const catSvg = otherLink.querySelector('svg path');
                if (catSvg) catSvg.setAttribute('fill', '#052C65');
                otherLink.querySelector('svg').style.transform = '';
                const parentLi = otherLink.closest('.nav-item');
                const subLinks = [parentLi.nextElementSibling, parentLi.nextElementSibling?.nextElementSibling].filter(Boolean);
                subLinks.forEach(li => li.classList.add('d-none'));
            }
        });

        this.activateLink(link, textDiv);
        const svgPaths = link.querySelectorAll('svg path');
        svgPaths.forEach(path => path.setAttribute('fill', '#fff'));
    }

    /**
     * Активирует ссылку меню
     */
    activateLink(link, textDiv, svg) {
        link.classList.add('active');
        if (textDiv) {
            textDiv.classList.remove('menu');
            textDiv.classList.add('text-white');
        }
        if (svg) svg.setAttribute('fill', '#fff');
    }

    /**
     * Деактивирует ссылку меню
     */
    deactivateLink(link, textDiv, svg) {
        link.classList.remove('active');
        if (textDiv) {
            textDiv.classList.remove('text-white');
            textDiv.classList.add('menu');
        }
        if (svg) svg.setAttribute('fill', '#052C65');
    }
}





// document.addEventListener('DOMContentLoaded', () => {
//     const navLinks = document.querySelectorAll('.nav-link');
//
//     navLinks.forEach(link => {
//         link.addEventListener('click', e => {
//             e.preventDefault();
//
//             const textDiv = link.querySelector('.menu, .text-white');
//             const linkText = textDiv?.textContent.trim();
//             const parentLi = link.closest('.nav-item');
//
//             // === ОБРАБОТКА КАТЕГОРИИ ===
//             if (linkText === 'Категории') {
//                 const svg = link.querySelector('svg path');
//                 const subLinks = [parentLi.nextElementSibling, parentLi.nextElementSibling?.nextElementSibling].filter(Boolean);
//                 const isActive = link.classList.contains('active');
//
//                 // Сбрасываем активные классы у других ссылок верхнего уровня
//                 navLinks.forEach(otherLink => {
//                     const otherTextDiv = otherLink.querySelector('.menu, .text-white');
//                     const otherText = otherTextDiv?.textContent.trim();
//
//                     if (otherText !== 'Категории') {
//                         otherLink.classList.remove('active');
//                         if (otherTextDiv) {
//                             otherTextDiv.classList.remove('text-white');
//                             otherTextDiv.classList.add('menu');
//                         }
//                         const svgPaths = otherLink.querySelectorAll('svg path');
//                         svgPaths.forEach(path => path.setAttribute('fill', '#052C65'));
//                     }
//                 });
//
//                 // Тогглим категорию
//                 if (!isActive) {
//                     link.classList.add('active');
//                     if (textDiv) {
//                         textDiv.classList.remove('menu');
//                         textDiv.classList.add('text-white');
//                     }
//                     if (svg) svg.setAttribute('fill', '#fff');
//                     link.querySelector('svg').style.transform = 'rotate(90deg)';
//                     subLinks.forEach(li => li.classList.remove('d-none'));
//                 } else {
//                     link.classList.remove('active');
//                     if (textDiv) {
//                         textDiv.classList.remove('text-white');
//                         textDiv.classList.add('menu');
//                     }
//                     if (svg) svg.setAttribute('fill', '#052C65');
//                     link.querySelector('svg').style.transform = '';
//                     subLinks.forEach(li => li.classList.add('d-none'));
//                 }
//
//                 return;
//             }
//
//             // === ОБРАБОТКА ВЫБОРА ДОХОДЫ / РАСХОДЫ ВНУТРИ КАТЕГОРИЙ ===
//             const parentCategoryLink = Array.from(navLinks).find(l => {
//                 const txt = l.querySelector('.menu, .text-white')?.textContent.trim();
//                 return txt === 'Категории';
//             });
//
//             const isInsideCategory =
//                 parentLi.previousElementSibling?.querySelector('.menu, .text-white')?.textContent.trim() === 'Категории' ||
//                 parentLi.previousElementSibling?.previousElementSibling?.querySelector('.menu, .text-white')?.textContent.trim() === 'Категории';
//
//             if (isInsideCategory) {
//                 // Снимаем активный класс с других подкатегорий (только доходы/расходы)
//                 const allItems = parentLi.parentElement.querySelectorAll('.nav-item');
//                 allItems.forEach(li => {
//                     const linkEl = li.querySelector('.nav-link');
//                     const txt = linkEl?.querySelector('.menu, .text-white')?.textContent.trim();
//                     if (txt === 'Доходы' || txt === 'Расходы') {
//                         linkEl.classList.remove('active');
//                         const innerText = linkEl.querySelector('.menu, .text-white');
//                         if (innerText) {
//                             innerText.classList.remove('text-white');
//                             innerText.classList.add('menu');
//                         }
//                     }
//                 });
//
//                 // Добавляем активный класс выбранной подкатегории
//                 link.classList.add('active');
//                 if (textDiv) {
//                     textDiv.classList.remove('menu');
//                     textDiv.classList.add('text-white');
//                 }
//
//                 // Категория остаётся активной и раскрытой
//                 if (parentCategoryLink) {
//                     parentCategoryLink.classList.add('active');
//                     const catText = parentCategoryLink.querySelector('.menu, .text-white');
//                     if (catText) {
//                         catText.classList.remove('menu');
//                         catText.classList.add('text-white');
//                     }
//                     const catSvg = parentCategoryLink.querySelector('svg path');
//                     if (catSvg) catSvg.setAttribute('fill', '#fff');
//                     parentCategoryLink.querySelector('svg').style.transform = 'rotate(90deg)';
//                 }
//
//                 return;
//             }
//
//             // === ОБЫЧНЫЕ ССЫЛКИ (Главная, верхние Доходы и т.п.) ===
//             navLinks.forEach(otherLink => {
//                 otherLink.classList.remove('active');
//                 const otherTextDiv = otherLink.querySelector('.menu, .text-white');
//                 if (otherTextDiv) {
//                     otherTextDiv.classList.remove('text-white');
//                     otherTextDiv.classList.add('menu');
//                 }
//                 const svgPaths = otherLink.querySelectorAll('svg path');
//                 svgPaths.forEach(path => path.setAttribute('fill', '#052C65'));
//
//                 // Если категория была активна — закрываем её
//                 const otherText = otherTextDiv?.textContent.trim();
//                 if (otherText === 'Категории') {
//                     otherLink.querySelector('svg').style.transform = '';
//                     const catSvg = otherLink.querySelector('svg path');
//                     if (catSvg) catSvg.setAttribute('fill', '#052C65');
//                     const parentLi = otherLink.closest('.nav-item');
//                     const subLinks = [parentLi.nextElementSibling, parentLi.nextElementSibling?.nextElementSibling].filter(Boolean);
//                     subLinks.forEach(li => li.classList.add('d-none'));
//                 }
//             });
//
//             // Активируем текущую ссылку
//             link.classList.add('active');
//             if (textDiv) {
//                 textDiv.classList.remove('menu');
//                 textDiv.classList.add('text-white');
//             }
//             const svgPaths = link.querySelectorAll('svg path');
//             svgPaths.forEach(path => path.setAttribute('fill', '#fff'));
//         });
//     });
// });




