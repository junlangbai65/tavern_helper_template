<<<<<<< HEAD
/**
 * autoprefixer 在现行 browserslist 下常为 `backdrop-filter` 省略 `-webkit-backdrop-filter`，
 * 静态检测（如 Edge Tools compat-api）仍要求写入前缀。在压缩前补上一致的前缀声明。
 */
function findMatchingParen(str, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < str.length; i++) {
    if (str[i] === '(') depth += 1;
    else if (str[i] === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function findTopLevelComma(str, startFrom = 0) {
  let depth = 0;
  for (let i = startFrom; i < str.length; i++) {
    if (str[i] === '(') depth += 1;
    else if (str[i] === ')') depth -= 1;
    else if (str[i] === ',' && depth === 0) return i;
  }
  return -1;
}

/** 从 `color-mix(in srgb, A P%, B)` 取 B 作为旧浏览器 fallback */
function parseColorMixFallback(expr) {
  const open = expr.indexOf('(');
  if (open < 0) return null;
  const close = findMatchingParen(expr, open);
  if (close < 0) return null;

  const inner = expr.slice(open + 1, close);
  const firstComma = findTopLevelComma(inner);
  const secondComma = findTopLevelComma(inner, firstComma + 1);
  if (firstComma < 0 || secondComma < 0) return null;

  return inner.slice(secondComma + 1).trim();
}

function replaceAllColorMixWithFallback(value) {
  if (!value.includes('color-mix(')) return value;

  let result = value;
  let searchFrom = 0;

  while (searchFrom < result.length) {
    const idx = result.indexOf('color-mix(', searchFrom);
    if (idx < 0) break;

    const open = result.indexOf('(', idx);
    const close = findMatchingParen(result, open);
    if (close < 0) break;

    const expr = result.slice(idx, close + 1);
    const fallback = parseColorMixFallback(expr) ?? 'transparent';
    result = result.slice(0, idx) + fallback + result.slice(close + 1);
    searchFrom = idx + fallback.length;
  }

  return result;
}

/** 为含 color-mix 的声明追加旧浏览器 fallback（保留 modern 值在后） */
function colorMixFallback() {
  return {
    postcssPlugin: 'color-mix-fallback',
    Declaration(decl) {
      if (!decl.value.includes('color-mix(')) return;

      const fallbackValue = replaceAllColorMixWithFallback(decl.value);
      if (fallbackValue === decl.value) return;

      const prev = decl.prev();
      if (
        prev?.type === 'decl' &&
        prev.prop === decl.prop &&
        prev.value === fallbackValue &&
        !prev.value.includes('color-mix(')
      ) {
        return;
      }

      decl.cloneBefore({ prop: decl.prop, value: fallbackValue });
    },
  };
}
colorMixFallback.postcss = true;

function normalizeBackdropFilter() {
  return {
    postcssPlugin: 'normalize-backdrop-filter',
    OnceExit(root) {
      root.walkRules(rule => {
        const backdrops = [];
        const webkits = [];

        rule.walkDecls(decl => {
          if (decl.prop === 'backdrop-filter') backdrops.push(decl);
          if (decl.prop === '-webkit-backdrop-filter') webkits.push(decl);
        });

        if (backdrops.length === 0 && webkits.length === 0) return;

        webkits.forEach(decl => decl.remove());

        backdrops.forEach(decl => {
          const prev = decl.prev();
          if (
            prev?.type === 'decl' &&
            prev.prop === '-webkit-backdrop-filter' &&
            prev.value === decl.value
          ) {
            return;
          }
          decl.cloneBefore({ prop: '-webkit-backdrop-filter', value: decl.value });
        });
      });
    },
  };
}
normalizeBackdropFilter.postcss = true;

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: [
    require('autoprefixer'),
    require('@tailwindcss/postcss'),
    colorMixFallback,
    normalizeBackdropFilter,
    require('postcss-minify'),
  ],
=======
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: [require('autoprefixer'), require('@tailwindcss/postcss'), require('postcss-minify')],
>>>>>>> d3edc570be82dfef999b800e6b45a51d0863a025
};

module.exports = config;
