// ============================================================
// CONFIGURACIÓN DE SUPABASE
// Reemplaza estos valores con los de tu proyecto en Supabase
// ============================================================
const SUPABASE_URL = "https://gqihouarviwfbarfnfsj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaWhvdWFydml3ZmJhcmZuZnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MTk3MjUsImV4cCI6MjEwMzA5NTcyNX0.XdWkDngTUczBS2U17rdUkw8EW5T71fzCAN_XSS8aPf8";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// REFERENCIAS AL DOM
// ============================================================
const form = document.getElementById("contact-form");
const idInput = document.getElementById("contact-id");
const nombreInput = document.getElementById("nombre");
const empresaInput = document.getElementById("empresa");
const numeroInput = document.getElementById("numero");
const montoInput = document.getElementById("monto");
const fechaInput = document.getElementById("fecha");
const formTitle = document.getElementById("form-title");
const btnSubmit = document.getElementById("btn-submit");
const btnCancel = document.getElementById("btn-cancel");
const searchInput = document.getElementById("search");
const listContainer = document.getElementById("contacts-list");

let allContacts = [];

// ============================================================
// CARGAR CONTACTOS
// ============================================================
async function loadContacts() {
  listContainer.innerHTML = '<p class="loading">Cargando...</p>';
  const { data, error } = await supabaseClient
    .from("contactos_prepago")
    .select("*")
    .order("nombre_usuario", { ascending: true });

  if (error) {
    listContainer.innerHTML = `<p class="empty">❌ Error: ${error.message}</p>`;
    return;
  }
  allContacts = data || [];
  renderContacts(allContacts);
}

function renderContacts(list) {
  if (list.length === 0) {
    listContainer.innerHTML = '<p class="empty">No hay contactos registrados.</p>';
    return;
  }
  listContainer.innerHTML = list
    .map((c) => {
      const recargaHtml = c.ultima_recarga_monto
        ? `<div class="recarga">💰 Última recarga: <strong>$${Number(c.ultima_recarga_monto).toLocaleString("es-CL")}</strong> el ${formatDate(c.ultima_recarga_fecha)}</div>`
        : `<div class="recarga">⚠️ Sin recargas registradas</div>`;
      return `
        <div class="contact-item">
          <div class="top">
            <div>
              <h3>${escapeHtml(c.nombre_usuario)}</h3>
              <span class="empresa">${escapeHtml(c.empresa)}</span>
              <div class="telefono">+56 9 ${escapeHtml(c.numero)}</div>
            </div>
            <div class="actions">
              <button class="btn-edit" onclick="editContact('${c.id}')">✏️</button>
              <button class="btn-delete" onclick="deleteContact('${c.id}', '${escapeHtml(c.nombre_usuario)}')">🗑️</button>
            </div>
          </div>
          ${recargaHtml}
          <div class="actions" style="margin-top:10px">
            <button class="btn-recarga" onclick="addRecarga('${c.id}', '${escapeHtml(c.nombre_usuario)}')">💵 Registrar recarga</button>
          </div>
        </div>
      `;
    })
    .join("");
}

// ============================================================
// GUARDAR (crear o actualizar)
// ============================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = idInput.value;
  const numero = numeroInput.value.trim();

  if (!/^\d{8}$/.test(numero)) {
    alert("El número debe tener exactamente 8 dígitos numéricos.");
    return;
  }

  const payload = {
    nombre_usuario: nombreInput.value.trim(),
    empresa: empresaInput.value,
    numero: numero,
    ultima_recarga_monto: montoInput.value ? Number(montoInput.value) : null,
    ultima_recarga_fecha: fechaInput.value || null,
  };

  let result;
  if (id) {
    payload.updated_at = new Date().toISOString();
    result = await supabaseClient.from("contactos_prepago").update(payload).eq("id", id);
  } else {
    result = await supabaseClient.from("contactos_prepago").insert([payload]);
  }

  if (result.error) {
    alert("❌ Error: " + result.error.message);
    return;
  }

  resetForm();
  loadContacts();
});

// ============================================================
// EDITAR
// ============================================================
window.editContact = async (id) => {
  const c = allContacts.find((x) => x.id === id);
  if (!c) return;
  idInput.value = c.id;
  nombreInput.value = c.nombre_usuario;
  empresaInput.value = c.empresa;
  numeroInput.value = c.numero;
  montoInput.value = c.ultima_recarga_monto || "";
  fechaInput.value = c.ultima_recarga_fecha || "";
  formTitle.textContent = "✏️ Editar contacto";
  btnSubmit.textContent = "Actualizar";
  btnCancel.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// ============================================================
// ELIMINAR
// ============================================================
window.deleteContact = async (id, nombre) => {
  if (!confirm(`¿Eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) return;
  const { error } = await supabaseClient.from("contactos_prepago").delete().eq("id", id);
  if (error) {
    alert("❌ Error: " + error.message);
    return;
  }
  loadContacts();
};

// ============================================================
// REGISTRAR RECARGA RÁPIDA
// ============================================================
window.addRecarga = async (id, nombre) => {
  const monto = prompt(`Monto de la recarga para ${nombre} (solo números):`);
  if (monto === null) return;
  if (!/^\d+(\.\d+)?$/.test(monto)) {
    alert("Monto inválido.");
    return;
  }
  const fecha = prompt("Fecha de la recarga (AAAA-MM-DD):", new Date().toISOString().slice(0, 10));
  if (!fecha) return;

  const { error } = await supabaseClient
    .from("contactos_prepago")
    .update({
      ultima_recarga_monto: Number(monto),
      ultima_recarga_fecha: fecha,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    alert("❌ Error: " + error.message);
    return;
  }
  loadContacts();
};

// ============================================================
// BÚSQUEDA
// ============================================================
searchInput.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  const filtered = allContacts.filter(
    (c) =>
      c.nombre_usuario.toLowerCase().includes(q) ||
      c.empresa.toLowerCase().includes(q) ||
      c.numero.includes(q)
  );
  renderContacts(filtered);
});

// ============================================================
// CANCELAR EDICIÓN
// ============================================================
btnCancel.addEventListener("click", resetForm);

function resetForm() {
  form.reset();
  idInput.value = "";
  formTitle.textContent = "➕ Agregar contacto";
  btnSubmit.textContent = "Guardar";
  btnCancel.style.display = "none";
}

// ============================================================
// UTILIDADES
// ============================================================
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function formatDate(iso) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// Iniciar
loadContacts();
