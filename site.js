(function () {
  var root = document.documentElement;
  var key = "jg-theme";

  function setHeaderHeight() {
    var header = document.querySelector("header.site");
    if (!header) return;
    root.style.setProperty("--header-h", header.offsetHeight + "px");
  }

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function bindThemeToggle() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(key, next); } catch (e) {}
    });
    try {
      var media = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function (e) {
        try { if (localStorage.getItem(key) != null) return; } catch (err) { return; }
        root.setAttribute("data-theme", e.matches ? "dark" : "light");
      };
      if (typeof media.addEventListener === "function") media.addEventListener("change", onChange);
      else if (typeof media.addListener === "function") media.addListener(onChange);
    } catch (e) {}
  }

  function showError(el, message) {
    el.setAttribute("aria-invalid", "true");
    var err = el.parentNode && el.parentNode.querySelector(".field-error");
    if (err) {
      err.hidden = false;
      err.textContent = message;
    }
  }

  function clearError(el) {
    el.removeAttribute("aria-invalid");
    var err = el.parentNode && el.parentNode.querySelector(".field-error");
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
  }

  function groupError(container, message) {
    var err = container.querySelector(".field-error");
    if (!err) return;
    err.hidden = !message;
    err.textContent = message || "";
  }

  function bindQuoteForm(form) {
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("[name='name']");
      var phone = form.querySelector("[name='phone']");
      var email = form.querySelector("[name='email']");
      var suburb = form.querySelector("[name='suburb']");
      var details = form.querySelector("[name='details']");
      var firstInvalid = null;
      [name, phone, email, suburb, details].forEach(function (el) {
        if (el) clearError(el);
      });
      function fail(el, msg) {
        showError(el, msg);
        if (!firstInvalid) firstInvalid = el;
      }
      if (!name.value.trim()) fail(name, "Enter your name.");
      if (!phone.value.replace(/\D/g, "").length) fail(phone, "Enter a phone number.");
      if (!email.value.trim() || email.value.indexOf("@") === -1) fail(email, "Enter an email address.");
      if (!suburb.value.trim()) fail(suburb, "Enter a suburb or address.");
      if (!details.value.trim()) fail(details, "Describe the work.");
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      form.hidden = true;
      var thanks = form.parentNode.querySelector(".thanks");
      if (thanks) {
        thanks.hidden = false;
        thanks.focus();
      }
    });
  }

  function brisbaneParts(date) {
    var fmt = new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Brisbane",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
    var parts = fmt.formatToParts(date);
    var out = {};
    parts.forEach(function (p) { out[p.type] = p.value; });
    return out;
  }

  function ymdInBrisbane(date) {
    var fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Australia/Brisbane",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    return fmt.format(date);
  }

  function bindBookForm(form) {
    if (!form) return;
    var days = form.querySelector("[data-days]");
    if (days) {
      var html = "";
      var selected = false;
      var todayIso = ymdInBrisbane(new Date());
      var bits = todayIso.split("-");
      for (var i = 0; i < 14; i++) {
        var d = new Date(Date.UTC(Number(bits[0]), Number(bits[1]) - 1, Number(bits[2]) + i, 12));
        var p = brisbaneParts(d);
        var iso = ymdInBrisbane(d);
        var weekend = p.weekday === "Sat" || p.weekday === "Sun";
        var check = !weekend && !selected;
        if (check) selected = true;
        html += '<label class="chip">' +
          '<input type="radio" name="day" value="' + iso + '" data-label="' +
          p.weekday + " " + p.day + " " + p.month + '"' +
          (weekend ? " disabled" : "") +
          (check ? " checked" : "") +
          ">" +
          '<span class="dow">' + p.weekday + "</span>" +
          '<span class="dom">' + p.day + "</span>" +
          '<span class="mon">' + p.month + "</span>" +
          "</label>";
      }
      days.innerHTML = html;
    }

    var summary = form.querySelector("[data-summary]");
    function updateSummary() {
      if (!summary) return;
      var day = form.querySelector("input[name='day']:checked");
      var time = form.querySelector("input[name='window']:checked");
      if (day && time) {
        summary.textContent = day.getAttribute("data-label") + ", " + time.value;
      } else if (day) {
        summary.textContent = day.getAttribute("data-label");
      } else {
        summary.textContent = "Choose a day and time";
      }
    }
    form.addEventListener("change", updateSummary);
    updateSummary();

    function radioKeys(groupName) {
      var inputs = Array.prototype.slice.call(form.querySelectorAll("input[name='" + groupName + "']"));
      inputs.forEach(function (input, index) {
        input.addEventListener("keydown", function (e) {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
          e.preventDefault();
          var enabled = inputs.filter(function (n) { return !n.disabled; });
          var current = enabled.indexOf(input);
          if (current < 0) return;
          var dir = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : -1;
          var next = enabled[(current + dir + enabled.length) % enabled.length];
          next.checked = true;
          next.focus();
          updateSummary();
        });
      });
    }
    radioKeys("day");
    radioKeys("window");
    radioKeys("job");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("[name='name']");
      var phone = form.querySelector("[name='phone']");
      var dayBox = form.querySelector("[data-day-error]");
      var timeBox = form.querySelector("[data-time-error]");
      var jobBox = form.querySelector("[data-job-error]");
      var firstInvalid = null;
      clearError(name);
      clearError(phone);
      groupError(dayBox, "");
      groupError(timeBox, "");
      groupError(jobBox, "");

      var day = form.querySelector("input[name='day']:checked");
      var time = form.querySelector("input[name='window']:checked");
      var job = form.querySelector("input[name='job']:checked");

      if (!day) {
        groupError(dayBox, "Choose a weekday.");
        if (!firstInvalid) firstInvalid = form.querySelector("input[name='day']:not(:disabled)");
      }
      if (!time) {
        groupError(timeBox, "Choose a time window.");
        if (!firstInvalid) firstInvalid = form.querySelector("input[name='window']");
      }
      if (!job) {
        groupError(jobBox, "Choose the type of work.");
        if (!firstInvalid) firstInvalid = form.querySelector("input[name='job']");
      }
      if (!name.value.trim()) {
        showError(name, "Enter your name.");
        if (!firstInvalid) firstInvalid = name;
      }
      if (!phone.value.replace(/\D/g, "").length) {
        showError(phone, "Enter a phone number.");
        if (!firstInvalid) firstInvalid = phone;
      }
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      form.hidden = true;
      var thanks = form.parentNode.querySelector(".thanks");
      if (thanks) {
        thanks.hidden = false;
        thanks.focus();
      }
    });
  }

  function bindLightbox() {
    var box = document.getElementById("lightbox");
    if (!box) return;
    var img = box.querySelector(".lightbox-img");
    var cap = box.querySelector(".lightbox-caption");
    var count = box.querySelector(".lightbox-count");
    var btnClose = box.querySelector(".lightbox-close");
    var btnPrev = box.querySelector(".lightbox-prev");
    var btnNext = box.querySelector(".lightbox-next");
    var links = Array.prototype.slice.call(document.querySelectorAll("a.photo-link"));
    var index = 0;
    var lastFocus = null;
    var startX = 0;
    var startY = 0;

    function show(i) {
      if (!links.length) return;
      index = (i + links.length) % links.length;
      var a = links[index];
      img.src = a.getAttribute("href");
      img.alt = a.querySelector("img") ? a.querySelector("img").alt : "";
      cap.textContent = a.getAttribute("data-caption") || img.alt;
      count.textContent = (index + 1) + " / " + links.length;
      var many = links.length > 1;
      btnPrev.hidden = !many;
      btnNext.hidden = !many;
    }

    function open(i) {
      lastFocus = document.activeElement;
      box.hidden = false;
      document.body.classList.add("lb-lock");
      show(i);
      btnClose.focus();
    }

    function close() {
      box.hidden = true;
      document.body.classList.remove("lb-lock");
      img.removeAttribute("src");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    links.forEach(function (a, i) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        open(i);
      });
    });
    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { show(index - 1); });
    btnNext.addEventListener("click", function () { show(index + 1); });
    box.addEventListener("click", function (e) {
      if (e.target === box) close();
    });
    document.addEventListener("keydown", function (e) {
      if (box.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
      if (e.key === "Tab") {
        var focusable = [btnClose, btnPrev, btnNext].filter(function (el) { return el && !el.hidden; });
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    box.addEventListener("touchstart", function (e) {
      if (!e.changedTouches[0]) return;
      startX = e.changedTouches[0].clientX;
      startY = e.changedTouches[0].clientY;
    }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (!e.changedTouches[0]) return;
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 40 && Math.abs(dy) < 40) return;
      if (Math.abs(dy) > Math.abs(dx) && dy > 60) close();
      else if (dx > 60) show(index - 1);
      else if (dx < -60) show(index + 1);
    });
  }

  function ready() {
    setHeaderHeight();
    window.addEventListener("resize", setHeaderHeight);
    if (window.ResizeObserver) {
      var header = document.querySelector("header.site");
      if (header) new ResizeObserver(setHeaderHeight).observe(header);
    }
    bindThemeToggle();
    document.querySelectorAll("form[data-quote]").forEach(bindQuoteForm);
    document.querySelectorAll("form[data-book]").forEach(bindBookForm);
    bindLightbox();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
