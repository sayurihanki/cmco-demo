export const HIDDEN_FILTER_ATTRIBUTES = new Set(['visibility', 'categoryPath']);

export const DEFAULT_CATEGORY_SORT = [{ attribute: 'position', direction: 'DESC' }];

const DEFAULT_VISIBILITY_FILTER = {
  attribute: 'visibility',
  in: ['Search', 'Catalog, Search'],
};

const PRICE_LABEL_PATTERN = /price|cost/i;

function titleize(value = '') {
  return String(value)
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPlainNumber(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function buildRangeKey(range) {
  return `${range.from}-${range.to}`;
}

export function cloneFilter(filter = {}) {
  const nextFilter = { attribute: filter.attribute };

  if (typeof filter.eq !== 'undefined') {
    nextFilter.eq = filter.eq;
  }

  if (Array.isArray(filter.in)) {
    nextFilter.in = [...filter.in];
  }

  if (filter.range) {
    nextFilter.range = { ...filter.range };
  }

  return nextFilter;
}

export function cloneFilters(filters = []) {
  return filters.map((filter) => cloneFilter(filter));
}

export function cloneSort(sort = []) {
  return sort.map((entry) => ({
    attribute: entry.attribute,
    direction: entry.direction,
  }));
}

export function isHiddenFilterAttribute(attribute) {
  return HIDDEN_FILTER_ATTRIBUTES.has(attribute);
}

export function getUserFilters(filters = []) {
  return filters
    .filter((filter) => filter?.attribute && !isHiddenFilterAttribute(filter.attribute))
    .map((filter) => cloneFilter(filter));
}

export function buildRequestFilters({ urlpath, userFilters = [] } = {}) {
  return [
    ...(urlpath ? [{ attribute: 'categoryPath', eq: urlpath }] : []),
    cloneFilter(DEFAULT_VISIBILITY_FILTER),
    ...cloneFilters(userFilters),
  ];
}

export function normalizeSearchRequest({ request = {}, urlpath = '', pageSize = 9 } = {}) {
  return {
    phrase: request.phrase ?? '',
    currentPage: Number(request.currentPage) || 1,
    pageSize: Number(request.pageSize) || pageSize,
    sort: request.sort?.length
      ? cloneSort(request.sort)
      : (urlpath ? cloneSort(DEFAULT_CATEGORY_SORT) : []),
    filter: buildRequestFilters({
      urlpath,
      userFilters: getUserFilters(request.filter),
    }),
  };
}

export function buildFacetMetadataMap(facets = []) {
  return new Map(facets.map((facet) => {
    const buckets = new Map();

    (facet.buckets || []).forEach((bucket) => {
      [
        bucket.title,
        bucket.name,
        bucket.path,
        typeof bucket.from !== 'undefined' && typeof bucket.to !== 'undefined'
          ? buildRangeKey(bucket)
          : null,
      ]
        .filter(Boolean)
        .forEach((key) => {
          buckets.set(key, bucket);
        });
    });

    return [facet.attribute, {
      title: facet.title || titleize(facet.attribute),
      buckets,
    }];
  }));
}

function formatRangeLabel({ range, attribute, facetTitle, bucket }) {
  if (bucket?.name) {
    return bucket.name;
  }

  if (bucket?.title && bucket.title !== buildRangeKey(range)) {
    return bucket.title;
  }

  const formatter = PRICE_LABEL_PATTERN.test(attribute) || PRICE_LABEL_PATTERN.test(facetTitle)
    ? formatCurrency
    : formatPlainNumber;

  return `${formatter(range.from)} - ${formatter(range.to)}`;
}

export function buildActiveFilterChips(filters = [], facetMetadata = new Map()) {
  const chips = [];

  getUserFilters(filters).forEach((filter) => {
    const facetMeta = facetMetadata.get(filter.attribute);
    const facetLabel = facetMeta?.title || titleize(filter.attribute);

    if (Array.isArray(filter.in)) {
      filter.in.forEach((value) => {
        const bucket = facetMeta?.buckets.get(value);
        chips.push({
          key: `${filter.attribute}:in:${value}`,
          attribute: filter.attribute,
          type: 'in',
          value,
          label: `${facetLabel}: ${bucket?.name || bucket?.title || titleize(value)}`,
        });
      });
    }

    if (filter.range) {
      const rangeKey = buildRangeKey(filter.range);
      const bucket = facetMeta?.buckets.get(rangeKey);
      chips.push({
        key: `${filter.attribute}:range:${rangeKey}`,
        attribute: filter.attribute,
        type: 'range',
        range: { ...filter.range },
        label: `${facetLabel}: ${formatRangeLabel({
          range: filter.range,
          attribute: filter.attribute,
          facetTitle: facetLabel,
          bucket,
        })}`,
      });
    }
  });

  return chips;
}

export function getNextUserFiltersForChip(filters = [], chip) {
  return getUserFilters(filters).reduce((nextFilters, filter) => {
    if (filter.attribute !== chip.attribute) {
      nextFilters.push(filter);
      return nextFilters;
    }

    if (chip.type === 'in' && Array.isArray(filter.in)) {
      const nextValues = filter.in.filter((value) => value !== chip.value);
      if (nextValues.length) {
        nextFilters.push({
          ...filter,
          in: nextValues,
        });
      }
      return nextFilters;
    }

    if (chip.type === 'range' && filter.range) {
      const isSameRange = Number(filter.range.from) === Number(chip.range?.from)
        && Number(filter.range.to) === Number(chip.range?.to);

      if (!isSameRange) {
        nextFilters.push(filter);
      }

      return nextFilters;
    }

    nextFilters.push(filter);
    return nextFilters;
  }, []);
}
