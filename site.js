/* Laredo Roleplay website: page switching, Normal/Halloween modes, live clock and the announcements feed. */
(function () {
  'use strict';

  var CONFIG = window.LAREDO_CONFIG || {};
  var FEED_URL = CONFIG.announcementsUrl || 'announcements.json';
  var root = document.getElementById('root');

  var PAGES = ['home', 'departments', 'applications', 'announcements', 'shop', 'rules', 'staff'];
  var TITLES = {
    home: 'Laredo Roleplay',
    departments: 'Departments | Laredo Roleplay',
    applications: 'Applications | Laredo Roleplay',
    announcements: 'Announcements | Laredo Roleplay',
    shop: 'Shop | Laredo Roleplay',
    rules: 'Rules | Laredo Roleplay',
    staff: 'Staff | Laredo Roleplay'
  };

  /* ---------------------------------------------------------------- pages */
  var current = null;

  function pageFromHash() {
    return (location.hash || '').replace(/^#\/?/, '') || 'home';
  }

  function showPage(page) {
    if (PAGES.indexOf(page) === -1) page = 'home';
    var changed = page !== current;
    current = page;
    document.querySelectorAll('.pg').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-page') === page);
    });
    document.querySelectorAll('[data-nav]').forEach(function (btn) {
      var on = btn.getAttribute('data-nav') === page;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-current', on ? 'page' : 'false');
    });
    document.title = TITLES[page];
    if (changed) window.scrollTo(0, 0);
    if (page === 'announcements') loadFeed();
  }

  document.addEventListener('click', function (e) {
    var target = e.target.closest ? e.target.closest('[data-go]') : null;
    if (!target) return;
    var page = target.getAttribute('data-go');
    if (pageFromHash() === page) showPage(page);
    else location.hash = page;
  });
  window.addEventListener('hashchange', function () { showPage(pageFromHash()); });

  /* --------------------------------------------------------------- themes */
  function setTheme(theme, save) {
    theme = theme === 'halloween' ? 'halloween' : 'normal';
    root.classList.remove('t-normal', 't-halloween');
    root.classList.add('t-' + theme);
    document.querySelectorAll('[data-theme-btn]').forEach(function (btn) {
      var on = btn.getAttribute('data-theme-btn') === theme;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'halloween' ? '#0F0A1A' : '#0C1424');
    if (save) {
      try { localStorage.setItem('laredo-theme', theme); } catch (e) { /* ignore */ }
    }
  }

  var savedTheme = 'normal';
  try { savedTheme = localStorage.getItem('laredo-theme') || 'normal'; } catch (e) { /* ignore */ }
  setTheme(savedTheme, false);
  document.querySelectorAll('[data-theme-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () { setTheme(btn.getAttribute('data-theme-btn'), true); });
  });

  /* ---------------------------------------------------------------- clock */
  var clockFormat = null;
  function updateClock() {
    var h = document.getElementById('clk-h');
    var m = document.getElementById('clk-m');
    var s = document.getElementById('clk-s');
    var wrap = document.getElementById('clock-wrap');
    if (!h || !m || !s) return;
    try {
      clockFormat = clockFormat || new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
      });
      var parts = clockFormat.formatToParts(new Date());
      var get = function (type) {
        for (var i = 0; i < parts.length; i++) if (parts[i].type === type) return parts[i].value;
        return '';
      };
      h.textContent = get('hour');
      m.textContent = get('minute');
      s.textContent = (get('dayPeriod') + ' ' + get('timeZoneName')).trim();
    } catch (e) {
      if (wrap) wrap.style.display = 'none';
    }
  }
  updateClock();
  setInterval(updateClock, 15000);

  /* --------------------------------------------- Discord-style text to HTML */
  /* MD-START */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function inline(text) {
    var t = esc(text);
    t = t.replace(/&lt;(a?):(\w+):(\d+)&gt;/g, function (m, animated, name, id) {
      return '<img class="emoji" alt=":' + name + ':" src="https://cdn.discordapp.com/emojis/' + id + '.' +
        (animated ? 'gif' : 'webp') + '?size=44">';
    });
    t = t.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    t = t.replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    t = t.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/__([^_\n]+)__/g, '<u>$1</u>');
    t = t.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    t = t.replace(/(^|[^_\w])_([^_\n]+)_(?![_\w])/g, '$1<em>$2</em>');
    t = t.replace(/~~([^~\n]+)~~/g, '<s>$1</s>');
    t = t.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    t = t.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, function (m, pre, url) {
      return pre + '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
    });
    return t;
  }

  function renderMarkdown(text) {
    var lines = String(text || '').replace(/\r/g, '').split('\n');
    var out = [];
    var para = [];
    var inList = false;
    function flushPara() {
      if (para.length) { out.push('<p>' + para.join('<br>') + '</p>'); para = []; }
    }
    function closeList() {
      if (inList) { out.push('</ul>'); inList = false; }
    }
    lines.forEach(function (line) {
      var m;
      if ((m = line.match(/^#{1,3}\s+(.*)$/))) {
        flushPara(); closeList();
        out.push('<p class="msg-h">' + inline(m[1]) + '</p>');
      } else if ((m = line.match(/^>\s?(.*)$/))) {
        flushPara(); closeList();
        out.push('<blockquote>' + inline(m[1]) + '</blockquote>');
      } else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
        flushPara();
        if (!inList) { out.push('<ul>'); inList = true; }
        out.push('<li>' + inline(m[1]) + '</li>');
      } else if (!line.trim()) {
        flushPara(); closeList();
      } else {
        closeList();
        para.push(inline(line));
      }
    });
    flushPara(); closeList();
    return out.join('');
  }
  /* MD-END */

  /* ------------------------------------------------------ announcements feed */
  var lastSignature = null;
  var feedState = 'idle';

  function feedBox() { return document.getElementById('feed'); }

  function setFeedMessage(text) {
    var box = feedBox();
    if (!box) return;
    box.innerHTML = '<div class="card" style="padding:28px;color:var(--sub);font-size:19px">' + esc(text) + '</div>';
  }

  function renderPost(post) {
    var date = '';
    try {
      date = new Date(post.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) { /* ignore */ }
    var author = post.author || {};
    var avatar = /^https:\/\/cdn\.discordapp\.com\//.test(author.avatar || '')
      ? '<img class="avatar" alt="" src="' + esc(author.avatar) + '">' : '';
    var html = '<article class="card" style="padding:28px;display:flex;flex-direction:column;gap:16px">';
    html += '<div style="display:flex;align-items:center;gap:14px">' + avatar +
      '<div style="display:flex;flex-direction:column"><strong style="color:var(--title);font-size:19px">' +
      esc(author.name || 'Staff') + '</strong><span style="color:var(--muted);font-size:15px">' + esc(date) +
      (post.edited ? ' (edited)' : '') + '</span></div></div>';
    if (post.content) html += '<div class="msg">' + renderMarkdown(post.content) + '</div>';
    (post.embeds || []).forEach(function (embed) {
      var inner = '';
      var color = Number(embed.color);
      var style = Number.isFinite(color) && color >= 0 && color <= 0xFFFFFF
        ? ' style="--embed-color:#' + color.toString(16).padStart(6, '0') + '"' : '';
      if (embed.author && embed.author.name) {
        inner += '<div class="embed-author">' +
          (safeDiscordImage(embed.author.iconUrl) ? '<img alt="" src="' + esc(embed.author.iconUrl) + '">' : '') +
          (embed.author.url && safeHttpUrl(embed.author.url) ? '<a href="' + esc(embed.author.url) + '" target="_blank" rel="noopener noreferrer">' + inline(embed.author.name) + '</a>' : inline(embed.author.name)) +
          '</div>';
      }
      if (embed.title) {
        inner += '<p class="msg-h">' + (embed.url && safeHttpUrl(embed.url)
          ? '<a href="' + esc(embed.url) + '" target="_blank" rel="noopener noreferrer">' + inline(embed.title) + '</a>'
          : inline(embed.title)) + '</p>';
      }
      if (embed.description) inner += renderMarkdown(embed.description);
      if (embed.fields && embed.fields.length) {
        inner += '<div class="embed-fields">';
        embed.fields.forEach(function (f) {
          inner += '<div class="embed-field' + (f.inline ? ' is-inline' : '') + '"><strong>' + inline(f.name) + '</strong><div>' + renderMarkdown(f.value) + '</div></div>';
        });
        inner += '</div>';
      }
      if (safeDiscordImage(embed.image)) inner += '<img class="embed-image" alt="" loading="lazy" src="' + esc(embed.image) + '">';
      if (safeDiscordImage(embed.thumbnail)) inner += '<img class="embed-thumbnail" alt="" loading="lazy" src="' + esc(embed.thumbnail) + '">';
      if (embed.footer && embed.footer.text) {
        inner += '<div class="embed-footer">' +
          (safeDiscordImage(embed.footer.iconUrl) ? '<img alt="" src="' + esc(embed.footer.iconUrl) + '">' : '') +
          '<span>' + inline(embed.footer.text) + '</span>' +
          (embed.timestamp ? '<time>' + esc(formatDate(embed.timestamp)) + '</time>' : '') + '</div>';
      }
      if (inner) html += '<div class="msg msg-embed"' + style + '>' + inner + '</div>';
    });
    if (post.attachments) {
      html += '<p class="msg-note">This post includes ' + post.attachments + ' attachment' +
        (post.attachments === 1 ? '' : 's') + '. View ' + (post.attachments === 1 ? 'it' : 'them') + ' in Discord.</p>';
    }
    if (/^https:\/\/discord\.com\//.test(post.url || '')) {
      html += '<div><a class="btn-line" href="' + esc(post.url) +
        '" target="_blank" rel="noopener noreferrer">View in Discord</a></div>';
    }
    return html + '</article>';
  }

  function safeHttpUrl(value) { return /^https:\/\//i.test(value || ''); }
  function safeDiscordImage(value) { return /^https:\/\/(cdn\.discordapp\.com|media\.discordapp\.net)\//i.test(value || ''); }
  function formatDate(value) {
    try { return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
    catch (e) { return ''; }
  }

  function loadFeed() {
    var box = feedBox();
    if (!box) return;
    if (feedState === 'idle') setFeedMessage('Loading announcements...');
    feedState = 'loading';
    var url = FEED_URL + (FEED_URL.indexOf('?') === -1 ? '?' : '&') + 't=' + Math.floor(Date.now() / 60000);
    fetch(url, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var posts = (data && data.announcements) || [];
        var signature = JSON.stringify(posts);
        feedState = 'ready';
        var badge = document.getElementById('feed-badge');
        if (badge) badge.hidden = false;
        if (signature === lastSignature) return;
        lastSignature = signature;
        if (!posts.length) {
          setFeedMessage('No announcements yet. Check back soon, or open our Discord.');
          return;
        }
        box.innerHTML = posts.map(renderPost).join('');
      })
      .catch(function () {
        feedState = 'error';
        lastSignature = null;
        var badge = document.getElementById('feed-badge');
        if (badge) badge.hidden = true;
        setFeedMessage('Announcements could not be loaded right now. You can read them in our Discord instead.');
      });
  }

  setInterval(function () {
    if (current === 'announcements' && !document.hidden) loadFeed();
  }, 120000);

  /* ----------------------------------------------------------------- start */
  showPage(pageFromHash());
})();
