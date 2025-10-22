import { Auth } from "./auth.js";

export class UserList {
    static render(containerId = 'user-list') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const users = JSON.parse(localStorage.getItem('userList') || '[]');
        if (!users.length) {
            container.innerHTML = `<p class="text-muted">Пока нет сохранённых пользователей</p>`;
            return;
        }

        container.innerHTML = users.map(u => `
            <div class="user-card text-center" style="cursor:pointer;width:100px;">
                <img src="${u.avatar}" alt="${u.fullName}" class="rounded-circle mb-2" width="34" height="34">
                <div class="small fw-bold">${u.fullName}</div>
            </div>
        `).join('');

        // Добавим обработчики клика по пользователям
        container.querySelectorAll('.user-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                const user = users[index];
                Auth.setUserInfo(user);

                window.location.hash = '#/sidebar';
            });
        });
    }
}
