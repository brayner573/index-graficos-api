// Cambia esta IP por la de tu EC2 si cambia:
const api = "http://3.82.141.182/data";
let registrosActuales = [];
let idEliminar = null;

function cargarDatos() {
  fetch(api)
    .then(res => res.json())
    .then(data => {
      registrosActuales = data;
      let rows = "";
      data.forEach(r => {
        rows += `<tr>
          <td>${r.id}</td>
          <td>${r.ano}</td>
          <td>${r.semana}</td>
          <td>${r.clasificacion}</td>
          <td>
            <button class="btn btn-warning btn-sm" onclick="editar(${r.id})">Editar</button>
            <button class="btn btn-danger btn-sm" onclick="confirmarEliminar(${r.id})">Eliminar</button>
          </td>
        </tr>`;
      });
      document.getElementById("tbody").innerHTML = rows;
    });
}

function mostrarAlerta(msg, tipo = "success") {
  const alerta = document.getElementById("alerta");
  alerta.innerText = msg;
  alerta.className = `alert alert-${tipo}`;
  alerta.classList.remove("d-none");
  setTimeout(() => alerta.classList.add("d-none"), 2000);
}

function resetearFormulario() {
  document.getElementById("formulario").reset();
  document.getElementById("id").readOnly = false;
}

function editar(id) {
  fetch(api + "/" + id)
    .then(res => res.json())
    .then(r => {
      document.getElementById("id").value = r.id;
      document.getElementById("ano").value = r.ano;
      document.getElementById("semana").value = r.semana;
      document.getElementById("clasificacion").value = r.clasificacion;
      document.getElementById("id").readOnly = true;
      window.scrollTo(0,0);
    });
}

// MODAL para eliminar
function confirmarEliminar(id) {
  idEliminar = id;
  const modal = new bootstrap.Modal(document.getElementById('modalEliminar'));
  modal.show();
}

document.getElementById("confirmarEliminarBtn").onclick = function() {
  fetch(api + "/" + idEliminar, {method: "DELETE"})
    .then(() => {
      mostrarAlerta("Registro eliminado", "danger");
      cargarDatos();
    });
  bootstrap.Modal.getInstance(document.getElementById('modalEliminar')).hide();
  resetearFormulario();
};

document.getElementById("formulario").onsubmit = function(e) {
  e.preventDefault();
  const id = Number(document.getElementById("id").value);
  const ano = Number(document.getElementById("ano").value);
  const semana = Number(document.getElementById("semana").value);
  const clasificacion = document.getElementById("clasificacion").value.trim();

  // Validaciones avanzadas
  if (!id || !ano || !semana || !clasificacion) {
    mostrarAlerta("Todos los campos son obligatorios", "danger");
    return;
  }
  if (ano < 2000 || ano > 2100) {
    mostrarAlerta("Año fuera de rango (2000-2100)", "danger");
    return;
  }
  if (semana < 1 || semana > 53) {
    mostrarAlerta("Semana debe ser entre 1 y 53", "danger");
    return;
  }
  if (clasificacion.length < 3) {
    mostrarAlerta("Clasificación debe tener al menos 3 caracteres", "danger");
    return;
  }
  if (!document.getElementById("id").readOnly && registrosActuales.find(r => r.id === id)) {
    mostrarAlerta("El ID ya existe. Usa otro o edita.", "danger");
    return;
  }

  const registro = { id, ano, semana, clasificacion };
  fetch(api, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(registro)
  })
    .then(res => res.json())
    .then(resp => {
      if (resp && resp.message && resp.message === "Item creado") {
        mostrarAlerta("Guardado correctamente");
        cargarDatos();
        resetearFormulario();
      } else if (resp && resp.error) {
        mostrarAlerta("Error: " + resp.error, "danger");
      } else {
        mostrarAlerta("Error desconocido al guardar", "danger");
      }
    })
    .catch(() => {
      mostrarAlerta("Error de red al guardar", "danger");
    });
};

cargarDatos();
