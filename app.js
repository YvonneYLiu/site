(function () {
  const data = window.SILKROAD_DATA;
  if (!data) return;

  const state = {
    lang: "zh",
    weeklyCountry: "china",
    dest: { country: "all", theme: "all", audience: "all" },
    atlas: { country: "all", theme: "all", audience: "all" },
    selectedRouteId: data.routes[0].id,
    selectedAttractionId: data.attractions[0].id,
    favorites: JSON.parse(localStorage.getItem("ylsl_fav_routes") || "[]")
  };

  const dom = {
    search: document.getElementById("globalSearch"),
    searchResult: document.getElementById("globalSearchResult"),
    featuredRoutes: document.getElementById("featuredRoutes"),
    weeklyTabs: document.getElementById("weeklyTabs"),
    weeklyCards: document.getElementById("weeklyCards"),
    culturePicks: document.getElementById("culturePicks"),
    partners: document.getElementById("partners"),
    destCountry: document.getElementById("destCountry"),
    destTheme: document.getElementById("destTheme"),
    destAudience: document.getElementById("destAudience"),
    destinationCards: document.getElementById("destinationCards"),
    destinationMap: document.getElementById("destinationMap"),
    routeCards: document.getElementById("routeCards"),
    routeDetail: document.getElementById("routeDetail"),
    atlasCountry: document.getElementById("atlasCountry"),
    atlasTheme: document.getElementById("atlasTheme"),
    atlasAudience: document.getElementById("atlasAudience"),
    atlasCards: document.getElementById("atlasCards"),
    atlasDetail: document.getElementById("atlasDetail"),
    aiMessages: document.getElementById("aiMessages"),
    aiMode: document.getElementById("aiMode"),
    aiLength: document.getElementById("aiLength"),
    aiDays: document.getElementById("aiDays"),
    aiFrom: document.getElementById("aiFrom"),
    aiPreference: document.getElementById("aiPreference"),
    aiInput: document.getElementById("aiInput"),
    aiSend: document.getElementById("aiSend"),
    serviceGrid: document.getElementById("serviceGrid"),
    auditBoard: document.getElementById("auditBoard")
  };

  const termDict = {
    文庙: {
      zh: "文庙是祭祀孔子并承载儒学教育的礼制空间，常与国子监/书院形成制度组合。",
      vi: "Văn Miếu là không gian thờ Khổng Tử gắn với giáo dục Nho học.",
      ko: "문묘는 공자를 제향하고 유학 교육을 수행하는 제도적 공간입니다."
    },
    书院: {
      zh: "书院是东亚儒学教学与学术共同体空间，兼具讲学、祭祀、藏书和地方教化功能。",
      vi: "Thư viện Nho học là nơi giảng dạy, học thuật và giáo hóa địa phương.",
      ko: "서원은 강학, 제향, 장서 기능을 함께 가진 유학 공동체 공간입니다."
    },
    祭孔: {
      zh: "祭孔是儒家礼仪实践，常用于连接国家礼制、地方教化与跨国文化认同。",
      vi: "Tế Khổng là thực hành nghi lễ Nho giáo, gắn với giáo hóa và bản sắc văn hóa.",
      ko: "제공은 유교 의례 실천으로 국가 의례와 지역 교화를 연결합니다."
    }
  };

  function t(key) {
    return data.i18n[state.lang][key] || data.i18n.zh[key] || key;
  }

  function localized(field) {
    if (!field) return { text: "", fallback: false };
    if (typeof field === "string") return { text: field, fallback: false };
    const now = field[state.lang];
    if (now && String(now).trim()) return { text: now, fallback: false };
    const zh = field.zh;
    if (zh && String(zh).trim()) return { text: zh, fallback: state.lang !== "zh" };
    const first = Object.values(field).find((v) => v && String(v).trim());
    return { text: first || "", fallback: true };
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function mapLabel(prefix, value) {
    return t(prefix + "_" + value) || value;
  }

  function setupLanguageButtons() {
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.lang = btn.dataset.lang;
        document.querySelectorAll(".lang-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        document.documentElement.lang = state.lang === "zh" ? "zh-CN" : state.lang;
        document.body.setAttribute("data-lang", state.lang);
        renderAll();
      });
    });
  }

  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    dom.search.placeholder = t("searchPlaceholder");
    dom.aiInput.placeholder = t("aiInputPlaceholder");
  }

  function setupScrollButtons() {
    document.querySelectorAll("[data-scroll]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = document.querySelector(btn.dataset.scroll);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function buildSelect(select, items, prefix) {
    const old = select.value;
    select.innerHTML = "";
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = t("filterAll");
    select.appendChild(all);
    items.forEach((item) => {
      const op = document.createElement("option");
      op.value = item;
      op.textContent = mapLabel(prefix, item);
      select.appendChild(op);
    });
    select.value = items.includes(old) || old === "all" ? old : "all";
  }

  function getAttractionById(id) {
    return data.attractions.find((a) => a.id === id);
  }

  function filterAttractions(filterState) {
    return data.attractions.filter((a) => {
      const okCountry = filterState.country === "all" || a.country === filterState.country;
      const okTheme = filterState.theme === "all" || a.themes.includes(filterState.theme);
      const okAudience = filterState.audience === "all" || a.audiences.includes(filterState.audience);
      return okCountry && okTheme && okAudience;
    });
  }

  function renderFeaturedRoutes() {
    const routes = data.routes.slice(0, 4);
    dom.featuredRoutes.innerHTML = routes
      .map((route) => {
        const title = localized(route.title);
        const highlight = localized(route.highlight);
        const tags = route.tags.map((tag) => `<span class="tag">${escapeHtml(mapLabel("theme", tag))}</span>`).join("");
        return `
          <article class="card">
            <div class="meta">${escapeHtml(t("routeDays"))}: ${route.days}</div>
            <h3>${escapeHtml(title.text)}</h3>
            <p>${escapeHtml(highlight.text)}</p>
            <div class="tag-row">${tags}</div>
            <button class="btn" data-open-route="${route.id}">${escapeHtml(t("viewDetail"))}</button>
          </article>
        `;
      })
      .join("");

    dom.featuredRoutes.querySelectorAll("[data-open-route]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selectedRouteId = btn.dataset.openRoute;
        renderRoutes();
        document.getElementById("routes").scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  function renderWeeklyTabs() {
    dom.weeklyTabs.innerHTML = data.countries
      .map((c) => {
        const active = state.weeklyCountry === c ? "active" : "";
        return `<button class="country-tab ${active}" data-weekly-country="${c}">${escapeHtml(mapLabel("country", c))}</button>`;
      })
      .join("");

    dom.weeklyTabs.querySelectorAll("[data-weekly-country]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.weeklyCountry = btn.dataset.weeklyCountry;
        renderWeeklyTabs();
        renderWeeklyCards();
      });
    });
  }

  function renderWeeklyCards() {
    const list = data.attractions.filter((a) => a.country === state.weeklyCountry).slice(0, 6);
    dom.weeklyCards.innerHTML = list.map((a) => attractionCard(a, true)).join("");
    wireAttractionCardActions(dom.weeklyCards);
  }

  function attractionCard(attraction, compact) {
    const name = localized(attraction.name);
    const summary = localized(attraction.summary);
    const fallback = name.fallback || summary.fallback;
    const tags = attraction.themes
      .slice(0, compact ? 2 : 3)
      .map((tag) => `<span class="tag">${escapeHtml(mapLabel("theme", tag))}</span>`)
      .join("");

    return `
      <article class="card ${state.selectedAttractionId === attraction.id ? "selected" : ""}">
        <div class="meta">${escapeHtml(mapLabel("country", attraction.country))} · ${escapeHtml(attraction.city)}</div>
        <h4>${escapeHtml(name.text)}</h4>
        <p>${escapeHtml(summary.text)}</p>
        <div class="tag-row">${tags}</div>
        ${fallback ? `<span class="fallback">${escapeHtml(t("fallbackNotice"))}</span>` : ""}
        <div class="tag-row">
          <button class="btn" data-open-attraction="${attraction.id}">${escapeHtml(t("viewDetail"))}</button>
          <button class="btn" data-ai-attraction="${attraction.id}">${escapeHtml(t("askAIWhy"))}</button>
        </div>
      </article>
    `;
  }

  function wireAttractionCardActions(root) {
    root.querySelectorAll("[data-open-attraction]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selectedAttractionId = btn.dataset.openAttraction;
        renderDestinations();
        renderAtlas();
      });
    });

    root.querySelectorAll("[data-ai-attraction]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selectedAttractionId = btn.dataset.aiAttraction;
        document.getElementById("ai").scrollIntoView({ behavior: "smooth" });
        const selected = getAttractionById(state.selectedAttractionId);
        if (selected) {
          const name = localized(selected.name).text;
          dom.aiInput.value = state.lang === "zh" ? `${name}为什么重要？` : name;
        }
      });
    });
  }

  function renderCulturePicks() {
    dom.culturePicks.innerHTML = data.culturePicks
      .map((pick) => {
        const title = localized(pick.title);
        const excerpt = localized(pick.excerpt);
        const fallback = title.fallback || excerpt.fallback;
        return `
          <article class="card">
            <h4>${escapeHtml(title.text)}</h4>
            <p>${escapeHtml(excerpt.text)}</p>
            ${fallback ? `<span class="fallback">${escapeHtml(t("fallbackNotice"))}</span>` : ""}
          </article>
        `;
      })
      .join("");
  }

  function renderPartners() {
    dom.partners.innerHTML = data.partners.map((p) => `<div class="partner-cell">${escapeHtml(p)}</div>`).join("");
  }

  function renderMap(canvas, list) {
    canvas.innerHTML = "";
    list.forEach((a) => {
      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "pin" + (a.id === state.selectedAttractionId ? " active" : "");
      pin.style.left = a.coords.x + "%";
      pin.style.top = a.coords.y + "%";
      pin.title = localized(a.name).text;
      pin.addEventListener("click", () => {
        state.selectedAttractionId = a.id;
        renderDestinations();
        renderAtlas();
      });
      canvas.appendChild(pin);
    });
  }

  function renderDestinations() {
    const list = filterAttractions(state.dest);
    if (!list.some((a) => a.id === state.selectedAttractionId) && list[0]) {
      state.selectedAttractionId = list[0].id;
    }
    dom.destinationCards.innerHTML = list.map((a) => attractionCard(a)).join("");
    wireAttractionCardActions(dom.destinationCards);
    renderMap(dom.destinationMap, list);
  }

  function routeCard(route) {
    const title = localized(route.title);
    const highlight = localized(route.highlight);
    const active = route.id === state.selectedRouteId ? " style='border-color:#b04a27'" : "";
    return `
      <article class="card"${active}>
        <div class="meta">${escapeHtml(t("routeDays"))}: ${route.days}</div>
        <h4>${escapeHtml(title.text)}</h4>
        <p>${escapeHtml(highlight.text)}</p>
        <div class="meta">${escapeHtml(t("routeCountries"))}: ${route.countries.map((c) => mapLabel("country", c)).join(" / ")}</div>
        <button class="btn" data-route-select="${route.id}">${escapeHtml(t("viewDetail"))}</button>
      </article>
    `;
  }

  function renderRoutes() {
    dom.routeCards.innerHTML = data.routes.map(routeCard).join("");
    dom.routeCards.querySelectorAll("[data-route-select]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selectedRouteId = btn.dataset.routeSelect;
        renderRoutes();
      });
    });

    const route = data.routes.find((r) => r.id === state.selectedRouteId) || data.routes[0];
    const title = localized(route.title);
    const highlight = localized(route.highlight);

    const stopHtml = route.stops
      .map((id, index) => {
        const a = getAttractionById(id);
        if (!a) return "";
        const n = localized(a.name).text;
        const s = localized(a.summary).text;
        return `<div class="timeline-step"><strong>D${index + 1}. ${escapeHtml(n)}</strong><br /><span>${escapeHtml(s)}</span></div>`;
      })
      .join("");

    dom.routeDetail.innerHTML = `
      <h3>${escapeHtml(title.text)}</h3>
      <p>${escapeHtml(highlight.text)}</p>
      <div class="detail-block">
        <h4>${escapeHtml(t("routeOverview"))}</h4>
        <p>${escapeHtml(t("routeCountries"))}: ${route.countries.map((c) => mapLabel("country", c)).join(" / ")} · ${escapeHtml(t("routeDays"))}: ${route.days}</p>
      </div>
      <div class="detail-block">
        <h4>${escapeHtml(t("routeStops"))}</h4>
        <div class="timeline">${stopHtml}</div>
      </div>
      <div class="tag-row" style="margin-top:12px;">
        <button class="btn btn-primary" id="routeGenerateBtn">${escapeHtml(t("routeGenerate"))}</button>
        <button class="btn" id="routeSaveBtn">${escapeHtml(t("routeSave"))}</button>
      </div>
    `;

    document.getElementById("routeGenerateBtn").addEventListener("click", () => {
      const lines = [];
      lines.push(localized(route.title).text + "\n");
      route.stops.forEach((id, idx) => {
        const a = getAttractionById(id);
        if (!a) return;
        lines.push(`${idx + 1}. ${localized(a.name).text}`);
        lines.push(`   ${localized(a.summary).text}`);
      });
      const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${route.id}.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    document.getElementById("routeSaveBtn").addEventListener("click", () => {
      if (!state.favorites.includes(route.id)) {
        state.favorites.push(route.id);
        localStorage.setItem("ylsl_fav_routes", JSON.stringify(state.favorites));
      }
      addBotMessage(state.lang === "zh" ? "已收藏该线路。" : state.lang === "vi" ? "Đã lưu tuyến này." : "해당 루트를 저장했습니다.");
    });
  }

  function atlasDetail(attraction) {
    if (!attraction) {
      dom.atlasDetail.innerHTML = "";
      return;
    }
    const name = localized(attraction.name);
    const summary = localized(attraction.summary);
    const core = localized(attraction.coreHighlights);
    const silk = localized(attraction.silkRoad);
    const policy = localized(attraction.policy);
    const fallback = name.fallback || summary.fallback || core.fallback || silk.fallback || policy.fallback;

    const links = attraction.links.length
      ? `<div class="detail-block"><h4>Links</h4>${attraction.links
          .map((l) => `<p><a href="${escapeHtml(l.url)}" target="_blank">${escapeHtml(l.label)}</a></p>`)
          .join("")}</div>`
      : "";

    dom.atlasDetail.innerHTML = `
      <h3>${escapeHtml(name.text)}</h3>
      <p>${escapeHtml(mapLabel("country", attraction.country))} · ${escapeHtml(attraction.region)} · ${escapeHtml(attraction.city)}</p>
      ${fallback ? `<span class="fallback">${escapeHtml(t("fallbackNotice"))}</span>` : ""}
      <div class="detail-block"><h4>${escapeHtml(t("routesTitle"))}</h4><p>${escapeHtml(summary.text)}</p></div>
      <div class="detail-block"><h4>Core</h4><p>${escapeHtml(core.text)}</p></div>
      <div class="detail-block"><h4>Silk Road</h4><p>${escapeHtml(silk.text)}</p></div>
      <div class="detail-block"><h4>Policy</h4><p>${escapeHtml(policy.text)}</p></div>
      ${links}
      <div class="tag-row" style="margin-top:10px;">
        <button class="btn" id="atlasAddRoute">${escapeHtml(t("addRoute"))}</button>
        <button class="btn" id="atlasAskAI">${escapeHtml(t("askAIWhy"))}</button>
      </div>
    `;

    document.getElementById("atlasAddRoute").addEventListener("click", () => {
      const hit = data.routes.find((r) => r.stops.includes(attraction.id));
      if (hit) {
        state.selectedRouteId = hit.id;
        renderRoutes();
        document.getElementById("routes").scrollIntoView({ behavior: "smooth" });
      }
    });

    document.getElementById("atlasAskAI").addEventListener("click", () => {
      document.getElementById("ai").scrollIntoView({ behavior: "smooth" });
      dom.aiInput.value = state.lang === "zh" ? `${name.text}为什么重要？` : name.text;
    });
  }

  function renderAtlas() {
    const list = filterAttractions(state.atlas);
    if (!list.some((a) => a.id === state.selectedAttractionId) && list[0]) {
      state.selectedAttractionId = list[0].id;
    }
    dom.atlasCards.innerHTML = list.map((a) => attractionCard(a)).join("");
    wireAttractionCardActions(dom.atlasCards);
    atlasDetail(getAttractionById(state.selectedAttractionId));
  }

  function setupSearch() {
    dom.search.addEventListener("input", () => {
      const q = dom.search.value.trim().toLowerCase();
      if (!q) {
        dom.searchResult.textContent = "";
        return;
      }

      const hits = data.attractions.filter((a) => {
        const n = localized(a.name).text.toLowerCase();
        const s = localized(a.summary).text.toLowerCase();
        const zhName = (a.name.zh || "").toLowerCase();
        return n.includes(q) || s.includes(q) || zhName.includes(q);
      });

      if (!hits.length) {
        dom.searchResult.textContent = state.lang === "zh" ? "未命中内容。" : state.lang === "vi" ? "Không có kết quả." : "검색 결과가 없습니다.";
        return;
      }

      dom.searchResult.innerHTML = hits
        .slice(0, 4)
        .map((a) => `<button class="btn" data-search-hit="${a.id}" style="margin:4px 4px 0 0;">${escapeHtml(localized(a.name).text)}</button>`)
        .join("");

      dom.searchResult.querySelectorAll("[data-search-hit]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.selectedAttractionId = btn.dataset.searchHit;
          renderDestinations();
          renderAtlas();
          document.getElementById("atlas").scrollIntoView({ behavior: "smooth" });
        });
      });
    });
  }

  function setupAIControls() {
    const modes = [
      ["qa", "aiModeQA"],
      ["explain", "aiModeExplain"],
      ["plan", "aiModePlan"],
      ["term", "aiModeTerm"]
    ];

    dom.aiMode.innerHTML = modes.map((m) => `<option value="${m[0]}">${escapeHtml(t(m[1]))}</option>`).join("");
    dom.aiLength.innerHTML = [
      ["short", "aiShort"],
      ["medium", "aiMedium"],
      ["long", "aiLong"]
    ]
      .map((m) => `<option value="${m[0]}">${escapeHtml(t(m[1]))}</option>`)
      .join("");

    dom.aiPreference.innerHTML = [
      ["deep", "aiPreferenceDeep"],
      ["easy", "aiPreferenceEasy"],
      ["study", "aiPreferenceStudy"]
    ]
      .map((m) => `<option value="${m[0]}">${escapeHtml(t(m[1]))}</option>`)
      .join("");
  }

  function addMessage(text, role) {
    const item = document.createElement("div");
    item.className = "msg " + role;
    item.textContent = text;
    dom.aiMessages.appendChild(item);
    dom.aiMessages.scrollTop = dom.aiMessages.scrollHeight;
  }

  function addBotMessage(text) {
    addMessage(text, "bot");
  }

  function aiPrefix() {
    if (state.lang === "vi") return "AI";
    if (state.lang === "ko") return "AI";
    return "AI";
  }

  function aiReplyQA(input) {
    const hit = data.attractions.find((a) => {
      const keys = [localized(a.name).text, a.name.zh || "", localized(a.summary).text].join(" ").toLowerCase();
      return keys.includes(input.toLowerCase());
    }) || getAttractionById(state.selectedAttractionId);

    if (!hit) {
      return state.lang === "zh" ? "我暂时没有匹配到条目，请换一个关键词。" : state.lang === "vi" ? "Chưa tìm thấy mục phù hợp, vui lòng đổi từ khóa." : "일치하는 항목을 찾지 못했습니다. 다른 키워드로 시도해 주세요.";
    }

    const name = localized(hit.name);
    const summary = localized(hit.summary);
    const silk = localized(hit.silkRoad);
    const notice = name.fallback || summary.fallback || silk.fallback ? `（${t("fallbackNotice")}）\n` : "";

    if (state.lang === "vi") {
      return `${notice}${name.text}\n- Tóm tắt: ${summary.text}\n- Liên hệ hải lộ: ${silk.text}`;
    }
    if (state.lang === "ko") {
      return `${notice}${name.text}\n- 요약: ${summary.text}\n- 해상실크로드 연계: ${silk.text}`;
    }
    return `${notice}${name.text}\n- 概要：${summary.text}\n- 丝路关联：${silk.text}`;
  }

  function aiReplyExplain() {
    const a = getAttractionById(state.selectedAttractionId);
    if (!a) return "";
    const name = localized(a.name).text;
    const core = localized(a.coreHighlights).text;
    const silk = localized(a.silkRoad).text;
    const duration = dom.aiLength.value;

    if (state.lang === "vi") {
      if (duration === "short") return `[30s] ${name}: ${core}`;
      if (duration === "medium") return `[2m] ${name}: ${core} Liên hệ tuyến biển: ${silk}`;
      return `[5m] ${name}: ${core} ${silk}`;
    }
    if (state.lang === "ko") {
      if (duration === "short") return `[30초] ${name}: ${core}`;
      if (duration === "medium") return `[2분] ${name}: ${core} 해상 연계: ${silk}`;
      return `[5분] ${name}: ${core} ${silk}`;
    }
    if (duration === "short") return `[30秒讲解] ${name}：${core}`;
    if (duration === "medium") return `[2分钟讲解] ${name}：${core} 丝路关联：${silk}`;
    return `[5分钟讲解] ${name}：${core} ${silk}`;
  }

  function aiReplyPlan() {
    const days = Number(dom.aiDays.value) || 5;
    const pref = dom.aiPreference.value;
    const sorted = data.routes
      .slice()
      .sort((a, b) => Math.abs(a.days - days) - Math.abs(b.days - days));
    const pick = sorted.find((r) => r.tags.includes(pref === "easy" ? "heritage" : pref === "study" ? "study" : "confucian")) || sorted[0];
    const stopNames = pick.stops.map((id) => localized(getAttractionById(id).name).text).join(" -> ");

    if (state.lang === "vi") {
      return `Gợi ý tuyến: ${localized(pick.title).text}\nSố ngày: ${pick.days}\nĐiểm dừng: ${stopNames}`;
    }
    if (state.lang === "ko") {
      return `추천 루트: ${localized(pick.title).text}\n일수: ${pick.days}일\n방문 순서: ${stopNames}`;
    }
    return `推荐线路：${localized(pick.title).text}\n天数：${pick.days} 天\n站点：${stopNames}`;
  }

  function aiReplyTerm(input) {
    const key = Object.keys(termDict).find((k) => input.includes(k)) || "文庙";
    const bag = termDict[key];
    return bag[state.lang] || bag.zh;
  }

  function setupAISend() {
    dom.aiSend.addEventListener("click", () => {
      const content = dom.aiInput.value.trim();
      const mode = dom.aiMode.value;
      if (!content && mode === "qa") return;
      addMessage(content || `[${dom.aiMode.options[dom.aiMode.selectedIndex].text}]`, "user");

      let reply = "";
      if (mode === "qa") reply = aiReplyQA(content);
      if (mode === "explain") reply = aiReplyExplain();
      if (mode === "plan") reply = aiReplyPlan();
      if (mode === "term") reply = aiReplyTerm(content);

      addBotMessage(`${aiPrefix()}: ${reply}`);
      dom.aiInput.value = "";
    });
  }

  function renderServices() {
    const rows = [
      ["serviceTicket", "开放时间/票价/官网/第三方购票（API预留）"],
      ["serviceTransport", "到达方式/站点信息/地图跳转（API预留）"],
      ["serviceHotel", "周边住宿推荐与价格聚合（API预留）"],
      ["serviceParking", "停车场位置/收费/空位（API预留）"]
    ];

    dom.serviceGrid.innerHTML = rows
      .map((r) => {
        const desc =
          state.lang === "zh"
            ? r[1]
            : state.lang === "vi"
              ? "Khung dữ liệu đã sẵn sàng, chờ kết nối API."
              : "데이터 프레임 준비 완료, API 연동 예정입니다.";
        return `
          <article class="service-card">
            <h3>${escapeHtml(t(r[0]))}</h3>
            <p>${escapeHtml(t("servicePlaceholder"))}</p>
            <p style="margin-top:6px;">${escapeHtml(desc)}</p>
          </article>
        `;
      })
      .join("");
  }

  function renderAudit() {
    const total = data.attractions.length;
    const fields = [
      ["name", "auditItemName"],
      ["summary", "auditItemSummary"],
      ["coreHighlights", "auditItemCore"],
      ["policy", "auditItemPolicy"]
    ];

    dom.auditBoard.innerHTML = fields
      .map(([field, key]) => {
        const ok = data.attractions.filter((a) => {
          const v = a[field];
          if (!v) return false;
          if (typeof v === "string") return true;
          return Boolean(v[state.lang] && String(v[state.lang]).trim());
        }).length;
        const rate = Math.round((ok / total) * 100);
        return `
          <div class="audit-row">
            <span>${escapeHtml(t(key))}</span>
            <div class="audit-bar"><div class="audit-fill" style="width:${rate}%"></div></div>
            <span>${rate}%</span>
          </div>
        `;
      })
      .join("");
  }

  function setSelectOptions() {
    buildSelect(dom.destCountry, data.countries, "country");
    buildSelect(dom.atlasCountry, data.countries, "country");
    buildSelect(dom.destTheme, data.themes, "theme");
    buildSelect(dom.atlasTheme, data.themes, "theme");
    buildSelect(dom.destAudience, data.audiences, "audience");
    buildSelect(dom.atlasAudience, data.audiences, "audience");

    dom.destCountry.value = state.dest.country;
    dom.atlasCountry.value = state.atlas.country;
    dom.destTheme.value = state.dest.theme;
    dom.atlasTheme.value = state.atlas.theme;
    dom.destAudience.value = state.dest.audience;
    dom.atlasAudience.value = state.atlas.audience;
  }

  function initScrollSpy() {
    const links = Array.from(document.querySelectorAll(".nav-link"));
    const sections = links.map((link) => document.querySelector(link.dataset.scroll)).filter(Boolean);

    const onScroll = () => {
      const y = window.scrollY + 120;
      let current = sections[0];
      sections.forEach((s) => {
        if (y >= s.offsetTop) current = s;
      });
      links.forEach((l) => {
        l.classList.toggle("active", l.dataset.scroll === "#" + current.id);
      });
    };

    window.addEventListener("scroll", onScroll);
    onScroll();
  }

  function renderAll() {
    applyI18n();
    setSelectOptions();
    renderFeaturedRoutes();
    renderWeeklyTabs();
    renderWeeklyCards();
    renderCulturePicks();
    renderPartners();
    renderDestinations();
    renderRoutes();
    renderAtlas();
    setupAIControls();
    renderServices();
    renderAudit();

    if (!dom.aiMessages.dataset.inited) {
      addBotMessage(
        state.lang === "zh"
          ? "你好，我是语联丝路 AI 助手。你可以问我景点意义、路线建议或术语解释。"
          : state.lang === "vi"
            ? "Xin chào, tôi là trợ lý AI của nền tảng. Bạn có thể hỏi về điểm đến, tuyến đường hoặc thuật ngữ."
            : "안녕하세요. 명소 의미, 루트 추천, 용어 해설을 도와드리겠습니다."
      );
      dom.aiMessages.dataset.inited = "1";
    }
  }

  function bindSelectSync() {
    [
      [dom.destCountry, "dest", "country"],
      [dom.destTheme, "dest", "theme"],
      [dom.destAudience, "dest", "audience"],
      [dom.atlasCountry, "atlas", "country"],
      [dom.atlasTheme, "atlas", "theme"],
      [dom.atlasAudience, "atlas", "audience"]
    ].forEach(([el, part, key]) => {
      el.addEventListener("change", () => {
        state[part][key] = el.value;
        if (part === "dest") renderDestinations();
        if (part === "atlas") renderAtlas();
      });
    });
  }

  setupLanguageButtons();
  setupScrollButtons();
  setupSearch();
  setupAISend();
  bindSelectSync();
  initScrollSpy();
  renderAll();
})();
