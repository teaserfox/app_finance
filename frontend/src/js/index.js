// Импортируйте наш пользовательский CSS
import '../scss/styles.scss'

// Импортируйте весь JS Bootstrap
import * as bootstrap from 'bootstrap'

document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();

            const textDiv = link.querySelector('.menu, .text-white');
            const linkText = textDiv?.textContent.trim();
            const parentLi = link.closest('.nav-item');

            // === ОБРАБОТКА КАТЕГОРИИ ===
            if (linkText === 'Категории') {
                const svg = link.querySelector('svg path');
                const subLinks = [parentLi.nextElementSibling, parentLi.nextElementSibling?.nextElementSibling].filter(Boolean);
                const isActive = link.classList.contains('active');

                // Сбрасываем активные классы у других ссылок верхнего уровня
                navLinks.forEach(otherLink => {
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

                // Тогглим категорию
                if (!isActive) {
                    link.classList.add('active');
                    if (textDiv) {
                        textDiv.classList.remove('menu');
                        textDiv.classList.add('text-white');
                    }
                    if (svg) svg.setAttribute('fill', '#fff');
                    link.querySelector('svg').style.transform = 'rotate(90deg)';
                    subLinks.forEach(li => li.classList.remove('d-none'));
                } else {
                    link.classList.remove('active');
                    if (textDiv) {
                        textDiv.classList.remove('text-white');
                        textDiv.classList.add('menu');
                    }
                    if (svg) svg.setAttribute('fill', '#052C65');
                    link.querySelector('svg').style.transform = '';
                    subLinks.forEach(li => li.classList.add('d-none'));
                }

                return;
            }

            // === ОБРАБОТКА ВЫБОРА ДОХОДЫ / РАСХОДЫ ВНУТРИ КАТЕГОРИЙ ===
            const parentCategoryLink = Array.from(navLinks).find(l => {
                const txt = l.querySelector('.menu, .text-white')?.textContent.trim();
                return txt === 'Категории';
            });

            const isInsideCategory =
                parentLi.previousElementSibling?.querySelector('.menu, .text-white')?.textContent.trim() === 'Категории' ||
                parentLi.previousElementSibling?.previousElementSibling?.querySelector('.menu, .text-white')?.textContent.trim() === 'Категории';

            if (isInsideCategory) {
                // Снимаем активный класс с других подкатегорий (только доходы/расходы)
                const allItems = parentLi.parentElement.querySelectorAll('.nav-item');
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

                // Добавляем активный класс выбранной подкатегории
                link.classList.add('active');
                if (textDiv) {
                    textDiv.classList.remove('menu');
                    textDiv.classList.add('text-white');
                }

                // Категория остаётся активной и раскрытой
                if (parentCategoryLink) {
                    parentCategoryLink.classList.add('active');
                    const catText = parentCategoryLink.querySelector('.menu, .text-white');
                    if (catText) {
                        catText.classList.remove('menu');
                        catText.classList.add('text-white');
                    }
                    const catSvg = parentCategoryLink.querySelector('svg path');
                    if (catSvg) catSvg.setAttribute('fill', '#fff');
                    parentCategoryLink.querySelector('svg').style.transform = 'rotate(90deg)';
                }

                return;
            }

            // === ОБЫЧНЫЕ ССЫЛКИ (Главная, верхние Доходы и т.п.) ===
            navLinks.forEach(otherLink => {
                otherLink.classList.remove('active');
                const otherTextDiv = otherLink.querySelector('.menu, .text-white');
                if (otherTextDiv) {
                    otherTextDiv.classList.remove('text-white');
                    otherTextDiv.classList.add('menu');
                }
                const svgPaths = otherLink.querySelectorAll('svg path');
                svgPaths.forEach(path => path.setAttribute('fill', '#052C65'));

                // Если категория была активна — закрываем её
                const otherText = otherTextDiv?.textContent.trim();
                if (otherText === 'Категории') {
                    otherLink.querySelector('svg').style.transform = '';
                    const catSvg = otherLink.querySelector('svg path');
                    if (catSvg) catSvg.setAttribute('fill', '#052C65');
                    const parentLi = otherLink.closest('.nav-item');
                    const subLinks = [parentLi.nextElementSibling, parentLi.nextElementSibling?.nextElementSibling].filter(Boolean);
                    subLinks.forEach(li => li.classList.add('d-none'));
                }
            });

            // Активируем текущую ссылку
            link.classList.add('active');
            if (textDiv) {
                textDiv.classList.remove('menu');
                textDiv.classList.add('text-white');
            }
            const svgPaths = link.querySelectorAll('svg path');
            svgPaths.forEach(path => path.setAttribute('fill', '#fff'));
        });
    });
});











