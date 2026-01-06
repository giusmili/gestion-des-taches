import { initApp, updateTaskStatus, deleteTask } from './app.js';

window.addEventListener('DOMContentLoaded', () => {
    // Expose handlers for inline event attributes
    window.updateTaskStatus = updateTaskStatus;
    window.deleteTask = deleteTask;
    initApp();
});

const { createClient } = supabase;

const SUPABASE_URL = "https://polspoylctjnsfqgdwpe.supabase.co";
const SUPABASE_KEY = "sb_publishable_xvIvM3tmcaV2zxdxXB-xlg_Cl1R686Y";
const SUPABASE_SCHEMA = "public";

const db = createClient(SUPABASE_URL, SUPABASE_KEY);
const TABLE_NAME = "User"; // Respecte la casse exacte dans Supabase

async function loadUsers() {
  const out = document.querySelector("#out");
  if (!out) return;

  out.textContent = "Chargement des utilisateurs...";

  const { data, error } = await db
    .schema(SUPABASE_SCHEMA)
    .from(TABLE_NAME)
    .select("id, nom, age, mail, service, isAdmin")
    .order("id", { ascending: true });

  if (error) {
    out.textContent = `Erreur Supabase: ${error.message}`;
    return;
  }

  renderUsers(out, data || []);
}

loadUsers();

function renderUsers(container, rows) {
  if (!rows.length) {
    container.innerHTML = `
      <div class="user-empty">
        Aucun utilisateur trouve dans la table "${SUPABASE_SCHEMA}.${TABLE_NAME}".<br>
        - Verifiez que la table contient des lignes.<br>
        - Verifiez la policy RLS: le role anonyme doit avoir le droit SELECT sur "${TABLE_NAME}".
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="user-list-card">
      <div class="user-list-header">
        Utilisateurs connectés : ${rows.length}
      </div>
      <ul class="user-list">
        ${rows.map(user => `
          <li class="user-item">
            <div class="user-item-head">
              <span class="user-name">${user.nom ?? "Sans nom"} ${user.isAdmin ? "admin" : "is-user"}</span>
      
            </div>
            <div class="user-meta">
             <div><span class="meta-label">Age:</span> <span>${user.age ?? "N/A"} ans</span></div>
              <div><span class="meta-label">Service:</span> <span>${user.service ?? "N/A"}</span></div>
              <div><span class="meta-label">Admin:</span> <span>${user.isAdmin ? "Oui" : "Non"}</span></div>
              <div class="user-mail">
                ${user.mail ? `<a class="user-mail-link" href="mailto:${user.mail}">${user.mail}</a>` : ""}
              </div>
            </div>
          </li>
        `).join("")}
      </ul>
    </div>
  `;
}
