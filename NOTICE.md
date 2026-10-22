# Data and logo notice

The 2026-10-19 catalog audit covers 33 records: 30 names listed in the retrieved
CBI registry and three inherited records absent from that snapshot. This is not
a claim of operational validity for every card prefix or IBAN. Registry presence,
historical identifiers, and mapping confidence are separate concerns.

See [catalog-audit.json](catalog-audit.json)
for dated evidence, pending verification and source links for every record.
Tejarat's own website supports prefix 585983; the erroneous Gardeshgari mapping
has been removed. Other inherited card prefixes remain pending issuer evidence.
The CBI institution ID 097 is pending direct IBAN evidence and is not enabled as
an IBAN mapping.

Update 2026-10-22: detection resolves historical Ayandeh identifiers to Melli
and Ansar/Kosar identifiers to Sepah. Original catalog entries and logo assets
remain for historical use. Successor evidence is separate from prefix and IBAN
verification; this resolution does not convert account or Sheba numbers.

Update 2026-10-22: All 30 existing logos were visually reviewed and now use SVGs
from documented vector sources. All PNGs were removed, including Pasargad's
inherited image; Pasargad now uses the sourced yellow vector artwork.
Refah uses the documented 2022 redesign; direct verification from the bank was unsuccessful.
See [logos/SOURCES.md](logos/SOURCES.md) for original files, pinned sources,
attribution, license information and rendering details.

The three added institutions have no logo asset.
Bank names and logos identify their respective institutions;
no endorsement or ownership of their trademarks is claimed. The MIT code license
does not relicense third-party logos or trademarks.

## Remaining verification

- Only card prefix `585983` has recorded issuer confirmation. The other 40
  prefixes, including Khavarmianeh's `505809`, remain pending issuer evidence;
  software catalogs corroborate some mappings but do not certify operation.
- Five included IBAN mappings (`020`, `060`, `078`, `073`, `075`) lack direct
  IBAN evidence. Another 27 are documented in Vandar's historical table dated
  `1399/11/10`. Neither set establishes current account activity. Iran–Europe's
  candidate institution ID `097` remains excluded from IBAN detection.
- The original CBI snapshot was retrieved on 2026-10-19; it is not a live registry.
  Review dates, source URLs and evidence confidence are retained per record in
  `catalog-audit.json`. Source pages are not archived in full in this repository.
- Validation checks structure and checksum, not account existence, ownership or
  activity. Historical identifiers resolve to successor banks without converting
  card, account or Sheba numbers. Sample full numbers are synthetic fixtures.
- Central Bank, Iran–Venezuela and
  Iran–Europe have no logo; Iran–Europe also has no confirmed card/IBAN identifier.
  Existing bank colors have not been independently checked against brand guides.
- ESM is provided; CommonJS is not. The complete declared Node/React version
  matrix and all browsers/webviews have not been tested. Bundled image data
  increases logo-entrypoint size and requires `data:` in a page's `img-src` CSP;
  importing core utilities does not load logo data.
