(function () {
  const data = window.ACHECAR_BLOG_DATA;
  const app = document.getElementById("blog-app");

  if (!data || !app) {
    return;
  }

  const posts = (data.posts || []).slice();
  const categories = data.categories || [];
  const tags = data.tags || [];
  const authors = data.authors || [];

  const pageType = app.dataset.pageType || "home";
  const currentPath = normalizePath(window.location.pathname);

  const defaultFilters = {
    search: "",
    category: app.dataset.categorySlug || "",
    tag: app.dataset.tagSlug || "",
    author: app.dataset.authorSlug || "",
    date: ""
  };

  const urlParams = new URLSearchParams(window.location.search);

  const filters = {
    search: (urlParams.get("search") || defaultFilters.search).trim(),
    category: (urlParams.get("category") || defaultFilters.category).trim(),
    tag: (urlParams.get("tag") || defaultFilters.tag).trim(),
    author: (urlParams.get("author") || defaultFilters.author).trim(),
    date: (urlParams.get("date") || defaultFilters.date).trim()
  };

  if (pageType === "category" && app.dataset.categorySlug) {
    filters.category = app.dataset.categorySlug;
  }
  if (pageType === "tag" && app.dataset.tagSlug) {
    filters.tag = app.dataset.tagSlug;
  }
  if (pageType === "author" && app.dataset.authorSlug) {
    filters.author = app.dataset.authorSlug;
  }

  const pageFromPath = pageType === "home" ? getPageFromPath(currentPath) : null;
  const initialPage = Number(urlParams.get("page") || app.dataset.pageNumber || pageFromPath || 1);

  renderPage({
    pageType,
    filters,
    page: Number.isFinite(initialPage) ? initialPage : 1,
    postSlug: app.dataset.postSlug || ""
  });

  bindGlobalEvents();

  function renderPage(state) {
    if (state.pageType === "post") {
      renderPostPage(state.postSlug);
      return;
    }

    if (state.pageType === "category-hub") {
      renderCategoryHub();
      return;
    }

    if (state.pageType === "tag-hub") {
      renderTagHub();
      return;
    }

    if (state.pageType === "author-hub") {
      renderAuthorHub();
      return;
    }

    if (state.pageType === "category") {
      renderListingPage({
        title: getCategoryName(state.filters.category) || "Categoria",
        description: getCategoryDescription(state.filters.category),
        breadcrumb: [
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog/" },
          { label: "Categorias", href: "/blog/categoria/" },
          { label: getCategoryName(state.filters.category) || "Categoria" }
        ],
        filters: state.filters,
        page: state.page,
        basePath: currentPath,
        showCategoryFilter: false,
        showTagFilter: true,
        showAuthorFilter: true,
        sectionId: "categoria"
      });
      return;
    }

    if (state.pageType === "tag") {
      renderListingPage({
        title: "Tag: " + (getTagName(state.filters.tag) || "Tema"),
        description:
          "Artigos relacionados a " +
          (getTagName(state.filters.tag) || "esta tag") +
          " para acelerar sua pesquisa.",
        breadcrumb: [
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog/" },
          { label: "Tags", href: "/blog/tag/" },
          { label: getTagName(state.filters.tag) || "Tag" }
        ],
        filters: state.filters,
        page: state.page,
        basePath: currentPath,
        showCategoryFilter: true,
        showTagFilter: false,
        showAuthorFilter: true,
        sectionId: "tag"
      });
      return;
    }

    if (state.pageType === "author") {
      renderAuthorPage(state.filters.author, state.filters, state.page);
      return;
    }

    renderHomePage(state.filters, state.page);
  }

  function renderHomePage(activeFilters, page) {
    const highlighted = sortPosts(posts.filter((post) => post.featured)).slice(0, 3);
    const filtered = applyFilters(sortPosts(posts), activeFilters);
    const pagination = paginate(filtered, page, 6);

    const hasFilters = hasActiveFilters(activeFilters);
    const listingTitle = hasFilters ? "Resultados da busca" : "Ultimos artigos";
    const listingDescription = hasFilters
      ? `${filtered.length} conteudo(s) encontrado(s) com os filtros aplicados.`
      : "Atualizacoes recentes para compra, venda e negociacao de veiculos.";

    const categorySections = categories
      .map((category) => {
        const categoryPosts = sortPosts(
          posts.filter((post) => post.category === category.slug)
        ).slice(0, 2);
        if (!categoryPosts.length) return "";

        return `
          <section class="blog-section" aria-labelledby="cat-${category.slug}">
            <div class="blog-section-header">
              <h2 id="cat-${category.slug}">${escapeHtml(category.name)}</h2>
              <a class="blog-inline-link" href="${categoryUrl(category.slug)}">Ver todos</a>
            </div>
            <div class="blog-post-grid">${categoryPosts.map((post) => renderPostCard(post)).join("")}</div>
          </section>
        `;
      })
      .join("");

    app.innerHTML = `
      <section class="page-hero">
        <div class="container page-hero-inner blog-hero-card">
          ${renderBreadcrumb([
            { label: "Home", href: "/" },
            { label: "Blog" }
          ])}
          <h1>Conteudo que transforma consulta em decisao segura.</h1>
          <p class="lead">Guias praticos, insights de mercado e frameworks para reduzir risco na compra e acelerar conversao na venda.</p>
          <div class="blog-hero-cta">
            <a class="btn btn-primary" href="/consulta-gratuita">Consultar placa</a>
            <a class="btn btn-ghost" href="/blog/categoria/">Explorar categorias</a>
          </div>
        </div>
      </section>

      <section class="section blog-search-wrap" data-cv>
        <div class="container">
          ${renderSearchForm(activeFilters, {
            action: "/blog",
            showCategoryFilter: true,
            showTagFilter: true,
            showAuthorFilter: true,
            title: "Busque no blog",
            description: "Use busca e filtros por categoria, tag, autor e data."
          })}
        </div>
      </section>

      <section class="section" data-cv>
        <div class="container">
          <div class="blog-section-header">
            <h2>Destaques</h2>
            <p>Conteudo com melhor desempenho de leitura e aplicacao pratica.</p>
          </div>
          <div class="blog-post-grid blog-post-grid-featured">
            ${highlighted.map((post) => renderPostCard(post, { featured: true })).join("")}
          </div>
        </div>
      </section>

      <section class="section alt" data-cv>
        <div class="container">
          <div class="blog-section-header">
            <h2>Categorias</h2>
            <p>Navegue pela trilha que melhor combina com o momento da sua negociacao.</p>
          </div>
          <div class="blog-category-grid">
            ${categories
              .map((category) => {
                const count = posts.filter((post) => post.category === category.slug).length;
                return `
                  <article class="blog-category-card">
                    <h3>${escapeHtml(category.name)}</h3>
                    <p>${escapeHtml(category.description)}</p>
                    <div class="blog-category-meta">
                      <span>${count} artigo(s)</span>
                      <a class="btn btn-secondary" href="${categoryUrl(category.slug)}">Abrir categoria</a>
                    </div>
                  </article>
                `;
              })
              .join("")}
          </div>
        </div>
      </section>

      <section class="section" data-cv>
        <div class="container">
          <div class="blog-section-header">
            <h2>${listingTitle}</h2>
            <p>${listingDescription}</p>
          </div>
          <div class="blog-post-grid">${pagination.items.map((post) => renderPostCard(post)).join("")}</div>
          ${renderPagination(pagination, activeFilters, "/blog/")}
        </div>
      </section>

      ${categorySections}

      <section class="section alt" data-cv>
        <div class="container blog-newsletter-grid">
          ${renderNewsletterCard()}
          ${renderMainCtaCard()}
        </div>
      </section>
    `;

    const canonicalHome = hasFilters
      ? "https://www.achecar.com.br/blog/"
      : pagination.currentPage > 1
        ? `https://www.achecar.com.br/blog/pagina/${pagination.currentPage}/`
        : "https://www.achecar.com.br/blog/";

    const homeTitle =
      !hasFilters && pagination.currentPage > 1
        ? `Blog Achecar | Pagina ${pagination.currentPage}`
        : "Blog Achecar";

    setCollectionMeta({
      title: homeTitle,
      description: "Guia completo para compra, venda e mercado automotivo.",
      canonical: canonicalHome
    });

    injectStructuredData([
      buildBlogSchema(),
      buildBreadcrumbSchema([
        { name: "Home", url: "https://www.achecar.com.br/" },
        { name: "Blog", url: "https://www.achecar.com.br/blog/" }
      ])
    ]);
  }

  function renderListingPage(config) {
    const filtered = applyFilters(sortPosts(posts), config.filters);
    const pagination = paginate(filtered, config.page, 6);

    const title = config.title;
    const description = config.description;

    app.innerHTML = `
      <section class="page-hero">
        <div class="container page-hero-inner blog-hero-card">
          ${renderBreadcrumb(config.breadcrumb)}
          <h1>${escapeHtml(title)}</h1>
          <p class="lead">${escapeHtml(description || "")}</p>
        </div>
      </section>

      <section class="section blog-search-wrap" data-cv>
        <div class="container">
          ${renderSearchForm(config.filters, {
            action: config.basePath,
            showCategoryFilter: config.showCategoryFilter,
            showTagFilter: config.showTagFilter,
            showAuthorFilter: config.showAuthorFilter,
            title: "Refinar conteudo",
            description: "Combine busca e filtros para localizar o artigo certo."
          })}
        </div>
      </section>

      <section class="section" data-cv>
        <div class="container">
          <div class="blog-section-header">
            <h2>Artigos da secao</h2>
            <p>${filtered.length} resultado(s) encontrado(s).</p>
          </div>
          <div class="blog-post-grid">${pagination.items.map((post) => renderPostCard(post)).join("")}</div>
          ${renderPagination(pagination, config.filters, config.basePath)}
        </div>
      </section>

      <section class="section alt" data-cv>
        <div class="container blog-newsletter-grid">
          ${renderNewsletterCard()}
          ${renderMainCtaCard()}
        </div>
      </section>
    `;

    setCollectionMeta({
      title,
      description,
      canonical: "https://www.achecar.com.br" + normalizePath(config.basePath)
    });

    injectStructuredData([
      buildBlogSchema(),
      buildBreadcrumbSchema(
        config.breadcrumb.map((item) => ({
          name: item.label,
          url: item.href ? "https://www.achecar.com.br" + normalizePath(item.href) : undefined
        }))
      )
    ]);
  }

  function renderCategoryHub() {
    const cards = categories
      .map((category) => {
        const count = posts.filter((post) => post.category === category.slug).length;
        return `
          <article class="blog-category-card">
            <h2>${escapeHtml(category.name)}</h2>
            <p>${escapeHtml(category.description)}</p>
            <div class="blog-category-meta">
              <span>${count} artigo(s)</span>
              <a class="btn btn-secondary" href="${categoryUrl(category.slug)}">Abrir categoria</a>
            </div>
          </article>
        `;
      })
      .join("");

    app.innerHTML = `
      <section class="page-hero">
        <div class="container page-hero-inner blog-hero-card">
          ${renderBreadcrumb([
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog/" },
            { label: "Categorias" }
          ])}
          <h1>Categorias do blog</h1>
          <p class="lead">Escolha a trilha de aprendizado por objetivo: compra segura, venda inteligente ou mercado auto.</p>
        </div>
      </section>

      <section class="section" data-cv>
        <div class="container">
          <div class="blog-category-grid">${cards}</div>
        </div>
      </section>
    `;

    setCollectionMeta({
      title: "Categorias do blog Achecar",
      description: "Navegue por categorias de compra, venda e mercado.",
      canonical: "https://www.achecar.com.br/blog/categoria/"
    });

    injectStructuredData([
      buildBlogSchema(),
      buildBreadcrumbSchema([
        { name: "Home", url: "https://www.achecar.com.br/" },
        { name: "Blog", url: "https://www.achecar.com.br/blog/" },
        { name: "Categorias", url: "https://www.achecar.com.br/blog/categoria/" }
      ])
    ]);
  }

  function renderTagHub() {
    const cards = tags
      .map((tag) => {
        const count = posts.filter((post) => post.tags.indexOf(tag.slug) >= 0).length;
        return `
          <article class="blog-tag-card">
            <h2>${escapeHtml(tag.name)}</h2>
            <p>Conteudo relacionado ao tema ${escapeHtml(tag.name.toLowerCase())}.</p>
            <div class="blog-category-meta">
              <span>${count} artigo(s)</span>
              <a class="btn btn-secondary" href="${tagUrl(tag.slug)}">Abrir tag</a>
            </div>
          </article>
        `;
      })
      .join("");

    app.innerHTML = `
      <section class="page-hero">
        <div class="container page-hero-inner blog-hero-card">
          ${renderBreadcrumb([
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog/" },
            { label: "Tags" }
          ])}
          <h1>Tags do blog</h1>
          <p class="lead">Localize artigos por assunto e monte uma trilha de leitura sob demanda.</p>
        </div>
      </section>

      <section class="section" data-cv>
        <div class="container">
          <div class="blog-tag-grid">${cards}</div>
        </div>
      </section>
    `;

    setCollectionMeta({
      title: "Tags do blog Achecar",
      description: "Acesse os artigos por palavra-chave.",
      canonical: "https://www.achecar.com.br/blog/tag/"
    });

    injectStructuredData([
      buildBlogSchema(),
      buildBreadcrumbSchema([
        { name: "Home", url: "https://www.achecar.com.br/" },
        { name: "Blog", url: "https://www.achecar.com.br/blog/" },
        { name: "Tags", url: "https://www.achecar.com.br/blog/tag/" }
      ])
    ]);
  }

  function renderAuthorHub() {
    const cards = authors
      .map((author) => {
        const count = posts.filter((post) => post.author === author.slug).length;
        return `
          <article class="blog-author-card">
            <img src="${escapeAttribute(author.photo)}" alt="${escapeAttribute(author.name)}" loading="lazy" decoding="async" />
            <div>
              <h2>${escapeHtml(author.name)}</h2>
              <p class="blog-author-role">${escapeHtml(author.role)}</p>
              <p>${escapeHtml(author.bio)}</p>
              <div class="blog-category-meta">
                <span>${count} artigo(s)</span>
                <a class="btn btn-secondary" href="${authorUrl(author.slug)}">Ver artigos</a>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    app.innerHTML = `
      <section class="page-hero">
        <div class="container page-hero-inner blog-hero-card">
          ${renderBreadcrumb([
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog/" },
            { label: "Autores" }
          ])}
          <h1>Autores do blog</h1>
          <p class="lead">Especialistas que produzem conteudo tecnico para compra, venda e mercado automotivo.</p>
        </div>
      </section>

      <section class="section" data-cv>
        <div class="container blog-author-grid">${cards}</div>
      </section>
    `;

    setCollectionMeta({
      title: "Autores do blog Achecar",
      description: "Conheca os especialistas que escrevem no blog.",
      canonical: "https://www.achecar.com.br/blog/autor/"
    });

    injectStructuredData([
      buildBlogSchema(),
      buildBreadcrumbSchema([
        { name: "Home", url: "https://www.achecar.com.br/" },
        { name: "Blog", url: "https://www.achecar.com.br/blog/" },
        { name: "Autores", url: "https://www.achecar.com.br/blog/autor/" }
      ])
    ]);
  }

  function renderAuthorPage(authorSlug, activeFilters, page) {
    const author = getAuthor(authorSlug);
    const fallback = "Autor";

    if (!author) {
      app.innerHTML = renderNotFound("Autor nao encontrado", "/blog/autor/");
      return;
    }

    const localFilters = Object.assign({}, activeFilters, { author: authorSlug });
    const filtered = applyFilters(sortPosts(posts), localFilters);
    const pagination = paginate(filtered, page, 6);

    app.innerHTML = `
      <section class="page-hero">
        <div class="container page-hero-inner blog-hero-card">
          ${renderBreadcrumb([
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog/" },
            { label: "Autores", href: "/blog/autor/" },
            { label: author.name || fallback }
          ])}
          <div class="blog-author-hero">
            <img src="${escapeAttribute(author.photo)}" alt="${escapeAttribute(author.name)}" loading="lazy" decoding="async" />
            <div>
              <h1>${escapeHtml(author.name || fallback)}</h1>
              <p class="blog-author-role">${escapeHtml(author.role || "")}</p>
              <p class="lead">${escapeHtml(author.bio || "")}</p>
              <div class="blog-social-links">
                ${renderAuthorSocialLinks(author)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section blog-search-wrap" data-cv>
        <div class="container">
          ${renderSearchForm(localFilters, {
            action: currentPath,
            showCategoryFilter: true,
            showTagFilter: true,
            showAuthorFilter: false,
            title: "Refinar artigos do autor",
            description: "Filtre por categoria, tag e data."
          })}
        </div>
      </section>

      <section class="section" data-cv>
        <div class="container">
          <div class="blog-section-header">
            <h2>Artigos publicados</h2>
            <p>${filtered.length} resultado(s) para ${escapeHtml(author.name)}.</p>
          </div>
          <div class="blog-post-grid">${pagination.items.map((post) => renderPostCard(post)).join("")}</div>
          ${renderPagination(pagination, localFilters, currentPath)}
        </div>
      </section>

      <section class="section alt" data-cv>
        <div class="container blog-newsletter-grid">
          ${renderNewsletterCard()}
          ${renderMainCtaCard()}
        </div>
      </section>
    `;

    setCollectionMeta({
      title: author.name + " | Autor do blog Achecar",
      description: author.bio,
      canonical: "https://www.achecar.com.br" + authorUrl(author.slug)
    });

    injectStructuredData([
      buildBlogSchema(),
      buildAuthorSchema(author),
      buildBreadcrumbSchema([
        { name: "Home", url: "https://www.achecar.com.br/" },
        { name: "Blog", url: "https://www.achecar.com.br/blog/" },
        { name: "Autores", url: "https://www.achecar.com.br/blog/autor/" },
        { name: author.name, url: "https://www.achecar.com.br" + authorUrl(author.slug) }
      ])
    ]);
  }

  function renderPostPage(postSlug) {
    const post = getPost(postSlug);

    if (!post) {
      app.innerHTML = renderNotFound("Artigo nao encontrado", "/blog/");
      return;
    }

    const category = getCategory(post.category);
    const author = getAuthor(post.author);
    const related = getRelatedPosts(post, 3);

    app.innerHTML = `
      <section class="page-hero">
        <div class="container page-hero-inner blog-hero-card">
          ${renderBreadcrumb([
            { label: "Home", href: "/" },
            { label: "Blog", href: "/blog/" },
            { label: category ? category.name : "Categoria", href: category ? categoryUrl(category.slug) : "/blog/categoria/" },
            { label: post.title }
          ])}
          <p class="blog-post-category"><a href="${category ? categoryUrl(category.slug) : "/blog/categoria/"}">${escapeHtml(category ? category.name : "Categoria")}</a></p>
          <h1>${escapeHtml(post.title)}</h1>
          <p class="lead">${escapeHtml(post.summary)}</p>
          <div class="blog-post-meta">
            <a href="${author ? authorUrl(author.slug) : "/blog/autor/"}">${escapeHtml(author ? author.name : "Equipe Achecar")}</a>
            <span>${formatDate(post.publishedAt)}</span>
            <span>${post.readingTime} min de leitura</span>
            <span>Atualizado em ${formatDate(post.updatedAt || post.publishedAt)}</span>
          </div>
        </div>
      </section>

      <section class="section blog-post-section" data-cv>
        <div class="container blog-post-container">
          <article class="blog-post-article">
            <figure class="blog-post-hero-image">
              <img src="${escapeAttribute(post.heroImage)}" alt="${escapeAttribute(post.title)}" loading="eager" decoding="async" />
            </figure>
            <p class="blog-post-intro">${escapeHtml(post.content)}</p>
            ${renderPostBlocks(post.blocks || [])}
          </article>

          <aside class="blog-post-aside">
            <section class="blog-post-share" aria-label="Compartilhar artigo">
              <h2>Compartilhar</h2>
              ${renderShareLinks(post)}
            </section>
            <section class="blog-post-tags" aria-label="Tags do artigo">
              <h2>Tags</h2>
              <div class="blog-tag-list">
                ${post.tags.map((tagSlug) => `<a class="pill" href="${tagUrl(tagSlug)}">${escapeHtml(getTagName(tagSlug) || tagSlug)}</a>`).join("")}
              </div>
            </section>
          </aside>
        </div>
      </section>

      <section class="section" data-cv>
        <div class="container">
          ${renderPostCta(post)}
        </div>
      </section>

      <section class="section alt" data-cv>
        <div class="container">
          <div class="blog-section-header">
            <h2>Posts relacionados</h2>
            <p>Selecao baseada em categoria, tags similares e popularidade.</p>
          </div>
          <div class="blog-post-grid">${related.map((item) => renderPostCard(item)).join("")}</div>
        </div>
      </section>

      <section class="section" data-cv>
        <div class="container blog-newsletter-grid">
          ${renderNewsletterCard()}
          <section class="blog-comments-card" aria-labelledby="comments-title">
            <h2 id="comments-title">Comentarios</h2>
            <p>Compartilhe sua duvida ou experiencia. A equipe modera os comentarios diariamente.</p>
            <form class="blog-comment-form" data-comment-form>
              <label for="comment-name">Nome</label>
              <input id="comment-name" class="input" name="name" required />
              <label for="comment-email">E-mail</label>
              <input id="comment-email" class="input" type="email" name="email" required />
              <label for="comment-text">Comentario</label>
              <textarea id="comment-text" class="textarea" name="message" required></textarea>
              <button class="btn btn-primary" type="submit">Enviar comentario</button>
              <p class="blog-feedback" aria-live="polite"></p>
            </form>
          </section>
        </div>
      </section>
    `;

    setPostMeta(post);

    injectStructuredData([
      buildPostSchema(post, author, category),
      buildAuthorSchema(author),
      buildBreadcrumbSchema([
        { name: "Home", url: "https://www.achecar.com.br/" },
        { name: "Blog", url: "https://www.achecar.com.br/blog/" },
        {
          name: category ? category.name : "Categoria",
          url: "https://www.achecar.com.br" + (category ? categoryUrl(category.slug) : "/blog/categoria/")
        },
        { name: post.title, url: "https://www.achecar.com.br" + postUrl(post) }
      ])
    ]);
  }

  function applyFilters(list, activeFilters) {
    const search = normalizeText(activeFilters.search);

    return list.filter((post) => {
      if (activeFilters.category && post.category !== activeFilters.category) return false;
      if (activeFilters.tag && post.tags.indexOf(activeFilters.tag) < 0) return false;
      if (activeFilters.author && post.author !== activeFilters.author) return false;
      if (activeFilters.date && !String(post.publishedAt || "").slice(0, 7).startsWith(activeFilters.date)) {
        return false;
      }

      if (search) {
        const haystack = normalizeText(
          [
            post.title,
            post.summary,
            post.content,
            post.tags.map((tagSlug) => getTagName(tagSlug)).join(" "),
            getCategoryName(post.category)
          ].join(" ")
        );
        if (haystack.indexOf(search) < 0) return false;
      }

      return true;
    });
  }

  function sortPosts(list) {
    return list.slice().sort((a, b) => {
      const pinnedDiff = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
      if (pinnedDiff !== 0) return pinnedDiff;

      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });
  }

  function paginate(list, page, pageSize) {
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    const currentPage = clamp(page || 1, 1, totalPages);
    const start = (currentPage - 1) * pageSize;
    const items = list.slice(start, start + pageSize);

    return {
      items,
      total: list.length,
      totalPages,
      currentPage
    };
  }

  function renderSearchForm(activeFilters, config) {
    const categoryOptions = categories
      .map(
        (category) =>
          `<option value="${escapeAttribute(category.slug)}" ${
            activeFilters.category === category.slug ? "selected" : ""
          }>${escapeHtml(category.name)}</option>`
      )
      .join("");

    const tagOptions = tags
      .map(
        (tag) =>
          `<option value="${escapeAttribute(tag.slug)}" ${
            activeFilters.tag === tag.slug ? "selected" : ""
          }>${escapeHtml(tag.name)}</option>`
      )
      .join("");

    const authorOptions = authors
      .map(
        (author) =>
          `<option value="${escapeAttribute(author.slug)}" ${
            activeFilters.author === author.slug ? "selected" : ""
          }>${escapeHtml(author.name)}</option>`
      )
      .join("");

    return `
      <section class="blog-search-panel" aria-label="Busca e filtros do blog">
        <div class="blog-section-header">
          <h2>${escapeHtml(config.title)}</h2>
          <p>${escapeHtml(config.description)}</p>
        </div>
        <form class="blog-search-form" action="${escapeAttribute(config.action)}" method="get" data-blog-filter-form>
          <label for="blog-search-input">Buscar</label>
          <input
            id="blog-search-input"
            class="input"
            name="search"
            value="${escapeAttribute(activeFilters.search || "")}" 
            placeholder="Ex: leilao, FIPE, documentos"
          />

          ${
            config.showCategoryFilter
              ? `<label for="blog-filter-category">Categoria</label>
                 <select id="blog-filter-category" name="category">
                   <option value="">Todas</option>
                   ${categoryOptions}
                 </select>`
              : `<input type="hidden" name="category" value="${escapeAttribute(activeFilters.category || "")}" />`
          }

          ${
            config.showTagFilter
              ? `<label for="blog-filter-tag">Tag</label>
                 <select id="blog-filter-tag" name="tag">
                   <option value="">Todas</option>
                   ${tagOptions}
                 </select>`
              : `<input type="hidden" name="tag" value="${escapeAttribute(activeFilters.tag || "")}" />`
          }

          ${
            config.showAuthorFilter
              ? `<label for="blog-filter-author">Autor</label>
                 <select id="blog-filter-author" name="author">
                   <option value="">Todos</option>
                   ${authorOptions}
                 </select>`
              : `<input type="hidden" name="author" value="${escapeAttribute(activeFilters.author || "")}" />`
          }

          <label for="blog-filter-date">Data (mes)</label>
          <input id="blog-filter-date" type="month" class="input" name="date" value="${escapeAttribute(activeFilters.date || "")}" />

          <div class="blog-search-actions">
            <button class="btn btn-primary" type="submit">Aplicar filtros</button>
            <a class="btn btn-ghost" href="${escapeAttribute(config.action)}">Limpar</a>
          </div>
        </form>
      </section>
    `;
  }

  function renderPostCard(post, options) {
    const category = getCategory(post.category);
    const author = getAuthor(post.author);
    const isFeatured = options && options.featured;

    return `
      <article class="blog-post-card ${isFeatured ? "is-featured" : ""}">
        <a class="blog-post-thumb" href="${postUrl(post)}" aria-label="${escapeAttribute(post.title)}">
          <img src="${escapeAttribute(post.heroImage)}" alt="${escapeAttribute(post.title)}" loading="lazy" decoding="async" />
        </a>
        <div class="blog-post-body">
          <div class="blog-post-topline">
            <a class="pill" href="${category ? categoryUrl(category.slug) : "/blog/categoria/"}">${escapeHtml(category ? category.name : "Categoria")}</a>
            ${post.pinned ? '<span class="blog-badge">Fixado</span>' : ""}
          </div>
          <h3><a href="${postUrl(post)}">${escapeHtml(post.title)}</a></h3>
          <p>${escapeHtml(post.summary)}</p>
          <div class="blog-post-footer">
            <a href="${author ? authorUrl(author.slug) : "/blog/autor/"}">${escapeHtml(author ? author.name : "Equipe Achecar")}</a>
            <span>${formatDate(post.publishedAt)}</span>
            <span>${post.readingTime} min</span>
          </div>
        </div>
      </article>
    `;
  }

  function renderPagination(pagination, activeFilters, basePath) {
    if (pagination.totalPages <= 1) return "";

    const links = [];
    const start = Math.max(1, pagination.currentPage - 2);
    const end = Math.min(pagination.totalPages, start + 4);

    for (let i = start; i <= end; i += 1) {
      links.push(`
        <a class="${i === pagination.currentPage ? "is-active" : ""}" href="${buildPageHref(i, activeFilters, basePath)}">${i}</a>
      `);
    }

    return `
      <nav class="blog-pagination" aria-label="Paginacao do blog">
        <a href="${buildPageHref(Math.max(1, pagination.currentPage - 1), activeFilters, basePath)}" class="blog-page-nav">Anterior</a>
        ${links.join("")}
        <a href="${buildPageHref(Math.min(pagination.totalPages, pagination.currentPage + 1), activeFilters, basePath)}" class="blog-page-nav">Proxima</a>
      </nav>
    `;
  }

  function buildPageHref(page, activeFilters, basePath) {
    const normalizedBase = normalizePath(basePath || "/blog/");
    const query = new URLSearchParams();

    if (activeFilters.search) query.set("search", activeFilters.search);
    if (activeFilters.category) query.set("category", activeFilters.category);
    if (activeFilters.tag) query.set("tag", activeFilters.tag);
    if (activeFilters.author) query.set("author", activeFilters.author);
    if (activeFilters.date) query.set("date", activeFilters.date);

    const hasFilters = query.toString().length > 0;

    if (!hasFilters && normalizedBase === "/blog/") {
      if (page <= 1) return "/blog/";
      return `/blog/pagina/${page}/`;
    }

    if (page > 1) {
      query.set("page", String(page));
    }

    return normalizedBase + (query.toString() ? `?${query.toString()}` : "");
  }

  function renderPostBlocks(blocks) {
    return blocks
      .map((block) => {
        if (block.type === "h2") return `<h2>${escapeHtml(block.text)}</h2>`;
        if (block.type === "h3") return `<h3>${escapeHtml(block.text)}</h3>`;
        if (block.type === "p") return `<p>${escapeHtml(block.text)}</p>`;
        if (block.type === "ul") {
          return `<ul>${(block.items || [])
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul>`;
        }
        if (block.type === "image") {
          return `
            <figure>
              <img src="${escapeAttribute(block.src)}" alt="${escapeAttribute(block.alt || "")}" loading="lazy" decoding="async" />
              ${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}
            </figure>
          `;
        }
        return "";
      })
      .join("");
  }

  function renderPostCta(post) {
    const cta = post.finalCta || {
      title: "Pronto para consultar?",
      text: "Valide o historico pela placa.",
      label: "Consultar",
      href: "/consulta-gratuita"
    };

    return `
      <section class="blog-post-cta" aria-labelledby="final-cta-title">
        <h2 id="final-cta-title">${escapeHtml(cta.title)}</h2>
        <p>${escapeHtml(cta.text)}</p>
        <a class="btn btn-primary" href="${escapeAttribute(cta.href)}">${escapeHtml(cta.label)}</a>
      </section>
    `;
  }

  function renderNewsletterCard() {
    return `
      <section class="blog-newsletter-card" aria-labelledby="newsletter-title">
        <h2 id="newsletter-title">Newsletter de decisao veicular</h2>
        <p>Receba guias novos no seu e-mail. Escolha seu conector e acompanhe eventos via analytics.</p>
        <form class="blog-newsletter-form" data-newsletter-form>
          <label for="newsletter-email">E-mail</label>
          <input id="newsletter-email" class="input" type="email" name="email" required placeholder="voce@empresa.com" />
          <label for="newsletter-provider">Integracao</label>
          <select id="newsletter-provider" name="provider" data-provider-select>
            <option value="mailchimp">Mailchimp</option>
            <option value="hubspot">HubSpot</option>
            <option value="rd">RD Station</option>
            <option value="custom">API custom</option>
          </select>
          <label for="newsletter-endpoint">Endpoint custom (opcional)</label>
          <input id="newsletter-endpoint" class="input" name="endpoint" placeholder="https://api.seudominio.com/newsletter" />
          <button class="btn btn-primary" type="submit">Assinar newsletter</button>
          <p class="blog-feedback" aria-live="polite"></p>
        </form>
      </section>
    `;
  }

  function renderMainCtaCard() {
    return `
      <section class="blog-main-cta-card" aria-labelledby="blog-cta-title">
        <h2 id="blog-cta-title">Transforme leitura em acao</h2>
        <p>Depois de aprender, valide o veiculo pela placa e tome a decisao com dados oficiais.</p>
        <div class="blog-hero-cta">
          <a class="btn btn-primary" href="/consulta-gratuita">Consultar placa agora</a>
          <a class="btn btn-ghost" href="/precos">Ver planos</a>
        </div>
      </section>
    `;
  }

  function renderShareLinks(post) {
    const absoluteUrl = "https://www.achecar.com.br" + postUrl(post);
    const encodedUrl = encodeURIComponent(absoluteUrl);
    const encodedTitle = encodeURIComponent(post.title);

    return `
      <div class="blog-share-links">
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener noreferrer">Facebook</a>
        <a href="https://wa.me/?text=${encodedTitle}%20${encodedUrl}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a href="https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}" target="_blank" rel="noopener noreferrer">X</a>
        <button type="button" class="btn btn-secondary blog-copy-link" data-copy-link="${escapeAttribute(absoluteUrl)}">Copy link</button>
      </div>
    `;
  }

  function renderBreadcrumb(items) {
    return `
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        ${items
          .map((item, index) => {
            const isLast = index === items.length - 1;
            if (isLast || !item.href) {
              return `<span>${escapeHtml(item.label)}</span>`;
            }
            return `<a href="${escapeAttribute(item.href)}">${escapeHtml(item.label)}</a><span>/</span>`;
          })
          .join("")}
      </nav>
    `;
  }

  function renderNotFound(title, href) {
    return `
      <section class="section">
        <div class="container">
          <div class="content-card">
            <h1>${escapeHtml(title)}</h1>
            <p>O conteudo solicitado nao foi localizado. Continue navegando pelo blog.</p>
            <a class="btn btn-primary" href="${escapeAttribute(href)}">Voltar ao blog</a>
          </div>
        </div>
      </section>
    `;
  }

  function renderAuthorSocialLinks(author) {
    if (!author || !author.socials) return "";

    return Object.keys(author.socials)
      .map((network) => {
        const href = author.socials[network];
        if (!href) return "";
        return `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(network)}</a>`;
      })
      .join("");
  }

  function bindGlobalEvents() {
    document.addEventListener("submit", (event) => {
      const newsletterForm = event.target.closest("[data-newsletter-form]");
      if (newsletterForm) {
        event.preventDefault();
        handleNewsletterSubmit(newsletterForm);
        return;
      }

      const commentForm = event.target.closest("[data-comment-form]");
      if (commentForm) {
        event.preventDefault();
        const feedback = commentForm.querySelector(".blog-feedback");
        if (feedback) {
          feedback.textContent = "Comentario recebido. Publicacao apos moderacao em ate 24h.";
        }
        trackEvent("blog_comment_submitted", { location: currentPath });
      }
    });

    document.addEventListener("click", async (event) => {
      const copyButton = event.target.closest("[data-copy-link]");
      if (!copyButton) return;

      const url = copyButton.getAttribute("data-copy-link");
      if (!url) return;

      await safeCopy(url);
      copyButton.textContent = "Copiado";
      window.setTimeout(() => {
        copyButton.textContent = "Copy link";
      }, 1500);
      trackEvent("blog_copy_link", { location: currentPath });
    });

    document.addEventListener("click", (event) => {
      const shareLink = event.target.closest(".blog-share-links a");
      if (!shareLink) return;
      trackEvent("blog_share_click", { location: currentPath, destination: shareLink.href });
    });
  }

  async function handleNewsletterSubmit(form) {
    const formData = new FormData(form);
    const provider = String(formData.get("provider") || "mailchimp");
    const email = String(formData.get("email") || "").trim();
    const endpoint = String(formData.get("endpoint") || "").trim();
    const feedback = form.querySelector(".blog-feedback");

    if (!email) {
      if (feedback) feedback.textContent = "Informe um e-mail valido.";
      return;
    }

    const providerEndpoints = {
      mailchimp: "MAILCHIMP_WEBHOOK_URL",
      hubspot: "HUBSPOT_FORM_URL",
      rd: "RD_STATION_ENDPOINT",
      custom: endpoint
    };

    const selectedEndpoint = providerEndpoints[provider] || endpoint;

    if (feedback) {
      feedback.textContent =
        provider === "custom" && !endpoint
          ? "Informe o endpoint custom para concluir a integracao."
          : `Contato registrado. Integracao selecionada: ${provider}.`;
    }

    trackEvent("blog_newsletter_subscribe", {
      provider,
      endpoint: selectedEndpoint ? "configured" : "not_configured",
      location: currentPath
    });
  }

  function trackEvent(eventName, payload) {
    if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push(Object.assign({ event: eventName }, payload || {}));
    }

    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, payload || {});
    }

    if (typeof window.fbq === "function") {
      window.fbq("trackCustom", eventName, payload || {});
    }
  }

  function safeCopy(value) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(value);
    }

    return new Promise((resolve) => {
      const temp = document.createElement("textarea");
      temp.value = value;
      temp.setAttribute("readonly", "");
      temp.style.position = "absolute";
      temp.style.left = "-9999px";
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
      resolve();
    });
  }

  function setPostMeta(post) {
    if (!post || !post.seo) return;

    setTextMeta("title", post.seo.metaTitle || post.title);
    setTextMeta('meta[property="og:type"]', "article");
    setTextMeta('meta[name="description"]', post.seo.metaDescription || post.summary);
    setTextMeta('meta[property="og:title"]', post.seo.ogTitle || post.title);
    setTextMeta('meta[property="og:description"]', post.seo.ogDescription || post.summary);
    setTextMeta('meta[property="og:image"]', post.seo.ogImage || data.site.defaultImage);
    setTextMeta('meta[property="og:url"]', post.seo.canonical || ("https://www.achecar.com.br" + postUrl(post)));
    setTextMeta('meta[name="robots"]', post.seo.robots || "index,follow");
    setCanonical(post.seo.canonical || ("https://www.achecar.com.br" + postUrl(post)));
  }

  function setCollectionMeta(meta) {
    if (!meta) return;
    setTextMeta("title", meta.title);
    setTextMeta('meta[property="og:type"]', "website");
    setTextMeta('meta[name="description"]', meta.description);
    setTextMeta('meta[property="og:title"]', meta.title);
    setTextMeta('meta[property="og:description"]', meta.description);
    setTextMeta('meta[property="og:url"]', meta.canonical);
    setTextMeta('meta[name="robots"]', "index,follow");
    setCanonical(meta.canonical);
  }

  function setCanonical(url) {
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && url) canonical.setAttribute("href", url);
  }

  function setTextMeta(selector, value) {
    if (!value) return;

    if (selector === "title") {
      document.title = value;
      return;
    }

    const element = document.querySelector(selector);
    if (!element) return;

    if (element.hasAttribute("content")) {
      element.setAttribute("content", value);
    }
  }

  function injectStructuredData(items) {
    document.querySelectorAll("script[data-blog-schema]").forEach((node) => node.remove());

    (items || []).forEach((item) => {
      if (!item) return;
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.blogSchema = "true";
      script.textContent = JSON.stringify(item);
      document.head.appendChild(script);
    });
  }

  function buildBlogSchema() {
    return {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: data.site.blogName,
      url: "https://www.achecar.com.br/blog/",
      publisher: {
        "@type": "Organization",
        name: data.site.name,
        url: data.site.url,
        logo: {
          "@type": "ImageObject",
          url: data.site.defaultImage
        }
      }
    };
  }

  function buildPostSchema(post, author, category) {
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.summary,
      image: post.heroImage,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt || post.publishedAt,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://www.achecar.com.br" + postUrl(post)
      },
      author: {
        "@type": "Person",
        name: author ? author.name : "Equipe Achecar"
      },
      publisher: {
        "@type": "Organization",
        name: data.site.name,
        logo: {
          "@type": "ImageObject",
          url: data.site.defaultImage
        }
      },
      articleSection: category ? category.name : "Blog",
      keywords: post.tags.map((tagSlug) => getTagName(tagSlug)).join(", ")
    };
  }

  function buildAuthorSchema(author) {
    if (!author) return null;

    return {
      "@context": "https://schema.org",
      "@type": "Person",
      name: author.name,
      description: author.bio,
      jobTitle: author.role,
      image: author.photo,
      sameAs: Object.values(author.socials || {})
    };
  }

  function buildBreadcrumbSchema(items) {
    const listItems = (items || [])
      .filter((item) => item && item.name)
      .map((item, index) => {
        const output = {
          "@type": "ListItem",
          position: index + 1,
          name: item.name
        };

        if (item.url) {
          output.item = item.url;
        }

        return output;
      });

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: listItems
    };
  }

  function getRelatedPosts(post, limit) {
    const candidates = posts.filter((item) => item.slug !== post.slug);

    const scored = candidates
      .map((candidate) => {
        let score = 0;
        if (candidate.category === post.category) score += 5;

        const overlap = candidate.tags.filter((tag) => post.tags.indexOf(tag) >= 0).length;
        score += overlap * 3;

        score += Math.min(candidate.views || 0, 2000) / 1000;

        return { candidate, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.candidate);

    return scored;
  }

  function getPost(slug) {
    return posts.find((post) => post.slug === slug) || null;
  }

  function getCategory(slug) {
    return categories.find((category) => category.slug === slug) || null;
  }

  function getAuthor(slug) {
    return authors.find((author) => author.slug === slug) || null;
  }

  function getTag(slug) {
    return tags.find((tag) => tag.slug === slug) || null;
  }

  function getCategoryName(slug) {
    const category = getCategory(slug);
    return category ? category.name : "";
  }

  function getCategoryDescription(slug) {
    const category = getCategory(slug);
    return category ? category.description : "";
  }

  function getTagName(slug) {
    const tag = getTag(slug);
    return tag ? tag.name : "";
  }

  function postUrl(post) {
    return normalizePath(`/blog/categoria/${post.category}/${post.slug}/`);
  }

  function categoryUrl(slug) {
    return normalizePath(`/blog/categoria/${slug}/`);
  }

  function tagUrl(slug) {
    return normalizePath(`/blog/tag/${slug}/`);
  }

  function authorUrl(slug) {
    return normalizePath(`/blog/autor/${slug}/`);
  }

  function hasActiveFilters(activeFilters) {
    return Boolean(
      activeFilters.search ||
        activeFilters.category ||
        activeFilters.tag ||
        activeFilters.author ||
        activeFilters.date
    );
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function normalizePath(path) {
    const normalized = path.startsWith("/") ? path : "/" + path;
    return normalized.endsWith("/") ? normalized : normalized + "/";
  }

  function getPageFromPath(path) {
    const parts = normalizePath(path).split("/").filter(Boolean);
    const pageIndex = parts.indexOf("pagina");

    if (pageIndex >= 0 && parts[pageIndex + 1]) {
      const page = Number(parts[pageIndex + 1]);
      if (Number.isFinite(page) && page > 0) return page;
    }

    return 1;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "");
  }
})();
