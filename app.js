// app.js

// Cambia esta IP por la de tu EC2 si cambia:
const api = "http://3.82.141.182/data";
let registrosActuales = [];
let idEliminar = null;

// Variables globales para las instancias de los gráficos, para poder destruirlos y recrearlos
let clasificacionChart, anoChart, semanaChart;

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

      // --- Llama a la función para actualizar los gráficos después de cargar los datos ---
      updateCharts(data);
    })
    .catch(error => {
        console.error("Error al cargar los datos:", error);
        mostrarAlerta("Error al cargar los registros desde la API.", "danger");
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
    })
    .catch(error => {
        console.error("Error al editar el registro:", error);
        mostrarAlerta("Error al cargar el registro para edición.", "danger");
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
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        mostrarAlerta("Registro eliminado", "danger");
        cargarDatos(); // Recargar datos y gráficos
    })
    .catch(error => {
        console.error("Error al eliminar el registro:", error);
        mostrarAlerta("Error al eliminar el registro.", "danger");
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

  // Determinar si es POST (crear) o PUT (actualizar)
  const method = document.getElementById("id").readOnly ? "PUT" : "POST";
  const url = document.getElementById("id").readOnly ? `${api}/${id}` : api;

  fetch(url, {
    method: method,
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(registro)
  })
    .then(res => res.json())
    .then(resp => {
      if (resp && resp.message && resp.message === "Item creado") {
        mostrarAlerta("Guardado correctamente");
        cargarDatos(); // Recargar datos y gráficos
        resetearFormulario();
      } else if (resp && resp.message && resp.message === "Item actualizado") { // Asumiendo que tu API devuelve este mensaje
          mostrarAlerta("Actualizado correctamente");
          cargarDatos(); // Recargar datos y gráficos
          resetearFormulario();
      }
      else if (resp && resp.error) {
        mostrarAlerta("Error: " + resp.error, "danger");
      } else {
        mostrarAlerta("Error desconocido al guardar", "danger");
      }
    })
    .catch(error => {
      console.error("Error de red al guardar:", error);
      mostrarAlerta("Error de red al guardar. Asegúrate de que la API esté funcionando.", "danger");
    });
};

// --- Funciones para crear y actualizar los gráficos con Chart.js ---

function updateCharts(data) {
    // 1. Gráfico de Pastel: Casos por Clasificación
    const clasificacionCounts = {};
    data.forEach(record => {
        clasificacionCounts[record.clasificacion] = (clasificacionCounts[record.clasificacion] || 0) + 1;
    });
    const clasificacionLabels = Object.keys(clasificacionCounts);
    const clasificacionData = Object.values(clasificacionCounts);

    const ctxClasificacion = document.getElementById('clasificacionChart');
    if (ctxClasificacion) { // Asegurarse de que el canvas existe
        const context = ctxClasificacion.getContext('2d');
        if (clasificacionChart) clasificacionChart.destroy(); // Destruir gráfico anterior si existe
        clasificacionChart = new Chart(context, {
            type: 'pie',
            data: {
                labels: clasificacionLabels,
                datasets: [{
                    data: clasificacionData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)', // Rojo
                        'rgba(54, 162, 235, 0.7)', // Azul
                        'rgba(255, 206, 86, 0.7)', // Amarillo
                        'rgba(75, 192, 192, 0.7)', // Verde
                        'rgba(153, 102, 255, 0.7)', // Morado
                        'rgba(255, 159, 64, 0.7)'  // Naranja
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false, // El título ya está en la tarjeta HTML
                        text: 'Casos por Clasificación'
                    }
                }
            }
        });
    }


    // 2. Gráfico de Barras: Casos por Año
    const anoCounts = {};
    data.forEach(record => {
        anoCounts[record.ano] = (anoCounts[record.ano] || 0) + 1;
    });
    const anoLabels = Object.keys(anoCounts).sort((a, b) => a - b); // Ordenar años numéricamente
    const anoData = anoLabels.map(year => anoCounts[year]);

    const ctxAno = document.getElementById('anoChart');
    if (ctxAno) { // Asegurarse de que el canvas existe
        const context = ctxAno.getContext('2d');
        if (anoChart) anoChart.destroy();
        anoChart = new Chart(context, {
            type: 'bar',
            data: {
                labels: anoLabels,
                datasets: [{
                    label: 'Número de Casos',
                    data: anoData,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)', // Azul
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Número de Casos'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Año'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false // No se necesita leyenda con un solo dataset
                    }
                }
            }
        });
    }

    // 3. Gráfico de Línea: Casos por Semana (consolidado de todos los años)
    const semanaCounts = {};
    data.forEach(record => {
        semanaCounts[record.semana] = (semanaCounts[record.semana] || 0) + 1;
    });

    const allWeeks = Array.from({ length: 53 }, (_, i) => i + 1); // Semanas del 1 al 53
    const semanaLabels = allWeeks.sort((a, b) => a - b);
    const semanaData = semanaLabels.map(week => semanaCounts[week] || 0); // 0 si no hay datos para la semana

    const ctxSemana = document.getElementById('semanaChart');
    if (ctxSemana) { // Asegurarse de que el canvas existe
        const context = ctxSemana.getContext('2d');
        if (semanaChart) semanaChart.destroy();
        semanaChart = new Chart(context, {
            type: 'line',
            data: {
                labels: semanaLabels,
                datasets: [{
                    label: 'Número de Casos',
                    data: semanaData,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.3, // Suavizar la línea
                    fill: true // Rellenar el área bajo la línea
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Número de Casos'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Semana del Año'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });
    }
}

// Inicializar la carga de la tabla y los gráficos cuando la página esté lista
// Esto reemplaza la llamada directa a cargarDatos() al final del archivo.
document.addEventListener('DOMContentLoaded', cargarDatos);