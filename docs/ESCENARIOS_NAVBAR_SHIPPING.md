# SHIPPING VALIDATION

Each row in `SHIPPING VALIDATION` opens the product page, confirms a variant can be added to the cart, adds that product, and completes checkout for `fbosio@eurekalabs.io`. If that product is out of stock, the test records `Selected product is out of stock` and buys a different in-stock product. Stock does not fail the scenario. The address check still runs. That email checks out at $0.00 and its orders are cancelled automatically. The thank-you page must show shipping methods were available and the full destination.

`SHIPPING NOT AVAILABLE FOR PO BOX` is a separate describe. That address is valid when Shopify refuses it. The test checks the warning and does not place the order.

Nursery Sets, Kids' Bedroom Sets, and Personalized products are excluded. A convertible crib, dresser, bed, or chair is still a single product. A personalized chair, bed, or gift is not used as the scenario product or as the in-stock replacement.

Expected result for `SHIPPING VALIDATION`: one or more shipping methods are shown. The Slack report lists the product in the order and the full ship-to address.

## Northeast and metro

| Scenario | Address | ZIP | Product | Expected result |
| --- | --- | --- | --- | --- |
| Ship to 350 5th Ave, New York, NY 10118 | 350 5th Ave, New York, NY | 10118 | [Saint 4-in-1 Convertible Crib](https://www.deltachildren.com/products/saint-4-in-1-convertible-crib) | Shipping methods are shown |
| Ship to 1600 Pennsylvania Ave NW, Washington, DC 20500 | 1600 Pennsylvania Ave NW, Washington, DC | 20500 | [Forever 6 Drawer Dresser with Interlocking Drawers - Naturals Collection](https://www.deltachildren.com/products/forever-6-drawer-dresser-naturals-collection) | Shipping methods are shown |
| Ship to 1 City Hall Sq, Boston, MA 02201, and the ZIP stays 02201 | 1 City Hall Sq, Boston, MA | 02201 | [Nest Nursery Swivel Recliner](https://www.deltachildren.com/products/nest-nursery-swivel-recliner) | Shipping methods are shown. The leading zero is kept |
| Ship to 94 Washington St, Hoboken, NJ 07030, and the ZIP stays 07030 | 94 Washington St, Hoboken, NJ | 07030 | [Ionic Breathe Crib and Toddler Mattress with Cloud Core](https://www.deltachildren.com/products/ionic-breathe-crib-and-toddler-mattress-with-cloud-core) | Shipping methods are shown. The leading zero is kept |
| Ship to 25 Dorrance St, Providence, RI 02903, and the ZIP stays 02903 | 25 Dorrance St, Providence, RI | 02903 | [By The Bed Twin City Sleeper Bassinet](https://www.deltachildren.com/products/by-the-bed-twin-city-sleeper-bassinet) | Shipping methods are shown. The leading zero is kept |
| Ship to 149 Church St, Burlington, VT 05401, and the ZIP stays 05401 | 149 Church St, Burlington, VT | 05401 | [GapKids Toddler Bed](https://www.deltachildren.com/products/gap-kids-toddler-bed) | Shipping methods are shown. The leading zero is kept |
| Ship to 550 Main St, Hartford, CT 06103, and the ZIP stays 06103 | 550 Main St, Hartford, CT | 06103 | [Poppy House Twin Bed](https://www.deltachildren.com/products/poppy-house-twin-bed) | Shipping methods are shown. The leading zero is kept |
| Ship to 107 N Main St, Concord, NH 03301, and the ZIP stays 03301 | 107 N Main St, Concord, NH | 03301 | [Crave 4-in-1 Convertible High Chair](https://www.deltachildren.com/products/crave-4-in-1-convertible-high-chair) | Shipping methods are shown. The leading zero is kept |
| Ship to 800 N French St, Wilmington, DE 19801 | 800 N French St, Wilmington, DE | 19801 | [Icon Ultra Compact Everyday & Travel Stroller](https://www.deltachildren.com/products/icon-ultra-compact-everyday-travel-stroller) | Shipping methods are shown |

## South

| Scenario | Address | ZIP | Product | Expected result |
| --- | --- | --- | --- | --- |
| Ship to 3500 Pan American Dr, Miami, FL 33133 | 3500 Pan American Dr, Miami, FL | 33133 | [Dylan 4-in-1 Convertible Crib](https://www.deltachildren.com/products/dylan-4-in-1-convertible-crib) | Shipping methods are shown |
| Ship to 55 Trinity Ave SW, Atlanta, GA 30303 | 55 Trinity Ave SW, Atlanta, GA | 30303 | [Essex 6 Drawer Dresser with Interlocking Drawers](https://www.deltachildren.com/products/essex-6-drawer-dresser-with-interlocking-drawers) | Shipping methods are shown |
| Ship to 901 Bagby St, Houston, TX 77002 | 901 Bagby St, Houston, TX | 77002 | [Luna Nursery Swivel Glider](https://www.deltachildren.com/products/luna-nursery-swivel-glider) | Shipping methods are shown |
| Ship to 1300 Perdido St, New Orleans, LA 70112 | 1300 Perdido St, New Orleans, LA | 70112 | [CleanEarth Certified Organic Crib and Toddler Mattress](https://www.deltachildren.com/products/cleanearth-certified-organic-crib-and-toddler-mattress) | Shipping methods are shown |

## Midwest

| Scenario | Address | ZIP | Product | Expected result |
| --- | --- | --- | --- | --- |
| Ship to 233 S Wacker Dr, Chicago, IL 60606 | 233 S Wacker Dr, Chicago, IL | 60606 | [babyGap Deluxe Whisper Bedside Bassinet](https://www.deltachildren.com/products/babygap-deluxe-whisper-bedside-bassinet) | Shipping methods are shown |
| Ship to 350 S 5th St, Minneapolis, MN 55415 | 350 S 5th St, Minneapolis, MN | 55415 | [Logan Wood Toddler Bed](https://www.deltachildren.com/products/logan-wood-toddler-bed-greenguard-gold-certified) | Shipping methods are shown |
| Ship to 225 4th St N, Fargo, ND 58102 | 225 4th St N, Fargo, ND | 58102 | [Cora Wood Twin Bed with Removable Guardrails](https://www.deltachildren.com/products/cora-wood-twin-bed-with-removable-guardrails) | Shipping methods are shown |

## West and Mountain

| Scenario | Address | ZIP | Product | Expected result |
| --- | --- | --- | --- | --- |
| Ship to 1 Apple Park Way, Cupertino, CA 95014 | 1 Apple Park Way, Cupertino, CA | 95014 | [babyGap Callie 4-in-1 Upholstered Crib](https://www.deltachildren.com/products/babygap-callie-4-in-1-upholstered-crib) | Shipping methods are shown |
| Ship to 455 N Rexford Dr, Beverly Hills, CA 90210 | 455 N Rexford Dr, Beverly Hills, CA | 90210 | [babyGap Hudson Glider Tub Chair with 360-Degree Swivel](https://www.deltachildren.com/products/hudson-glider-tub-chair-with-360-degree-swivel) | Shipping methods are shown |
| Ship to 400 Broad St, Seattle, WA 98109 | 400 Broad St, Seattle, WA | 98109 | [Jeep Wrangler Deluxe Stroller Wagon with Cooler Bag](https://www.deltachildren.com/products/jeep-deluxe-wrangler-wagon-stroller-with-cooler-bag-and-parent-organizer-by-delta-children) | Shipping methods are shown |
| Ship to 1221 SW 4th Ave, Portland, OR 97204 | 1221 SW 4th Ave, Portland, OR | 97204 | [Collins Wood Toddler Bed](https://www.deltachildren.com/products/collins-wood-toddler-bed-greenguard-gold-certified) | Shipping methods are shown |
| Ship to 1437 Bannock St, Denver, CO 80202 | 1437 Bannock St, Denver, CO | 80202 | [Smart Sleep Baby Monitor with Floor Stand](https://www.deltachildren.com/products/smart-sleep-baby-monitor-with-floor-stand) | Shipping methods are shown |
| Ship to 495 S Main St, Las Vegas, NV 89101 | 495 S Main St, Las Vegas, NV | 89101 | [Hex-Lite Travel Pop-Up Play Yard](https://www.deltachildren.com/products/jeep-hex-lite-travel-pop-up-play-yard) | Shipping methods are shown |
| Ship to 451 S State St, Salt Lake City, UT 84111 | 451 S State St, Salt Lake City, UT | 84111 | [Penelope 6-in-1 Convertible Crib](https://www.deltachildren.com/products/penelope-6-in-1-convertible-crib-greenguard-gold-certified) | Shipping methods are shown |
| Ship to 210 N 27th St, Billings, MT 59101 | 210 N 27th St, Billings, MT | 59101 | [Nest 4-in-1 Convertible Crib](https://www.deltachildren.com/products/nest-4-in-1-convertible-crib) | Shipping methods are shown |

## Rural and remote

| Scenario | Address | ZIP | Product | Expected result |
| --- | --- | --- | --- | --- |
| Ship to 300 N Highland Ave, Marfa, TX 79843 | 300 N Highland Ave, Marfa, TX | 79843 | [Beautyrest Black AIRCOOL Two-Stage Crib and Toddler Mattress](https://www.deltachildren.com/products/aircool-two-stage-crib-and-toddler-mattress) | Shipping methods are shown |
| Ship to 1338 Rumsey Ave, Cody, WY 82414 | 1338 Rumsey Ave, Cody, WY | 82414 | [Finley Metal Toddler Bed with Spindles](https://www.deltachildren.com/products/finley-metal-toddler-bed-with-spindles) | Shipping methods are shown |

## ZIP shared by two states

| Scenario | Address | ZIP | Product | Expected result |
| --- | --- | --- | --- | --- |
| Ship to 39 Screaming Eagle Blvd, Fort Campbell, KY 42223 | 39 Screaming Eagle Blvd, Fort Campbell, KY | 42223 | [Olivia Upholstered Twin Bed](https://www.deltachildren.com/products/olivia-upholstered-twin-bed) | Shipping methods are shown |
| Ship to 100 S Main St, Texhoma, OK 73949 | 100 S Main St, Texhoma, OK | 73949 | [babyGap Classic Stroller](https://www.deltachildren.com/products/baby-gap-classic-stroller) | Shipping methods are shown |

## ZIP+4

| Scenario | Address | ZIP | Product | Expected result |
| --- | --- | --- | --- | --- |
| Ship to 1 Market St, San Francisco, CA 94105-1234, and the ZIP stays 94105-1234 | 1 Market St, San Francisco, CA | 94105-1234 | [Bondi Beechwood By The Bed Bassinet](https://www.deltachildren.com/products/bondi-beechwood-by-the-bed-bassinet) | Shipping methods are shown. The ZIP+4 stays complete |
| Ship to 1 City Hall Sq, Boston, MA 02201-1234, and the ZIP stays 02201-1234 | 1 City Hall Sq, Boston, MA | 02201-1234 | [Apollo Jogging Stroller](https://www.deltachildren.com/products/apollo-jogging-stroller) | Shipping methods are shown. The leading zero and the ZIP+4 stay complete |

## SHIPPING NOT AVAILABLE FOR PO BOX

Separate describe. Shopify must show the warning and the test must not place the order.

| Scenario | Address | ZIP | Product | Expected result |
| --- | --- | --- | --- | --- |
| Shipping is not available to PO Box 1234, Austin, TX 78767 | PO Box 1234, Austin, TX | 78767 | [Blue Gingham Fitted Crib Sheets - 2 Pack](https://www.deltachildren.com/products/blue-gingham-fitted-crib-sheets-2-pack) | Warning: "Shipping not available. Your order cannot be shipped to the selected address. Review your address to ensure it's correct and try again, or select a different address." |
