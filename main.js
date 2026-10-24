(function () {
  "use strict";
  const W = window.WEDDING;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");

  // --- Text bindings (ẩn phần tử nếu trống) ---
  document.querySelectorAll("[data-bind]").forEach((el) => {
    const v = W[el.dataset.bind];
    if (v) el.textContent = v; else if (el.tagName === "P") el.hidden = true;
  });
  $("#hero-photo").src = W.heroPhoto;

  // Tên ở ảnh bìa: nếu xếp 1 hàng mà bị xuống dòng thì chuyển sang xếp dọc (♥ nằm giữa 2 tên)
  (() => {
    const box = $(".hero__names");
    const fit = () => {
      box.classList.remove("is-stacked");
      const [a, b] = box.querySelectorAll("span");
      if (a && b && Math.abs(a.offsetTop - b.offsetTop) > 4) box.classList.add("is-stacked");
    };
    fit();
    addEventListener("resize", fit);
    document.fonts?.ready.then(fit); // đo lại sau khi font Pacifico tải xong
  })();

  // --- Nhạc nền: tự phát, không nút ---
  // Trình duyệt chặn phát có tiếng khi khách chưa tương tác, nên: thử phát ngay,
  // nếu bị chặn thì phát ở lần chạm / cuộn / bấm phím đầu tiên.
  (() => {
    if (!W.musicFile) return;
    // File đã cắt sẵn từ đoạn hay → không cần tua, phát được ngay khi có vài giây dữ liệu
    const audio = Object.assign(new Audio(W.musicFile), { volume: 0.7, preload: "auto", loop: true });
    audio.setAttribute("playsinline", "");
    audio.load();

    let started = false, timer = 0;
    // Chỉ các sự kiện này mới được trình duyệt tính là "người dùng tương tác" (scroll thì không)
    const EVENTS = ["pointerdown", "touchstart", "click", "keydown"];
    const done = () => {
      started = true;
      clearInterval(timer);
      EVENTS.forEach((ev) => removeEventListener(ev, play, true));
    };
    const play = () => {
      if (started) return;
      const p = audio.play();
      if (p && p.then) p.then(done).catch(() => {}); else done();
    };
    // capture=true: bắt cả chạm vào nút/ảnh trong thiệp
    EVENTS.forEach((ev) => addEventListener(ev, play, { passive: true, capture: true }));
    // Thử phát ngay, rồi thử lại mỗi 3s (trình duyệt nào cho tự phát sẽ phát luôn)
    play();
    timer = setInterval(play, 3000);

    // Tạm dừng khi khách chuyển tab / tắt màn hình, mở lại thì phát tiếp
    document.addEventListener("visibilitychange", () => {
      if (!started) return;
      if (document.hidden) audio.pause(); else audio.play().catch(() => {});
    });
  })();

  // --- Story player: tự chạy từng cảnh như 1 clip ngắn ---
  (() => {
    const slides = [...document.querySelectorAll(".slide")];
    if (!slides.length) return;
    const bars = [...document.querySelectorAll(".player__bars span")];
    const toggle = $("#player-toggle");
    const DURATION = 5500;
    let idx = 0, playing = true, started = 0, elapsed = 0, raf = 0;
    // Đổi icon SVG play/pause (không dùng ký tự ❚❚ ▶ vì mỗi máy vẽ font khác nhau → lệch)
    const setIcon = (isPlaying) => {
      toggle.classList.toggle("is-paused", !isPlaying);
      toggle.setAttribute("aria-label", isPlaying ? "Tạm dừng" : "Phát");
    };

    const go = (i) => {
      slides[idx].classList.remove("is-active");
      slides[idx].setAttribute("aria-hidden", "true");
      idx = (i + slides.length) % slides.length;
      const s = slides[idx];
      // Reset animation trong cảnh để chạy lại từ đầu
      s.classList.remove("is-active"); void s.offsetWidth; s.classList.add("is-active");
      s.setAttribute("aria-hidden", "false");
      bars.forEach((b, j) => { b.classList.toggle("done", j < idx); b.firstChild.style.width = j < idx ? "100%" : "0"; });
      $("#player-no").textContent = `${idx + 1}/${slides.length}`;
      $("#player-title").textContent = s.dataset.title;
      $("#player-text").textContent = s.dataset.caption;
      const cap = $(".player__caption"); cap.classList.remove("swap"); void cap.offsetWidth; cap.classList.add("swap");
      elapsed = 0; started = performance.now();
    };
    const frame = (t) => {
      if (playing) {
        const p = Math.min(1, (elapsed + t - started) / DURATION);
        bars[idx].firstChild.style.width = `${p * 100}%`;
        if (p >= 1) go(idx + 1);
      }
      raf = requestAnimationFrame(frame);
    };
    const setPlaying = (v) => {
      if (v === playing) return;
      if (v) started = performance.now(); else elapsed += performance.now() - started;
      playing = v;
      setIcon(v);
    };

    $("#player").addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "prev") go(idx - 1);
      else if (act === "next") go(idx + 1);
      else if (act === "toggle") setPlaying(!playing);
    });
    let sx = 0;
    const stage = $(".player__stage");
    stage.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
    stage.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    });

    // Chỉ chạy khi người xem cuộn tới; tôn trọng reduced-motion
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    playing = false;
    go(0);
    setIcon(false);
    new IntersectionObserver(([en]) => { if (!reduce) setPlaying(en.isIntersecting); }, { threshold: 0.5 }).observe($("#player"));
    raf = requestAnimationFrame(frame);
  })();

  // --- Families ---
  const fam = (f, name) => `
    <h3>${esc(f.title)}</h3>
    ${f.father ? `<p>Ông ${esc(f.father)}</p>` : ""}
    ${f.mother ? `<p>Bà ${esc(f.mother)}</p>` : ""}
    ${f.place ? `<p class="place">${esc(f.place)}</p>` : ""}
    <p class="role">${esc(f.role)}</p>
    <p class="name">${esc(name)}</p>`;
  $("#family-groom").innerHTML = fam(W.groomFamily, W.groom);
  $("#family-bride").innerHTML = fam(W.brideFamily, W.bride);

  // --- Venue + map ---
  const v = W.venue;
  $("#venue-name").textContent = v.name;
  $("#venue-hall").textContent = v.hall; $("#venue-hall").hidden = !v.hall;
  $("#venue-address").textContent = v.address;
  const q = encodeURIComponent(`${v.mapQuery}, ${v.address}`);
  $("#venue-map").href = v.mapUrl || `https://www.google.com/maps/search/?api=1&query=${q}`;
  $("#map").src = `https://maps.google.com/maps?q=${q}&z=15&output=embed`;

  // --- Countdown ---
  const target = new Date(W.date).getTime();
  const tick = () => {
    const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    $("#cd-d").textContent = pad(Math.floor(s / 86400));
    $("#cd-h").textContent = pad(Math.floor((s % 86400) / 3600));
    $("#cd-m").textContent = pad(Math.floor((s % 3600) / 60));
    $("#cd-s").textContent = pad(s % 60);
  };
  tick(); setInterval(tick, 1000);

  // --- Calendar (Thứ 2 đầu tuần) ---
  (() => {
    const d = new Date(W.date), y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
    const first = (new Date(y, m, 1).getDay() + 6) % 7, total = new Date(y, m + 1, 0).getDate();
    let h = `<h3>Tháng ${m + 1} · ${y}</h3><div class="grid">`;
    ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].forEach((x) => (h += `<div class="dow">${x}</div>`));
    for (let i = 0; i < first; i++) h += "<div></div>";
    for (let i = 1; i <= total; i++) h += `<div class="day${i === day ? " is-wedding" : ""}">${i}</div>`;
    $("#calendar").innerHTML = h + "</div>";
  })();

  // --- Album + lightbox ---
  const photos = W.album.map((n) => `assets/photos/${n}.jpg`);
  $("#album").innerHTML = photos.map((src, i) =>
    `<button type="button" class="reveal" data-i="${i}" aria-label="Mở ảnh ${i + 1}"><img src="${src}" alt="Ảnh cưới ${i + 1}" loading="lazy"></button>`).join("");
  const lb = $("#lightbox"), lbImg = $("#lightbox-img");
  let cur = 0;
  const show = (i) => { cur = (i + photos.length) % photos.length; lbImg.src = photos[cur]; lbImg.alt = `Ảnh cưới ${cur + 1}`; };
  $("#album").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]");
    if (b) { show(+b.dataset.i); lb.showModal(); }
  });
  lb.addEventListener("click", (e) => {
    const a = e.target.dataset.lb;
    if (a === "close" || e.target === lb) lb.close();
    else if (a === "prev") show(cur - 1);
    else if (a === "next") show(cur + 1);
  });
  document.addEventListener("keydown", (e) => {
    if (!lb.open) return;
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  });
  let sx = 0;
  lb.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
  });

  // --- RSVP + lời chúc ---
  // Có rsvpEndpoint (/api/wishes) → lưu/đọc file wishes.json chung, mọi khách đều thấy.
  // API lỗi hoặc mở file trực tiếp (file://) → tạm lưu localStorage trên máy khách.
  const KEY = "wedding-wishes-vu-thao-nha-gai";
  const loadLocal = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  let current = [];
  // Lời chúc chạy dọc liên tục (kiểu bảng tin). Nhân đôi danh sách để vòng lặp liền mạch.
  const render = () => {
    const box = $("#wishes");
    const list = current.filter((w) => w.message);
    const item = (w) => `<li><b>${esc(w.name)}</b><span>${esc(w.message)}</span></li>`;
    box.hidden = !list.length;
    if (!list.length) { box.innerHTML = ""; return; }
    const html = list.map(item).join("");
    const running = list.length >= 3;
    box.classList.toggle("is-running", running);
    box.innerHTML = `<ul class="wishes__track">${html}${running ? html.replace(/<li>/g, '<li aria-hidden="true">') : ""}</ul>`;
    if (running) {
      // Tốc độ đều: khoảng 2.5s cho mỗi lời chúc
      box.querySelector(".wishes__track").style.animationDuration = `${list.length * 2.5}s`;
    }
  };
  const useApi = !!W.rsvpEndpoint && location.protocol.startsWith("http");
  const loadWishes = async () => {
    if (useApi) {
      try {
        const r = await fetch(W.rsvpEndpoint, { cache: "no-store" });
        if (r.ok) { current = (await r.json()).wishes || []; render(); return; }
      } catch { /* rơi xuống localStorage */ }
    }
    current = loadLocal().slice().reverse();
    render();
  };
  loadWishes();
  // Cập nhật lời chúc mới của khách khác mỗi 60s
  if (useApi) setInterval(() => { if (!document.hidden) loadWishes(); }, 60000);

  $("#rsvp").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target, btn = form.querySelector("button[type=submit]");
    const fd = new FormData(form);
    const entry = {
      name: fd.get("name").trim(), message: fd.get("message").trim(),
      attend: fd.get("attend"), website: fd.get("website") || ""
    };
    if (!entry.name) return;
    const st = $("#rsvp-status");
    st.textContent = "Đang gửi…"; btn.disabled = true;
    try {
      if (useApi) {
        const r = await fetch(W.rsvpEndpoint, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry),
        });
        if (!r.ok) throw new Error(String(r.status));
      } else {
        localStorage.setItem(KEY, JSON.stringify([...loadLocal(), entry]));
      }
    } catch {
      st.textContent = "Gửi chưa được, bạn thử lại sau ít phút nha."; btn.disabled = false; return;
    }
    btn.disabled = false;
    current = [{ name: entry.name, message: entry.message }, ...current];
    render(); form.reset();
    st.textContent = entry.attend === "yes" ? "Yay! Hẹn gặp bạn ngày vui nha 💕" : "Cảm ơn lời chúc của bạn nhiều lắm 💕";
  });

  // --- Hiện dần khi cuộn ---
  // threshold 0 + rootMargin: phần tử cao hơn màn hình (thẻ thiệp mời trên điện thoại) vẫn hiện.
  // Trước đây threshold .25 khiến khối cao > 4 màn hình không bao giờ hiện → khoảng hồng trống.
  const reveals = document.querySelectorAll(".reveal");
  const showAll = () => reveals.forEach((el) => el.classList.add("is-visible"));
  if (!("IntersectionObserver" in window)) showAll();
  else {
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
    }), { threshold: 0, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => io.observe(el));
  }
})();
