const postsUrl = "posts.json";

const els = {
  postIndex: document.getElementById("postIndex"),
  articleTitle: document.getElementById("articleTitle"),
  articleDate: document.getElementById("articleDate"),
  articleBody: document.getElementById("articleBody"),
  articleShell: document.getElementById("articleShell"),
  prevLink: document.getElementById("prevLink"),
  nextLink: document.getElementById("nextLink"),
  articleNav: document.getElementById("articleNav"),
  drawer: document.getElementById("postDrawer"),
  drawerBackdrop: document.getElementById("drawerBackdrop"),
  articlesToggle: document.getElementById("articlesToggle"),
};

let posts = [];
let currentSlug = "";
let lastFocused = null;

function parseHash() {
  const hash = window.location.hash || "";
  if (hash.startsWith("#/")) {
    return decodeURIComponent(hash.slice(2));
  }
  return "";
}

function setHash(slug) {
  if (parseHash() === slug) {
    loadPost(slug);
  } else {
    window.location.hash = `#/${slug}`;
  }
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC", // keep calendar date stable regardless of viewer timezone
  });
}

function closeDrawer() {
  els.drawer.classList.remove("open");
  els.drawerBackdrop.classList.remove("active");
  els.drawerBackdrop.hidden = true;
  els.articlesToggle.setAttribute("aria-expanded", "false");
  if (lastFocused) {
    lastFocused.focus();
  }
}

function openDrawer() {
  lastFocused = document.activeElement;
  els.drawer.classList.add("open");
  els.drawerBackdrop.classList.add("active");
  els.drawerBackdrop.hidden = false;
  els.articlesToggle.setAttribute("aria-expanded", "true");
  const firstLink = els.postIndex.querySelector("a");
  if (firstLink) {
    firstLink.focus();
  }
}

function buildIndex() {
  const frag = document.createDocumentFragment();
  posts.forEach((post) => {
    const link = document.createElement("a");
    link.className = "post-link";
    link.href = `#/` + post.slug;
    link.dataset.slug = post.slug;
    link.innerHTML = `
      <span class="title">${post.title}</span>
      <span class="meta">${formatDate(post.date)}</span>
    `;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      setHash(post.slug);
      if (window.innerWidth < 900) {
        closeDrawer();
      }
    });
    frag.appendChild(link);
  });

  els.postIndex.innerHTML = "";
  els.postIndex.appendChild(frag);
  els.drawer.classList.add("ready");
}

function setActiveLink(slug) {
  els.postIndex.querySelectorAll(".post-link").forEach((link) => {
    const isActive = link.dataset.slug === slug;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function updateNavLinks(idx) {
  const prev = posts[idx - 1];
  const next = posts[idx + 1];

  if (prev) {
    els.prevLink.href = `#/${prev.slug}`;
    els.prevLink.textContent = `← ${prev.title}`;
    els.prevLink.style.display = "";
  } else {
    els.prevLink.style.display = "none";
  }

  if (next) {
    els.nextLink.href = `#/${next.slug}`;
    els.nextLink.textContent = `${next.title} →`;
    els.nextLink.style.display = "";
  } else {
    els.nextLink.style.display = "none";
  }

  if (!prev && next) {
    els.articleNav.classList.add("no-prev");
  } else {
    els.articleNav.classList.remove("no-prev");
  }

  els.articleNav.style.display = prev || next ? "flex" : "none";
  if (next && !prev) {
    els.articleNav.style.display = "flex";
  }
}

async function loadPost(slug) {
  const target = posts.find((p) => p.slug === slug) || posts[0];
  if (!target) return;
  currentSlug = target.slug;
  setActiveLink(target.slug);

  try {
    const res = await fetch(target.htmlPath);
    if (!res.ok) throw new Error(`Failed to load ${target.htmlPath}`);
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const source = doc.querySelector("article") || doc.body;

    els.articleTitle.textContent = target.title;
    els.articleDate.textContent = formatDate(target.date);

    els.articleBody.innerHTML = "";
    Array.from(source.children).forEach((node) => {
      els.articleBody.appendChild(node.cloneNode(true));
    });

    const idx = posts.findIndex((p) => p.slug === target.slug);
    updateNavLinks(idx);
    els.articleShell.classList.add("ready");
  } catch (err) {
    els.articleTitle.textContent = "Unable to load article";
    els.articleBody.innerHTML = `<p class="lede">${err.message}</p>`;
  }
}

async function bootstrap() {
  try {
    const res = await fetch(postsUrl);
    posts = (await res.json()) || [];
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    buildIndex();

    const initialSlug = parseHash() || (posts[0] && posts[0].slug);
    if (initialSlug) {
      setHash(initialSlug);
    }
  } catch (err) {
    els.articleTitle.textContent = "Unable to load posts";
    els.articleBody.innerHTML = `<p class="lede">${err.message}</p>`;
  }
}

window.addEventListener("hashchange", () => {
  const slug = parseHash();
  if (slug) {
    loadPost(slug);
  }
});

els.articlesToggle.addEventListener("click", () => {
  const expanded = els.articlesToggle.getAttribute("aria-expanded") === "true";
  if (expanded) {
    closeDrawer();
  } else {
    openDrawer();
  }
});

els.drawerBackdrop.addEventListener("click", () => {
  closeDrawer();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && els.drawer.classList.contains("open")) {
    closeDrawer();
  }
});

bootstrap();
