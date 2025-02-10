  /********* Variáveis e Configurações Iniciais *********/
  let posts = [];            // Array para armazenar os postes
  let autoIdCounter = 0;     // Contador para auto-ID (p1, p2, …)
  let mode = "click";        // Modos: "click", "utm", "ref", "ruler", "delete"
  let pendingLatLng = null;  // Posição do clique para novo poste
  let selectedReference = null; // Post selecionado como referência (modo "ref")
  let tempLine = null;       // Linha temporária para visualização da distância (modo ref)
  let isEditing = false;     // Flag para distinguir edição de adição
  let editingPostIndex = null;

  // Variáveis para o modo régua (ruler)
  let rulerStart = null;
  let rulerTempLine = null;

  // Define o sistema UTM (exemplo: Zona 23S)
  proj4.defs("EPSG:32723", "+proj=utm +zone=23 +south +datum=WGS84 +units=m +no_defs");

  // Funções de conversão
  function latLonParaUTM(lat, lon) {
    return proj4("EPSG:4326", "EPSG:32723", [lon, lat]);
  }
  function utmParaLatLon(utmX, utmY) {
    let [lon, lat] = proj4("EPSG:32723", "EPSG:4326", [utmX, utmY]);
    return { lat, lon };
  }
  function latLonParaPoliconica(lat, lon) {
    let [utmX, utmY] = proj4("EPSG:4326", "EPSG:32723", [lon, lat]);
    return { utmX, utmY };
  }

  /********* Funções para cálculo de rumo e destino *********/
  const R = 6378137; // Raio da Terra em metros
  function getBearing(lat1, lng1, lat2, lng2) {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return Math.atan2(y, x);
  }
  function destinationPoint(lat, lng, bearing, distance) {
    const δ = distance / R;
    const φ1 = lat * Math.PI / 180;
    const λ1 = lng * Math.PI / 180;
    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(bearing));
    const λ2 = λ1 + Math.atan2(Math.sin(bearing) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
    return { lat: φ2 * 180 / Math.PI, lng: λ2 * 180 / Math.PI };
  }

  /********* Inicialização do Mapa *********/
  const map = L.map('map', {
    maxZoom: 23
  }).setView([-23.5505, -46.6333], 5);

  const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 60,
    attribution: '© OpenStreetMap'
  });
  const satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 60,
    attribution: '© Google Maps'
  });
  map.invalidateSize();
  streetLayer.addTo(map);

  let isSatellite = false;
  document.getElementById('toggleMapMode').addEventListener('click', () => {
    if (isSatellite) {
      map.removeLayer(satelliteLayer);
      map.addLayer(streetLayer);
    } else {
      map.removeLayer(streetLayer);
      map.addLayer(satelliteLayer);
    }
    isSatellite = !isSatellite;
  });

  const statusDiv = document.getElementById("status");
  function updateStatus(msg) {
    statusDiv.textContent = msg;
  }

  const distanceDisplay = document.getElementById("distanceDisplay");

  /********* Controles e Abas *********/
  const mapTabBtn = document.getElementById("mapTabBtn");
  const listTabBtn = document.getElementById("listTabBtn");
  const mapTab = document.getElementById("mapTab");
  const listTab = document.getElementById("listTab");

  mapTabBtn.addEventListener("click", () => {
    mapTab.classList.add("active");
    listTab.classList.remove("active");
    mapTabBtn.classList.add("active");
    listTabBtn.classList.remove("active");
  });
  listTabBtn.addEventListener("click", () => {
    listTab.classList.add("active");
    mapTab.classList.remove("active");
    listTabBtn.classList.add("active");
    mapTabBtn.classList.remove("active");
    updatePostsTable();
  });

  const modeSelect = document.getElementById("modeSelect");
  modeSelect.addEventListener("change", (e) => {
    mode = e.target.value;
    updateStatus("Modo: " + mode);
    document.getElementById("openUTMModalBtn").style.display = mode === "utm" ? "inline-block" : "none";
    document.getElementById("clearRefBtn").style.display = mode === "ref" ? "inline-block" : "none";
    // Limpa referência ao mudar de modo (exceto em alguns casos, se necessário)
    if (mode !== "ref") {
      selectedReference = null;
    }
  });

  const openUTMModalBtn = document.getElementById("openUTMModalBtn");
  openUTMModalBtn.addEventListener("click", () => {
    modalUTM.style.display = "flex";
  });

  const clearRefBtn = document.getElementById("clearRefBtn");
  clearRefBtn.addEventListener("click", () => {
    selectedReference = null;
    updateStatus("Referência limpa. Selecione um marcador como referência.");
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      if (modalForm.style.display === "flex") {
        closeModalForm();
      }
      if (modalUTM.style.display === "flex") {
        modalUTM.style.display = "none";
        clearUTMModalFields();
      }
      // Opcional: limpar referência ao pressionar Escape
      selectedReference = null;
    }
  });

  /********* Importar KMZ *********/
  const importKMZBtn = document.getElementById("importKMZBtn");
  const importKMZInput = document.getElementById("importKMZInput");
  importKMZBtn.addEventListener("click", () => {
    importKMZInput.click();
  });
  importKMZInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      JSZip.loadAsync(file)
        .then(zip => {
          const kmlFiles = zip.file(/\.kml$/i);
          if (kmlFiles.length === 0) {
            throw new Error("Nenhum arquivo KML encontrado no KMZ.");
          }
          return kmlFiles[0].async("string");
        })
        .then(kmlText => {
          const parser = new DOMParser();
          const kmlDom = parser.parseFromString(kmlText, "text/xml");
          const geojson = toGeoJSON.kml(kmlDom);
          geojson.features.forEach(feature => {
            if (feature.geometry && feature.geometry.type === "Point") {
              const coords = feature.geometry.coordinates; // [lng, lat]
              let marker = L.marker([coords[1], coords[0]]).addTo(map);
              marker.bindPopup(feature.properties.name || "Ponto Importado");
              // Configure os eventos do marcador
              marker.on("click", markerClickHandler);
              marker.on("contextmenu", markerEditHandler);
              posts.push({
                id: "imported_" + (++autoIdCounter),
                poste: feature.properties.name || "Importado",
                primaria: "",
                secundaria: "",
                lat: coords[1],
                lon: coords[0],
                utmX: null,
                utmY: null,
                distance: null,
                refId: null,
                marker: marker
              });
            }
          });
          updateStatus("KMZ importado com sucesso.");
          salvarDadosNoLocalStorage(posts);
        })
        .catch(err => {
          alert("Erro ao importar KMZ: " + err);
        });
    }
  });

  const exportBtn = document.getElementById("exportGroupedJSONBtn");
  exportBtn.addEventListener("click", exportPoints);
  function exportPoints() {
    const exportData = posts.map(post => ({
      "type": "Feature",
      "properties": {
        "name": post.id,
        "description": `
          Poste: ${post.poste}
          Primaria: ${post.primaria}
          Secundaria: ${post.secundaria}
          `
      },
      "geometry": {
        "type": "Point",
        "coordinates": [post.lon, post.lat]
      }
    }));
    const geoJson = {
      "type": "FeatureCollection",
      "features": exportData
    };
    const data = JSON.stringify(geoJson, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "posts.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /********* Eventos do Mapa *********/
  map.on("click", function (e) {
    if (mode === "click") {
      pendingLatLng = e.latlng;
      isEditing = false;
      document.getElementById("modalTitle").textContent = "Adicionar Poste";
      openModalForm();
    } else if (mode === "ref") {
      if (selectedReference) {
        pendingLatLng = e.latlng;
        isEditing = false;
        document.getElementById("modalTitle").textContent = "Adicionar Poste";
        openModalForm();
      } else {
        updateStatus("No modo 'Por Referência', selecione um marcador como referência.");
      }
    } else if (mode === "ruler") {
      // Modo régua: se não há ponto inicial, define-o; senão, mede e finaliza
      if (!rulerStart) {
        rulerStart = e.latlng;
        rulerTempLine = L.polyline([rulerStart, rulerStart], { color: 'green', dashArray: '5,5' }).addTo(map);
        updateStatus("Régua: ponto de início definido. Clique para definir o ponto final.");
      } else {
        let distance = map.distance(rulerStart, e.latlng);
        updateStatus("Régua: Distância medida: " + distance.toFixed(2) + " m.");
        if (rulerTempLine) {
          map.removeLayer(rulerTempLine);
          rulerTempLine = null;
        }
        rulerStart = null;
      }
    }
  });

  map.on("mousemove", function (e) {
    if (mode === "ref" && selectedReference) {
      let fromLatLng = selectedReference.latlng;
      let toLatLng = e.latlng;
      let distance = map.distance(fromLatLng, toLatLng);
      distanceDisplay.style.display = "block";
      distanceDisplay.textContent = "Distância: " + distance.toFixed(2) + " m";
      if (modalForm.style.display === "flex") {
        const inputDistance = document.getElementById("inputDistance");
        if (document.activeElement !== inputDistance) {
          inputDistance.value = distance.toFixed(2);
        }
      }
      if (tempLine) {
        tempLine.setLatLngs([fromLatLng, toLatLng]);
      } else {
        tempLine = L.polyline([fromLatLng, toLatLng], { color: 'red', dashArray: '5,5' }).addTo(map);
      }
    } else if (mode === "ruler" && rulerStart) {
      if (rulerTempLine) {
        rulerTempLine.setLatLngs([rulerStart, e.latlng]);
      }
      distanceDisplay.style.display = "block";
      let distance = map.distance(rulerStart, e.latlng);
      distanceDisplay.textContent = "Régua: " + distance.toFixed(2) + " m";
    } else {
      distanceDisplay.style.display = "none";
      if (tempLine) {
        map.removeLayer(tempLine);
        tempLine = null;
      }
    }
  });

  /********* Função para criação do marcador de um poste *********/
  function criarMarkerParaPost(post) {
    let marker = L.marker([post.lat, post.lon]).addTo(map);
    marker.on("click", markerClickHandler);
    marker.on("contextmenu", markerEditHandler);
    let tooltipContent = `<strong>${post.id}</strong><br>${post.poste}<br>${post.primaria}<br>${post.secundaria}`;
    if (post.distance) {
      tooltipContent += `<br><em>Distância: ${post.distance} m</em>`;
    }
    marker.bindTooltip(tooltipContent, { permanent: true, direction: "top", className: "marker-label" });
    return marker;
  }

  /********* Handlers de clique nos marcadores *********/
  function markerClickHandler(e) {
    // Se estiver no modo delete, ao clicar o marcador é excluído
    if (mode === "delete") {
      let post = posts.find(p => p.marker === e.target);
      if (post && confirm("Deseja excluir este poste?")) {
        if (post.marker) map.removeLayer(post.marker);
        if (post.refLine) map.removeLayer(post.refLine);
        posts.splice(posts.indexOf(post), 1);
        updateStatus("Poste excluído: " + post.id);
        updatePostsTable();
        salvarDadosNoLocalStorage(posts);
      }
      return;
    }
    // No modo ref, seleciona o marcador como referência
    if (mode === "ref") {
      let post = posts.find(p => p.marker === e.target);
      if (post) {
        selectedReference = { post: post, latlng: L.latLng(post.lat, post.lon) };
        updateStatus("Referência selecionada: " + post.id);
      }
    }
  }

  function markerEditHandler(e) {
    e.originalEvent.preventDefault();
    let post = posts.find(p => p.marker === e.target);
    if (post) {
      openEditModal(post);
    }
  }

  /********* Modal de Cadastro/Edição *********/
  const modalForm = document.getElementById("modalForm");
  const inputID = document.getElementById("inputID");
  const inputPoste = document.getElementById("inputPoste");
  const inputPrimaria = document.getElementById("inputPrimaria");
  const inputSecundaria = document.getElementById("inputSecundaria");
  const refDistanceDiv = document.getElementById("refDistance");
  const cancelBtn = document.getElementById("cancelBtn");
  const saveBtn = document.getElementById("saveBtn");

  function openModalForm() {
    refDistanceDiv.style.display = (mode === "ref") ? "block" : "none";
    modalForm.style.display = "flex";
  }
  function closeModalForm() {
    modalForm.style.display = "none";
    inputID.value = "";
    refDistanceDiv.style.display = "none";
    pendingLatLng = null;
    if (tempLine) {
      map.removeLayer(tempLine);
      tempLine = null;
    }
    isEditing = false;
    editingPostIndex = null;
  }

  cancelBtn.addEventListener("click", () => {
    closeModalForm();
  });

  function openEditModal(post) {
    const index = posts.findIndex(p => p === post);
    if (index >= 0) {
      isEditing = true;
      editingPostIndex = index;
      document.getElementById("modalTitle").textContent = "Editar Poste";
      inputID.value = post.id;
      inputPoste.value = post.poste;
      inputPrimaria.value = post.primaria;
      inputSecundaria.value = post.secundaria;
      if (mode === "ref" && selectedReference) {
        document.getElementById("inputDistance").value = post.distance || "";
      }
      modalForm.style.display = "flex";
    }
  }

  function saveBTNF() {
    if (isEditing) {
      let post = posts[editingPostIndex];
      let newID = inputID.value.trim();
      if (newID === "") {
        newID = "P" + (editingPostIndex + 1);
      }
      post.id = newID;
      post.poste = inputPoste.value;
      post.primaria = inputPrimaria.value;
      post.secundaria = inputSecundaria.value;
      if (mode === "ref" && selectedReference) {
        post.distance = map.distance(selectedReference.latlng, L.latLng(post.lat, post.lon)).toFixed(2);
      }
      let tooltipContent = `<strong>${post.id}</strong><br>${post.poste}<br>${post.primaria}<br>${post.secundaria}`;
      if (post.distance) {
        tooltipContent += `<br><em>Distância: ${post.distance} m</em>`;
      }
      if (post.marker) {
        post.marker.setTooltipContent(tooltipContent);
      }
      updateStatus("Poste editado: " + post.id);
      closeModalForm();
      salvarDadosNoLocalStorage(posts);
      return;
    }

    if (!pendingLatLng) return;
    let idVal = inputID.value.trim();
    if (idVal === "") {
      autoIdCounter++;
      idVal = "P" + autoIdCounter;
    }
    let posteVal = inputPoste.value;
    let primariaVal = inputPrimaria.value;
    let secundariaVal = inputSecundaria.value;

    let lat = pendingLatLng.lat;
    let lon = pendingLatLng.lng;

    if (mode === "ref" && selectedReference) {
      const inputDistance = document.getElementById("inputDistance");
      let distTyped = parseFloat(inputDistance.value);
      if (!isNaN(distTyped) && distTyped > 0) {
        let refLat = selectedReference.latlng.lat;
        let refLng = selectedReference.latlng.lng;
        let bearing = getBearing(refLat, refLng, pendingLatLng.lat, pendingLatLng.lng);
        let dest = destinationPoint(refLat, refLng, bearing, distTyped);
        lat = dest.lat;
        lon = dest.lng;
        pendingLatLng = L.latLng(lat, lon);
      }
    }

    let [utmX, utmY] = latLonParaUTM(lat, lon);
    let newPost = {
      id: idVal,
      poste: posteVal,
      primaria: primariaVal,
      secundaria: secundariaVal,
      lat: lat,
      lon: lon,
      utmX: utmX,
      utmY: utmY,
      distance: (mode === "ref" && selectedReference) ? map.distance(selectedReference.latlng, pendingLatLng).toFixed(2) : null,
      refId: (mode === "ref" && selectedReference) ? selectedReference.post.id : null
    };

    let marker = criarMarkerParaPost(newPost);
    newPost.marker = marker;

    if (mode === "ref" && selectedReference) {
      let permLine = L.polyline([selectedReference.latlng, [lat, lon]], { color: 'blue', weight: 2 }).addTo(map);
      newPost.refLine = permLine;
    }

    posts.push(newPost);
    updateStatus("Poste adicionado: " + newPost.id);
    closeModalForm();

    if (mode === "ref") {
      selectedReference = { post: newPost, latlng: L.latLng(newPost.lat, newPost.lon) };
      updateStatus("Nova referência: " + newPost.id);
    }
    salvarDadosNoLocalStorage(posts);
  }

  saveBtn.addEventListener("click", () => saveBTNF());
  document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") saveBtn.click();
  });

  const modalUTM = document.getElementById("modalUTM");
  const inputUTMX = document.getElementById("inputUTMX");
  const inputUTMY = document.getElementById("inputUTMY");
  const inputID_utm = document.getElementById("inputID_utm");
  const inputPoste_utm = document.getElementById("inputPoste_utm");
  const inputPrimaria_utm = document.getElementById("inputPrimaria_utm");
  const inputSecundaria_utm = document.getElementById("inputSecundaria_utm");
  const cancelUTMBtn = document.getElementById("cancelUTMBtn");
  const saveUTMBtn = document.getElementById("saveUTMBtn");

  cancelUTMBtn.addEventListener("click", () => {
    modalUTM.style.display = "none";
    clearUTMModalFields();
  });
  function clearUTMModalFields() {
    inputUTMX.value = "";
    inputUTMY.value = "";
    inputID_utm.value = "";
  }
  saveUTMBtn.addEventListener("click", () => {
    let utmXVal = parseFloat(inputUTMX.value);
    let utmYVal = parseFloat(inputUTMY.value);
    if (isNaN(utmXVal) || isNaN(utmYVal)) {
      alert("Insira valores válidos para UTM X e Y.");
      return;
    }
    let { lat, lon } = utmParaLatLon(utmXVal, utmYVal);
    let idVal = inputID_utm.value.trim();
    if (idVal === "") {
      autoIdCounter++;
      idVal = "P" + autoIdCounter;
    }
    let posteVal = inputPoste_utm.value;
    let primariaVal = inputPrimaria_utm.value;
    let secundariaVal = inputSecundaria_utm.value;
    let newPost = {
      id: idVal,
      poste: posteVal,
      primaria: primariaVal,
      secundaria: secundariaVal,
      lat: lat,
      lon: lon,
      utmX: utmXVal,
      utmY: utmYVal,
      distance: null,
      refId: null
    };
    let marker = criarMarkerParaPost(newPost);
    newPost.marker = marker;
    posts.push(newPost);
    updateStatus("Poste adicionado por UTM: " + newPost.id);
    modalUTM.style.display = "none";
    clearUTMModalFields();
    salvarDadosNoLocalStorage(posts);
  });

  /********* Funções da Tabela e Organização *********/
  function OrganizarPostes(criterio) {
    posts.sort((a, b) => {
      switch (criterio) {
        case "poste":
          // Ordenação pelo valor numérico após o "/"
          const posteA = parseInt(a.poste.split("/")[1], 10);
          const posteB = parseInt(b.poste.split("/")[1], 10);
          return posteA - posteB;
        case "primaria":
          return a.primaria.localeCompare(b.primaria);
        case "ID":
          const idA = parseInt(a.id.replace("P", ""), 10);
          const idB = parseInt(b.id.replace("P", ""), 10);
          return idA - idB;
        case "lat":
          return a.lat - b.lat;
        case "lon":
          return a.lon - b.lon;
        default:
          return 0;
      }
    });
  }

  function updatePostsTable() {
    salvarDadosNoLocalStorage(posts);
    let tbody = document.querySelector("#postsTable tbody");
    tbody.innerHTML = "";
    OrganizarPostes("ID");
    posts.forEach((post, index) => {
      let tr = document.createElement("tr");
      tr.innerHTML = `
          <td><input type="checkbox" data-index="${index}" class="selectorMassivo"></td>
          <td>
            <select indice="${index}" class="divsion">
              <option value="0"></option>
              <option value="1">Div</option>
            </select>
          </td>
          <td class="bulk-id" data-index="${index}">${post.id}</td>
          <td class="bulk-poste">${post.poste}</td>
          <td class="bulk-primaria">${post.primaria}</td>
          <td class="bulk-secundaria">${post.secundaria}</td>
          <td>${post.lat.toFixed(6)}</td>
          <td>${post.lon.toFixed(6)}</td>
          <td>
            <button data-index="${index}" class="deleteBtn" style="background:#dc3545; color:#fff;">Excluir</button>
            <button data-index="${index}" class="editBtn" style="background:#f39c12; color:#fff;">Editar</button>
          </td>
        `;
      tr.setAttribute("draggable", true);
      tr.setAttribute("ondragstart", "drag(event)");
      tbody.appendChild(tr);
    });
    document.querySelectorAll(".deleteBtn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        let idx = parseInt(e.target.getAttribute("data-index"));
        deletePost(idx);
      });
    });
    document.querySelectorAll(".editBtn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        let idx = parseInt(e.target.getAttribute("data-index"));
        if (posts[idx]) {
          openEditModal(posts[idx]);
        }
      });
    });
  }

  function saveBulk(origem) {
    salvarDadosNoLocalStorage(posts);
    document.querySelectorAll("#postsTable tbody tr").forEach(tr => {
      let idx = tr.querySelector(".bulk-id").getAttribute("data-index");
      let idVal = tr.querySelector(".bulk-id").innerHTML;
      let posteVal = tr.querySelector(".bulk-poste").innerHTML;
      let primariaVal = tr.querySelector(".bulk-primaria").innerHTML;
      let secundariaVal = tr.querySelector(".bulk-secundaria").innerHTML;
      if (posts[idx]) {
        posts[idx].id = idVal;
        posts[idx].poste = posteVal;
        posts[idx].primaria = primariaVal;
        posts[idx].secundaria = secundariaVal;
        let tooltipContent = `<strong>${posts[idx].id}</strong><br>${posts[idx].poste}<br>${posts[idx].primaria}<br>${posts[idx].secundaria}`;
        if (posts[idx].distance) {
          tooltipContent += `<br><em>Distância: ${posts[idx].distance} m</em>`;
        }
        if (posts[idx].marker) {
          posts[idx].marker.setTooltipContent(tooltipContent);
        }
      }
    });
    if (origem !== "re") {
      updateStatus("Salvo com sucesso!!!");
    }
  }

  document.getElementById("saveBulkBtn").addEventListener("click", saveBulk);

  document.getElementById("reorgBtn").addEventListener("click", reorganizeIDs);
  function reorganizeIDs() {
    saveBulk("re");
    let filteredPosts = posts.filter(e => e.id[0].toUpperCase() === "P");
    const rows = Array.from(document.querySelectorAll('#postsTable tbody tr'));
    const postRows = rows.map((row, index) => {
      const postId = row.querySelector('.bulk-id').textContent.trim();
      const post = posts.find(p => p.id === postId);
      return { post, row };
    });
    postRows.forEach(({ post, row }, index) => {
      if (post.id[0].toUpperCase() === "P") {
        post.id = "P" + (index + 1);
      }
      if (post.marker) {
        let tooltipContent = `<strong>${post.id}</strong><br>${post.poste}<br>${post.primaria}<br>${post.secundaria}`;
        if (post.distance) {
          tooltipContent += `<br><em>Distância: ${post.distance} m</em>`;
        }
        post.marker.setTooltipContent(tooltipContent);
      }
    });
    autoIdCounter = posts.length;
    updateStatus("IDs reorganizados.");
    updatePostsTable();
  }

  window.addEventListener("click", (e) => {
    if (e.target === modalForm) {
      closeModalForm();
    }
    if (e.target === modalUTM) {
      modalUTM.style.display = "none";
      clearUTMModalFields();
    }
  });

  const importJSONBtn = document.getElementById("importJSONBtn");
  const importJSONInput = document.createElement("input");
  importJSONInput.type = "file";
  importJSONInput.accept = "application/json";
  importJSONInput.style.display = "none";
  document.body.appendChild(importJSONInput);

  importJSONBtn.addEventListener("click", () => {
    importJSONInput.click();
  });

  function ImportarData(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (ev) {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
            data.features.forEach(feature => {
              if (feature.geometry.type === "Point" && feature.geometry.coordinates.length === 2) {
                const coords = feature.geometry.coordinates;
                const properties = feature.properties;
                const name = properties.name;
                const description = properties.description;
                let lines = description.split("\n").map(line => line.trim()).filter(line => line !== "");
                let posteVal = lines[0] ? lines[0].replace("Poste: ", "") : "";
                let primariaVal = lines[1] ? lines[1].replace("Primaria: ", "") : "";
                let secundariaVal = lines[2] ? lines[2].replace("Secundaria: ", "") : "";
                let marker = L.marker([coords[1], coords[0]]).addTo(map);
                marker.on("click", markerClickHandler);
                marker.on("contextmenu", markerEditHandler);
                const pt = {
                  id: name,
                  lat: coords[1],
                  lon: coords[0],
                  marker: marker,
                  poste: posteVal,
                  primaria: primariaVal,
                  secundaria: secundariaVal,
                  utmX: coords[0],
                  utmY: coords[1],
                  distance: null,
                  refId: null
                };
                if (mode === "ref" && selectedReference) {
                  pt.distance = map.distance(selectedReference.latlng, L.latLng(pt.lat, pt.lon)).toFixed(2);
                }
                let tooltipContent = `<strong>${pt.id}</strong><br>${pt.poste}<br>${pt.primaria}<br>${pt.secundaria}`;
                if (pt.distance) {
                  tooltipContent += `<br><em>Distância: ${pt.distance} m</em>`;
                }
                marker.bindTooltip(tooltipContent, { permanent: true, direction: "top", className: "marker-label" });
                if (mode === "ref" && selectedReference) {
                  let permLine = L.polyline([selectedReference.latlng, [pt.lat, pt.lon]], { color: 'blue', weight: 2 }).addTo(map);
                  pt.refLine = permLine;
                }
                posts.push(pt);
              }
            });
            updateStatus("Projeto importado com sucesso.");
            salvarDadosNoLocalStorage(posts);
          } else {
            alert("Formato JSON inválido.");
          }
        } catch (err) {
          alert("Erro ao importar JSON: " + err);
        }
      };
      reader.readAsText(file);
    }
  }

  importJSONInput.addEventListener("change", function (e) {
    ImportarData(e);
  });

  const massivoBTN = document.getElementById("massivoBTN");
  massivoBTN.addEventListener("click", editarMassivo);

  function editarMassivo() {
    const selectorMassivo = document.querySelectorAll(".selectorMassivo");
    let massivoI = [];
    selectorMassivo.forEach((checkbox, i) => {
      if (checkbox.checked) {
        massivoI.push(i);
      }
    });
    if (massivoI.length === 0) {
      alert("Selecione ao menos um poste para edição massiva.");
      return;
    }
    modalForm.style.display = "flex";
    document.getElementById("modalTitle").textContent = "Edição Massiva";
    saveBtn.id = "massivoSalvar";
    saveBtn.setAttribute("onclick", `edtM(${JSON.stringify(massivoI)})`);
  }

  function edtM(indices) {
    indices.forEach(i => {
      const postt = posts[i];
      postt.poste = inputPoste.value;
      postt.primaria = inputPrimaria.value;
      postt.secundaria = inputSecundaria.value;
    });
    modalForm.style.display = "none";
    saveBtn.id = "saveBtn";
    saveBtn.removeAttribute("onclick");
    saveBulk();
    updatePostsTable();
  }

  function fragmentarArray(array, arraySeg) {
    let resultado = [];
    let inicio = 0;
    arraySeg.forEach(indice => {
      if (indice > inicio && indice <= array.length) {
        let fragmento = array.slice(inicio, indice);
        fragmento.push(array[indice]);
        resultado.push(fragmento);
        inicio = indice;
      }
    });
    if (inicio < array.length) {
      resultado.push(array.slice(inicio));
    }
    return resultado;
  }

  function exportCSV(header, dataArray) {
    let csv = header + "\n";
    dataArray.forEach(row => {
      let rowString = row.map(cell => {
        let cellStr = cell.toString();
        if (cellStr.indexOf(";") !== -1 || cellStr.indexOf("\"") !== -1) {
          cellStr = "\"" + cellStr.replace(/\"/g, "\"\"") + "\"";
        }
        return cellStr;
      }).join(";");
      csv += rowString + "\n";
    });
    return csv;
  }

  function downloadCSV(csv, filename = "dados.csv") {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function encontrarDivs() {
    let divs = [];
    const divsion = document.querySelectorAll(".divsion");
    divsion.forEach(e => {
      if (e.value == 1) {
        divs.push(e.getAttribute("indice"));
      }
    });
    let projetos = [];
    posts.forEach((e, i) => {
      let ups = {
        base: "",
        q_base: "",
        primaria: "",
        q_primaria: "",
        pinos: "",
        p_ok: ""
      }
      if (e.poste.slice("/")[1] > 599 && e.poste.slice("/")[1] < 1001) ups.base = "EQT110";
      if (e.poste.slice("/")[1] > 1001 && e.poste.slice("/")[1] < 2001) ups.base = "EQT111";
      if (e.poste.slice("/")[0] == "PDU") ups.base = "EQT699";
      if (ups.base != "") ups.q_base = 1;
      if (e.primaria == "N1") { ups.primaria = "EQT162"; ups.pinos = 3; }
      if (e.primaria == "N2") { ups.primaria = "EQT164"; ups.pinos = 6; }
      if (e.primaria == "N3") ups.primaria = "EQT166";
      if (e.primaria == "N4") { ups.primaria = "EQT168"; ups.pinos = 1; }
      if (ups.pinos != "") ups.p_ok = "PIN009";
      if (ups.primaria != "") ups.q_primaria = 1;
      let idCSV = e.id.replace(/p/gi, "");
      idCSV = "'" + String(idCSV).padStart(8, '0');
      projetos.push(["COMPANHIA", "RURAL", "34,5", 999, idCSV, e.poste, e.primaria, "", "", "", "", "", "", "", "", "", ups.base, ups.q_base, "", "", "", "", "", "", "", "", "CAB016", "ABC", "", "", "", e.utmX, e.utmY, "EQT088", "1", "PLA003", "1", ups.p_ok, ups.pinos, ups.primaria, ups.q_primaria]);
    });
    const proj = fragmentarArray(projetos, divs);
    const header = `PROP_REDE;LOC_REDE;TENSA0_KV;SEQ;NUMERO POSTE;UP_POSTE;UP_EST_MT_NIVEL1;UP_ISO_NIVEL1;UP_EST_MT_NIVEL2;UP_ISO_NIVEL2;UP_EST_MT_NIVEL3;UP_ISO_NIVEL3;UP_BT_NIVEL1;UP_BT_NIVEL2;UP_ESTAI;QDE_ESTAI;UP_BASE_SUBSOLO;QDE_BASE;UP_ATERR;QDE_ATERR;UP_PARA_RAIOS;QDE_PARA_RAIOS;UP_CHAVE;NUM_CHAVE;TRAFO;CT_TRAFO;UP_CABO_MT_FASE;CABO_MT_FASE;UP_CABO_BT_FASE;CABO_BT_FASE;UP_CABO_NEUTRO;COORD_X;COORD_Y;UP_AVULSO1;QDE_UP_AVULSO1;UP_AVULSO2;QDE_UP_AVULSO2;UP_AVULSO3;QDE_UP_AVULSO3;UP_AVULSO4;QDE_UP_AVULSO4;UP_AVULSO5;QDE_UP_AVULSO5;UP_AVULSO6;QDE_UP_AVULSO6;UP_AVULSO7;QDE_UP_AVULSO7;UP_AVULSO8;QDE_UP_AVULSO8;UP_AVULSO9;QDE_UP_AVULSO9;UP_AVULSO10;QDE_UP_AVULSO10;UP_AVULSO11;QDE_UP_AVULSO11;UP_AVULSO12;QDE_UP_AVULSO12;UP_AVULSO13;QDE_UP_AVULSO13;UP_AVULSO14;QDE_UP_AVULSO14;UP_AVULSO15;QDE_UP_AVULSO15;UP_AVULSO16;QDE_UP_AVULSO16;UP_AVULSO17;QDE_UP_AVULSO17;UP_AVULSO18;QDE_UP_AVULSO18;UP_AVULSO19;QDE_UP_AVULSO19;UP_AVULSO20;QDE_UP_AVULSO20;SERV_AVULSO1;QDE_SERV_AVULSO1;SERV_AVULSO2;QDE_SERV_AVULSO2;SERV_AVULSO3;QDE_SERV_AVULSO3;SERV_AVULSO4;QDE_SERV_AVULSO4;SERV_AVULSO5;QDE_SERV_AVULSO5;UP_CABO_MT_DERIV_1;QDE_UP_MT_DERIV_1;UP_CABO_MT_DERIV_2;QDE_UP_MT_DERIV_2;UP_CABO_MT_DERIV_3;QDE_UP_MT_DERIV_3;UP_CABO_MT_DERIV_4;QDE_UP_MT_DERIV_4;UP_CABO_MT_DERIV_5;QDE_UP_MT_DERIV_5`;
    proj.forEach((fragment, i) => {
      let t = [];
      fragment.forEach((row, j) => {
        row[3] = j + 1;
        t.push(row);
      });
      const csvString = exportCSV(header, t);
      downloadCSV(csvString);
    });
  }
  document.getElementById("csvBTN").addEventListener("click", encontrarDivs);

  let draggedRow = null;
  function drag(event) {
    draggedRow = event.target;
    event.dataTransfer.setData("text/html", draggedRow.id);
  }
  const table = document.getElementById("postsTable");
  table.addEventListener("dragover", function (event) {
    event.preventDefault();
  });
  table.addEventListener("drop", function (event) {
    event.preventDefault();
    const target = event.target.closest("tr");
    if (target && target !== draggedRow) {
      const rows = Array.from(table.querySelectorAll("tbody tr"));
      const draggedIndex = rows.indexOf(draggedRow);
      const targetIndex = rows.indexOf(target);
      if (draggedIndex < targetIndex) {
        target.parentNode.insertBefore(draggedRow, target.nextSibling);
      } else {
        target.parentNode.insertBefore(draggedRow, target);
      }
    }
  });

  /********* LocalStorage: Salvar e Carregar Dados *********/
  function salvarDadosNoLocalStorage(dados) {
    const serializable = dados.map(post => ({
      id: post.id,
      poste: post.poste,
      primaria: post.primaria,
      secundaria: post.secundaria,
      lat: post.lat,
      lon: post.lon,
      utmX: post.utmX,
      utmY: post.utmY,
      distance: post.distance,
      refId: post.refId || null
    }));
    localStorage.setItem("dados", JSON.stringify(serializable));
  }

  function carregarDadosDoLocalStorage() {
    const dadosSalvos = localStorage.getItem("dados");
    if (dadosSalvos) {
      const postsCarregados = JSON.parse(dadosSalvos);
      posts = []; // Limpa o array atual
      // Primeiro, recria os marcadores para cada poste
      postsCarregados.forEach(postData => {
        let post = { ...postData };
        post.marker = criarMarkerParaPost(post);
        posts.push(post);
      });
      // Em seguida, recria as linhas de referência, se houver
      posts.forEach(post => {
        if (post.refId) {
          let refPost = posts.find(p => p.id === post.refId);
          if (refPost) {
            post.refLine = L.polyline([L.latLng(refPost.lat, refPost.lon), L.latLng(post.lat, post.lon)], { color: 'blue', weight: 2 }).addTo(map);
          }
        }
      });
      autoIdCounter = posts.length;
      updatePostsTable();
      updateStatus("Dados carregados do LocalStorage.");
    }
  }

  // Chama a função de carregamento (se houver dados salvos)
  carregarDadosDoLocalStorage();

  /********* Função para Abrir a Tabela de Postes em uma Nova Aba (Popup) *********/
  function openTableInNewTab() {
    const newWindow = window.open("", "_blank");
    const html = `
    <html>
      <head>
        <title>Tabela de Postes</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f9f9f9;
            padding: 20px;
            margin: 0;
          }
          h1 {
            text-align: center;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px 15px;
            border: 1px solid #ddd;
            text-align: left;
          }
          th {
            background-color: #4CAF50;
            color: #fff;
          }
          tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          button {
            padding: 6px 12px;
            border: none;
            background-color: #4CAF50;
            color: #fff;
            border-radius: 4px;
            cursor: pointer;
            margin: 2px;
          }
          button:hover {
            background-color: #45a049;
          }
        </style>
      </head>
      <body>
        <h1>Tabela de Postes</h1>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Poste</th>
              <th>Primaria</th>
              <th>Secundaria</th>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${posts.map((post, index) => `
              <tr>
                <td>${post.id}</td>
                <td>${post.poste}</td>
                <td>${post.primaria}</td>
                <td>${post.secundaria}</td>
                <td>${post.lat.toFixed(6)}</td>
                <td>${post.lon.toFixed(6)}</td>
                <td>
                  <button onclick="window.opener.deletePost(${index})">Excluir</button>
                  <button onclick="window.opener.editPost(${index})">Editar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
    `;
    newWindow.document.write(html);
    newWindow.document.close();
  }

  document.getElementById("openTableBtn").addEventListener("click", openTableInNewTab);

  /********* Funções Globais para Exclusão e Edição (chamadas pelo popup) *********/
  function deletePost(index) {
    if (posts[index] && confirm("Deseja excluir este poste?")) {
      if (posts[index].marker) {
        map.removeLayer(posts[index].marker);
      }
      if (posts[index].refLine) {
        map.removeLayer(posts[index].refLine);
      }
      posts.splice(index, 1);
      updateStatus("Poste excluído.");
      updatePostsTable();
      salvarDadosNoLocalStorage(posts);
    }
  }

  function editPost(index) {
    if (posts[index]) {
      openEditModal(posts[index]);
    }
  }

  /********* Popup de Edição Massiva *********/
  let massEditPopup = null;

  function openMassEditPopup() {
    massEditPopup = window.open("", "MassEdit", "width=800,height=600");
    const html = `
    <html>
      <head>
        <title>Edição Massiva de Postes</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f9f9f9;
            padding: 20px;
            margin: 0;
          }
          h1 {
            text-align: center;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: left;
          }
          th {
            background-color: #4CAF50;
            color: #fff;
          }
          input[type="text"] {
            width: 100%;
            padding: 6px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          button {
            padding: 8px 16px;
            margin: 10px 5px;
            border: none;
            background-color: #4CAF50;
            color: #fff;
            border-radius: 4px;
            cursor: pointer;
          }
          button:hover {
            background-color: #45a049;
          }
        </style>
      </head>
      <body>
        <h1>Edição Massiva de Postes</h1>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Poste</th>
              <th>Primaria</th>
              <th>Secundaria</th>
              <th>Latitude</th>
              <th>Longitude</th>
            </tr>
          </thead>
          <tbody>
            ${posts.map((post, index) => `
              <tr>
                <td><input type="text" id="mass_id_${index}" value="${post.id}" /></td>
                <td><input type="text" id="mass_poste_${index}" value="${post.poste}" /></td>
                <td><input type="text" id="mass_primaria_${index}" value="${post.primaria}" /></td>
                <td><input type="text" id="mass_secundaria_${index}" value="${post.secundaria}" /></td>
                <td>${post.lat.toFixed(6)}</td>
                <td>${post.lon.toFixed(6)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="text-align: center;">
          <button onclick="window.opener.saveAllMassEdit()">Salvar Alterações</button>
          <button onclick="window.opener.closeMassEditPopup()">Fechar</button>
        </div>
      </body>
    </html>
    `;
    massEditPopup.document.write(html);
    massEditPopup.document.close();
  }

  function saveAllMassEdit() {
    if (massEditPopup && !massEditPopup.closed) {
      posts.forEach((post, index) => {
        const newId = massEditPopup.document.getElementById(`mass_id_${index}`).value;
        const newPoste = massEditPopup.document.getElementById(`mass_poste_${index}`).value;
        const newPrimaria = massEditPopup.document.getElementById(`mass_primaria_${index}`).value;
        const newSecundaria = massEditPopup.document.getElementById(`mass_secundaria_${index}`).value;
        post.id = newId;
        post.poste = newPoste;
        post.primaria = newPrimaria;
        post.secundaria = newSecundaria;
        // Atualiza o conteúdo do tooltip, se houver marcador
        if (post.marker) {
          let tooltipContent = `<strong>${post.id}</strong><br>${post.poste}<br>${post.primaria}<br>${post.secundaria}`;
          if (post.distance) {
            tooltipContent += `<br><em>Distância: ${post.distance} m</em>`;
          }
          post.marker.setTooltipContent(tooltipContent);
        }
      });
      updateStatus("Alterações salvas via edição massiva.");
      updatePostsTable();
      salvarDadosNoLocalStorage(posts);
    }
  }

  function closeMassEditPopup() {
    if (massEditPopup) {
      massEditPopup.close();
      massEditPopup = null;
    }
  }

  document.getElementById("tabela_flutuante").addEventListener("click", openMassEditPopup);

  /********* Limpar Régua e Modais com Tecla ESC *********/
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      // Fecha o modal de cadastro/edição
      if (modalForm.style.display === "flex") {
        closeModalForm();
      }
      // Fecha o modal UTM
      if (modalUTM.style.display === "flex") {
        modalUTM.style.display = "none";
        clearUTMModalFields();
      }
      // Se estiver no modo "ruler" e houver régua ativa, limpa-a
      if (mode === "ruler" && rulerTempLine) {
        map.removeLayer(rulerTempLine);
        rulerTempLine = null;
        rulerStart = null;
        updateStatus("Régua limpa.");
      }
      // Opcional: também limpa a referência, se desejado
      selectedReference = null;
    }
  });
  // Define a projeção Polyconica para o Brasil com parâmetros baseados no datum SAD69
  proj4.defs("BR_poly", "+proj=poly +lat_0=0 +lon_0=-60 +x_0=0 +y_0=0 +datum=SAD69 +units=m +no_defs");

  /**
   * Converte coordenadas geográficas (latitude e longitude) para a projeção Polyconica do Brasil.
   *
   * @param {number} lat - Latitude em graus (EPSG:4326).
   * @param {number} lon - Longitude em graus (EPSG:4326).
   * @returns {Object} Um objeto com as propriedades { x, y } representando as coordenadas na projeção Polyconica.
   *
   * Exemplo de uso:
   *   const polyCoords = latLonParaPolyconica(-23.5505, -46.6333);
   *   console.log(polyCoords); // { x: <valor>, y: <valor> }
   */
  function latLonParaPolyconica(lat, lon) {
    // proj4 espera a ordem [lon, lat]
    const [x, y] = proj4("EPSG:4326", "BR_poly", [lon, lat]);
    return { x, y };
  }
  const coordPoly = latLonParaPolyconica(-17.722687, -48.587383);
  console.log("Coordenadas Polyconicas:", coordPoly.x, coordPoly.y);
