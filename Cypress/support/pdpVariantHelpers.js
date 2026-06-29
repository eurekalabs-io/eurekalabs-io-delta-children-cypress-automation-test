export const PDP_VARIANT_GROUP_SELECTOR =
  '.product-sidebar-wrapper .product-info-group, #MainContent aside .product-info-group, #MainContent .product-info-group';

const SWATCH_LI_SELECTOR =
  'label span img, label img, label.js-swatch-color, label[class*="variant-"], input.swatch-input[data-title], input[type="radio"]';

export const getSwatchListItemsInGroup = ($group) => {
  const $ul = $group.find('ul.swatches__list, ul[role="listbox"], ul').first();
  if (!$ul.length) return Cypress.$();

  return $ul.find('li').filter((_, li) => Cypress.$(li).find(SWATCH_LI_SELECTOR).length > 0);
};

export const getSwatchClickTarget = (swatchLi) => {
  const $li = Cypress.$(swatchLi);
  const candidates = [
    $li.find('label span img'),
    $li.find('label img'),
    $li.find('label.js-swatch-color, label[class*="variant-"]'),
    $li.find('label'),
    $li.find('input.swatch-input[data-title], input[type="radio"]'),
  ];

  for (const $candidate of candidates) {
    if ($candidate.length) return $candidate.first();
  }
  return Cypress.$();
};

export const getSecondSwatchTargetsOnPdp = ($body) => {
  const $groups = $body.find(PDP_VARIANT_GROUP_SELECTOR);
  const targets = [];

  if ($groups.length > 0) {
    $groups.each((_, group) => {
      const $items = getSwatchListItemsInGroup(Cypress.$(group));
      if ($items.length >= 2) {
        const $target = getSwatchClickTarget($items.eq(1));
        if ($target.length) targets.push($target);
      }
    });
    if (targets.length) return targets;
  }

  const flatSelectors = [
    '#MainContent .product-info-group .swatches__list input.swatch-input[data-title]',
    '#MainContent ul.swatches__list[role="listbox"] input.swatch-input[data-title]',
    '#MainContent .product-info-group input[data-title]',
    '#MainContent .product-info-group .swatches__list label.js-swatch-color',
    '#MainContent ul.swatches__list[role="listbox"] label.js-swatch-color',
  ].join(', ');

  const $options = $body.find(flatSelectors);
  if ($options.length >= 2) {
    targets.push($options.eq(1));
  }

  return targets;
};

export const countPdpSwatchOptions = ($body) => {
  const $groups = $body.find(PDP_VARIANT_GROUP_SELECTOR);
  let maxInGroup = 0;

  if ($groups.length > 0) {
    $groups.each((_, group) => {
      const count = getSwatchListItemsInGroup(Cypress.$(group)).length;
      maxInGroup = Math.max(maxInGroup, count);
    });
    return maxInGroup;
  }

  const flatSelectors = [
    '#MainContent .product-info-group .swatches__list input.swatch-input[data-title]',
    '#MainContent ul.swatches__list[role="listbox"] input.swatch-input[data-title]',
    '#MainContent .product-info-group .swatches__list label.js-swatch-color',
    '#MainContent ul.swatches__list[role="listbox"] label.js-swatch-color',
  ].join(', ');

  return $body.find(flatSelectors).length;
};
