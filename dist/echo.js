/*! echo-js v1.8.0 | (c) 2018 @toddmotto | https://github.com/toddmotto/echo */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(function() {
      return factory(root);
    });
  } else if (typeof exports === 'object') {
    module.exports = factory;
  } else {
    root.echo = factory(root);
  }
})((function () {
  // Copied from https://github.com/mholt/PapaParse/pull/365
  // alternative method, similar to `Function('return this')()`
  // but without using `eval` (which is disabled when
  // using Content Security Policy).

  if (typeof self !== 'undefined') { return self; }
  if (typeof window !== 'undefined') { return window; }
  if (typeof global !== 'undefined') { return global; }

  throw new Error('Cannot determine global object');
})(), function (root) {

  'use strict';

  var echo = {};

  var callback = function () {};

  var offset, poll, delay, useDebounce, unload, container;

  var isHidden = function (element) {
    return (element.offsetParent === null);
  };

  var inView = function (element, view) {
    if (isHidden(element)) {
      return false;
    }

    var box = element.getBoundingClientRect();
    return (box.right >= view.l && box.bottom >= view.t && box.left <= view.r && box.top <= view.b);
  };

  var debounceOrThrottle = function () {
    if(!useDebounce && !!poll) {
      return;
    }
    clearTimeout(poll);
    poll = setTimeout(function(){
      echo.render();
      poll = null;
    }, delay);
  };

  echo.init = function (opts) {
    opts = opts || {};
    var offsetAll = opts.offset || 0;
    var offsetVertical = opts.offsetVertical || offsetAll;
    var offsetHorizontal = opts.offsetHorizontal || offsetAll;
    var optionToInt = function (opt, fallback) {
      return parseInt(opt || fallback, 10);
    };
    offset = {
      t: optionToInt(opts.offsetTop, offsetVertical),
      b: optionToInt(opts.offsetBottom, offsetVertical),
      l: optionToInt(opts.offsetLeft, offsetHorizontal),
      r: optionToInt(opts.offsetRight, offsetHorizontal)
    };
    delay = optionToInt(opts.throttle, 250);
    useDebounce = opts.debounce !== false;
    unload = !!opts.unload;
    callback = opts.callback || callback;
    container = opts.container || root;
    echo.render();
    if (container.addEventListener) {
      container.addEventListener('scroll', debounceOrThrottle, false);
      container.addEventListener('load', debounceOrThrottle, false);
    } else {
      container.attachEvent('onscroll', debounceOrThrottle);
      container.attachEvent('onload', debounceOrThrottle);
    }
  };

  echo.render = function (context) {
    var nodes = (context || document).querySelectorAll('[data-echo], [data-echo-background]');
    var length = nodes.length;
    var src, elem;
    var view = {
      l: 0 - offset.l,
      t: 0 - offset.t,
      b: (container.innerHeight || container.clientHeight) + offset.b,
      r: (container.innerWidth || container.clientWidth) + offset.r
    };
    for (var i = 0; i < length; i++) {
      elem = nodes[i];
      if (inView(elem, view)) {

        if (unload) {
          elem.setAttribute('data-echo-placeholder', elem.src);
        }

        if (elem.getAttribute('data-echo-background') !== null) {
          elem.style.backgroundImage = 'url(' + elem.getAttribute('data-echo-background') + ')';
        }
        else if (elem.src !== (src = elem.getAttribute('data-echo'))) {
          elem.src = src;
        }

        if (!unload) {
          elem.removeAttribute('data-echo');
          elem.removeAttribute('data-echo-background');
        }

        callback(elem, 'load');
      }
      else if (unload && !!(src = elem.getAttribute('data-echo-placeholder'))) {

        if (elem.getAttribute('data-echo-background') !== null) {
          elem.style.backgroundImage = 'url(' + src + ')';
        }
        else {
          elem.src = src;
        }

        elem.removeAttribute('data-echo-placeholder');
        callback(elem, 'unload');
      }
    }
    if (!length) {
      echo.detach();
    }
  };

  echo.detach = function () {
    if (document.removeEventListener) {
      root.removeEventListener('scroll', debounceOrThrottle);
    } else {
      root.detachEvent('onscroll', debounceOrThrottle);
    }
    clearTimeout(poll);
  };

  return echo;

});
