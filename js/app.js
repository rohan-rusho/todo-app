/* Todo App — add / complete / delete / filter, saved in localStorage. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  var addForm = $("add-form");
  var newTodoInput = $("new-todo");
  var todoList = $("todo-list");
  var emptyState = $("empty-state");
  var remainingEl = $("remaining");
  var clearCompletedBtn = $("clear-completed-btn");
  var clearAllBtn = $("clear-all-btn");
  var toastEl = $("toast");

  var STORAGE_KEY = "todo-app-todos-v1";
  var FILTER_KEY = "todo-app-filter-v1";
  var todos = [];
  var filter = "all";
  var toastTimer = null;
  var idCounter = 0;

  /* ---------- Pure helpers (also unit-tested in node) ---------- */
  function makeTodo(text, done, createdAt, id) {
    return { id: id, text: text, done: !!done, createdAt: createdAt || Date.now() };
  }

  function countRemaining(list) {
    return list.filter(function (t) { return !t.done; }).length;
  }

  function filterTodos(list, which) {
    if (which === "active") return list.filter(function (t) { return !t.done; });
    if (which === "done") return list.filter(function (t) { return t.done; });
    return list.slice();
  }

  function nextId() {
    idCounter += 1;
    return "t" + Date.now().toString(36) + "-" + idCounter;
  }

  /* ---------- Toast ---------- */
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }

  /* ---------- Storage ---------- */
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); } catch (e) { /* ignore */ }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) todos = parsed.filter(function (t) { return t && typeof t.text === "string" && t.id; });
      }
      var f = localStorage.getItem(FILTER_KEY);
      if (f === "all" || f === "active" || f === "done") filter = f;
    } catch (e) { todos = []; }
  }

  /* ---------- Rendering ---------- */
  function render() {
    var visible = filterTodos(todos, filter);
    todoList.innerHTML = "";
    emptyState.classList.toggle("hidden", visible.length > 0 || todos.length > 0);

    if (todos.length === 0) {
      emptyState.querySelector(".empty-title").textContent = "Nothing here yet";
      emptyState.querySelector(".empty-sub").textContent = "Add your first task above and press Enter.";
    } else if (visible.length === 0) {
      emptyState.querySelector(".empty-title").textContent = filter === "done" ? "No completed tasks" : "No active tasks";
      emptyState.querySelector(".empty-sub").textContent = filter === "done" ? "Finish something and it will show up here." : "All caught up — nice work!";
    }

    visible.forEach(function (todo) {
      var li = document.createElement("li");
      li.className = "todo-item" + (todo.done ? " done" : "");
      li.setAttribute("data-id", todo.id);

      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "toggle-btn";
      toggle.setAttribute("aria-label", todo.done ? "Mark as not done: " + todo.text : "Mark as done: " + todo.text);
      toggle.textContent = todo.done ? "✓" : "";
      toggle.addEventListener("click", function () { toggleTodo(todo.id); });

      var text = document.createElement("span");
      text.className = "todo-text";
      text.textContent = todo.text;
      text.title = "Double-click to edit";
      text.setAttribute("tabindex", "0");
      text.addEventListener("dblclick", function () { startEdit(li, todo); });
      text.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); startEdit(li, todo); }
      });

      var time = document.createElement("span");
      time.className = "todo-time";
      time.textContent = new Date(todo.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });

      var del = document.createElement("button");
      del.type = "button";
      del.className = "delete-btn";
      del.setAttribute("aria-label", "Delete task: " + todo.text);
      del.textContent = "✕";
      del.addEventListener("click", function () { deleteTodo(todo.id, li); });

      li.appendChild(toggle);
      li.appendChild(text);
      li.appendChild(time);
      li.appendChild(del);
      todoList.appendChild(li);
    });

    var remaining = countRemaining(todos);
    var total = todos.length;
    var doneCount = total - remaining;
    $("count-all").textContent = total;
    $("count-active").textContent = remaining;
    $("count-done").textContent = doneCount;

    if (total === 0) {
      remainingEl.textContent = "No tasks yet.";
    } else if (remaining === 0) {
      remainingEl.innerHTML = "All done! <strong>🎉 " + total + " of " + total + " tasks complete.</strong>";
    } else {
      remainingEl.innerHTML = "<strong>" + remaining + "</strong> of " + total + " remaining";
    }

    document.querySelectorAll(".filter-btn").forEach(function (b) {
      var active = b.getAttribute("data-filter") === filter;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  /* ---------- Actions ---------- */
  function addTodo(text) {
    var trimmed = text.trim();
    if (!trimmed) { showToast("Type a task first."); return; }
    todos.unshift(makeTodo(trimmed, false, Date.now(), nextId()));
    save();
    render();
  }

  function toggleTodo(id) {
    var todo = todos.find(function (t) { return t.id === id; });
    if (!todo) return;
    todo.done = !todo.done;
    save();
    render();
    if (todo.done && countRemaining(todos) === 0) showToast("All done! 🎉");
  }

  function deleteTodo(id, liEl) {
    var doDelete = function () {
      todos = todos.filter(function (t) { return t.id !== id; });
      save();
      render();
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !liEl) {
      doDelete();
      return;
    }
    liEl.classList.add("leaving");
    setTimeout(doDelete, 220);
  }

  function startEdit(li, todo) {
    var textEl = li.querySelector(".todo-text");
    var input = document.createElement("input");
    input.type = "text";
    input.className = "todo-edit";
    input.value = todo.text;
    input.maxLength = 200;
    input.setAttribute("aria-label", "Edit task");
    var committed = false;
    var commit = function () {
      if (committed) return;
      committed = true;
      var value = input.value.trim();
      if (value) { todo.text = value; save(); }
      render();
    };
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); commit(); }
      if (e.key === "Escape") { committed = true; render(); }
      e.stopPropagation();
    });
    input.addEventListener("blur", commit);
    textEl.replaceWith(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  /* ---------- Events ---------- */
  addForm.addEventListener("submit", function (e) {
    e.preventDefault();
    addTodo(newTodoInput.value);
    newTodoInput.value = "";
    newTodoInput.focus();
  });

  document.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      filter = btn.getAttribute("data-filter");
      try { localStorage.setItem(FILTER_KEY, filter); } catch (e) { /* ignore */ }
      render();
    });
  });

  clearCompletedBtn.addEventListener("click", function () {
    var doneCount = todos.length - countRemaining(todos);
    if (doneCount === 0) { showToast("No completed tasks to clear."); return; }
    todos = todos.filter(function (t) { return !t.done; });
    save();
    render();
    showToast("Cleared " + doneCount + " completed task" + (doneCount === 1 ? "" : "s") + ".");
  });

  clearAllBtn.addEventListener("click", function () {
    if (todos.length === 0) { showToast("Your list is already empty."); return; }
    todos = [];
    save();
    render();
    showToast("All tasks cleared.");
  });

  /* ---------- Header / nav / reveal ---------- */
  var header = $("site-header");
  window.addEventListener("scroll", function () {
    header.classList.toggle("scrolled", window.scrollY > 8);
  }, { passive: true });

  var navToggle = $("nav-toggle");
  var mobileMenu = $("mobile-menu");
  navToggle.addEventListener("click", function () {
    var open = mobileMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  mobileMenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { mobileMenu.classList.remove("open"); });
  });

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  $("year").textContent = new Date().getFullYear();

  /* ---------- Init ---------- */
  load();
  render();

  /* Expose pure helpers for node-based verification. */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { makeTodo: makeTodo, countRemaining: countRemaining, filterTodos: filterTodos };
  }
})();
