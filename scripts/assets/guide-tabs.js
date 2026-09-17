/* pattern-guide HTML — 세 언어 코드 탭. render-guides.py 가 HTML 에 인라인한다.
 * JS 가 없으면 모든 패널이 보인다(마크업 기본값). 초기화하면서 선택 안 된 패널에 hidden 을 건다.
 * 키보드: ←/→ 이웃 탭, Home/End 처음/끝 탭(WAI-ARIA APG Tabs, 자동 활성화).
 */
(function () {
  "use strict";

  var STORE_KEY = "pattern-guide:code-lang";
  var widgets = [];

  function readPref() {
    try {
      return window.localStorage.getItem(STORE_KEY);
    } catch (e) {
      return null;
    }
  }

  function writePref(lang) {
    try {
      window.localStorage.setItem(STORE_KEY, lang);
    } catch (e) {
      /* 저장소를 못 쓰면 이번 페이지 안에서만 유지한다 */
    }
  }

  function select(widget, tab, moveFocus) {
    widget.tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
    if (moveFocus) tab.focus();
  }

  function tabForLang(widget, lang) {
    for (var i = 0; i < widget.tabs.length; i++) {
      if (widget.tabs[i].getAttribute("data-lang") === lang) return widget.tabs[i];
    }
    return null;
  }

  function activate(widget, tab, moveFocus) {
    select(widget, tab, moveFocus);
    var lang = tab.getAttribute("data-lang");
    if (!lang) return;
    writePref(lang);
    widgets.forEach(function (other) {
      if (other === widget) return;
      var match = tabForLang(other, lang);
      if (match) select(other, match, false);
    });
  }

  function init(root) {
    var list = root.querySelector(".code-tabs__list");
    if (!list) return;
    var tabs = Array.prototype.slice.call(list.querySelectorAll(".code-tabs__tab"));
    if (!tabs.length) return;
    var widget = { root: root, tabs: tabs };
    widgets.push(widget);

    list.addEventListener("click", function (event) {
      var tab = event.target.closest(".code-tabs__tab");
      if (tab && tabs.indexOf(tab) !== -1) activate(widget, tab, false);
    });

    list.addEventListener("keydown", function (event) {
      var current = event.target.closest(".code-tabs__tab");
      var index = tabs.indexOf(current);
      if (index === -1) return;
      var next = null;
      switch (event.key) {
        case "ArrowRight":
          next = tabs[(index + 1) % tabs.length];
          break;
        case "ArrowLeft":
          next = tabs[(index - 1 + tabs.length) % tabs.length];
          break;
        case "Home":
          next = tabs[0];
          break;
        case "End":
          next = tabs[tabs.length - 1];
          break;
        default:
          return;
      }
      event.preventDefault();
      activate(widget, next, true);
    });

    var initial = tabForLang(widget, readPref());
    if (!initial) {
      initial = tabs.filter(function (t) {
        return t.getAttribute("aria-selected") === "true";
      })[0] || tabs[0];
    }
    select(widget, initial, false);
    root.setAttribute("data-enhanced", "");
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll(".code-tabs"), init);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
