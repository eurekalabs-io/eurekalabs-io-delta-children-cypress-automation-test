export const PDP_VARIANT_GROUP_SELECTOR =
  '.product-sidebar-wrapper .product-info-group, #MainContent aside .product-info-group, #MainContent .product-info-group';

const SWATCH_LI_SELECTOR =
  'label span img, label img, label.js-swatch-color, label[class*="variant-"], input.swatch-input[data-title], input[type="radio"]';

export const getSwatchListItemsInGroup = ($group) => {
  const $swatches = $group.find('ul.swatches__list');
  const $ul = $swatches.length ? $swatches.first() : $group.find('ul[role="listbox"]').first();
  if (!$ul.length) return Cypress.$();

  return $ul.find('li').filter((_, li) => Cypress.$(li).find(SWATCH_LI_SELECTOR).length > 0);
};

/**
 * Delta marks a color that cannot be bought with swatches__item--unavailable
 * and then disables Add To Cart. A swatch is out of stock when that class,
 * a disabled control, or an explicit availability flag is on the swatch itself.
 */
export const isOutOfStockSwatch = (el) => {
  if (!el) return true;
  const $el = Cypress.$(el);
  const $nextLi = $el.is('input') ? $el.next('li') : Cypress.$();
  const $nodes = $el
    .add($el.closest('li, label, .swatches__item, .swatches__list-item'))
    .add($el.find('label.swatches__item, .swatches__item, input.swatch-input'))
    .add($nextLi)
    .add($nextLi.find('label.swatches__item, .swatches__item'));

  return $nodes.toArray().some((node) => {
    const $node = Cypress.$(node);
    const className = String($node.attr('class') || '').toLowerCase();
    const availability = String(
      $node.attr('data-variant-availability')
      || $node.attr('data-available')
      || $node.attr('data-variant-available')
      || ''
    ).toLowerCase();

    return (
      className.includes('unavailable')
      || className.includes('sold-out')
      || className.includes('soldout')
      || className.includes('out-of-stock')
      || $node.is(':disabled')
      || $node.is('[disabled]')
      || String($node.attr('aria-disabled') || '').toLowerCase() === 'true'
      || availability === 'false'
      || availability === '0'
    );
  });
};

export const isSelectedSwatch = (el) => {
  if (!el) return false;
  const $el = Cypress.$(el);
  const $li = $el.closest('li');
  const $scope = $el.add($li).add($el.find('input, label'));
  if ($scope.filter('input:checked, .selected, .is-selected, [aria-checked="true"]').length) {
    return true;
  }
  const $previousRadio = ($li.length ? $li : $el).prev('input.swatch-input, input[type="radio"]');
  return $previousRadio.is(':checked');
};

const inStockSwatches = ($items) => $items.filter((_, el) => !isOutOfStockSwatch(el));

/** First in-stock swatch that is not the one already selected. If the current one is sold out, the first in-stock swatch. */
const firstPurchasableSwatch = ($items) => {
  const available = inStockSwatches($items);
  if (!available.length) return Cypress.$();

  const unselected = available.filter((_, el) => !isSelectedSwatch(el));
  if (unselected.length) return unselected.eq(0);

  const selectedIsOutOfStock = $items.toArray().some((el) => isSelectedSwatch(el) && isOutOfStockSwatch(el));
  return selectedIsOutOfStock ? available.eq(0) : Cypress.$();
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
      const $choice = firstPurchasableSwatch(getSwatchListItemsInGroup(Cypress.$(group)));
      if ($choice.length) {
        const $target = getSwatchClickTarget($choice.get(0));
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

  const $choice = firstPurchasableSwatch($body.find(flatSelectors));
  if ($choice.length) targets.push($choice);

  return targets;
};

export const countPdpSwatchOptions = ($body) => {
  const $groups = $body.find(PDP_VARIANT_GROUP_SELECTOR);
  let maxInGroup = 0;

  if ($groups.length > 0) {
    $groups.each((_, group) => {
      const count = inStockSwatches(getSwatchListItemsInGroup(Cypress.$(group))).length;
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

  return inStockSwatches($body.find(flatSelectors)).length;
};
