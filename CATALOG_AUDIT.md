# Catalog audit — 2026-10-19

This is a dated data audit, not a claim that all mappings are authoritative.
The catalog now has 33 entries: all 30 institution names in the retrieved CBI
registry and three inherited records absent from that snapshot. Institution IDs
were matched to the CBI branch selector and all three result pages were checked.
Listed does not mean that every historical card prefix remains operational.

## Changes

- Update 2026-10-22: added Middle East Bank card prefix 505809 alongside 585947.
  The pinned Griphook and iran-bank-detector catalogs corroborate the mapping;
  issuer verification remains pending. Their URLs and review dates are recorded
  in catalog-audit.json. The original CBI registry snapshot was not rechecked.
- Removed 585983 from Gardeshgari. Tejarat's own card page explicitly identifies
  this prefix; it now detects Tejarat instead of returning an ambiguous result.
- Added Central Bank (010), Iran–Venezuela (095), and the Iran–Europe institution.
  No card prefixes, brand colors or logo assets were invented for these entries.
- 010 and 095 also occur in Vandar's historical IBAN table. CBI institution ID
  097 is not enabled as an IBAN mapping without direct IBAN-code evidence.
- Ayandeh, Ansar and Kosar remain as historical records with not_listed status
  in the original registry snapshot. Update 2026-10-22: documented succession
  resolves Ayandeh detection to Melli and Ansar/Kosar detection to Sepah, for
  both card and IBAN identifiers. Sources and the distinction between deposit
  transfer and merger are recorded separately in catalog-audit.json. Melal has
  no successor mapping. Historical identifiers and original logos are retained.

## Evidence and review status

The machine-readable [catalog-audit.json](catalog-audit.json) records evidence
for every entry and each card prefix. Review dates belong to sources; an audit
date is not a source publication date. Registry status and IBAN/prefix confidence
are separate. All inherited prefixes except the issuer-documented 585983 remain
pending source verification. The five inherited IBAN codes absent from Vandar's
table also remain pending, as does the candidate 097.

| Key            | IBAN code                   | Registry snapshot | IBAN evidence       | Issuer-documented prefixes |
| -------------- | --------------------------- | ----------------- | ------------------- | -------------------------- |
| mellat         | 012                         | listed            | provider_documented | —                          |
| melli          | 017                         | listed            | provider_documented | —                          |
| saderat        | 019                         | listed            | provider_documented | —                          |
| tejarat        | 018                         | listed            | provider_documented | 585983                     |
| sepah          | 015                         | listed            | provider_documented | —                          |
| refah          | 013                         | listed            | provider_documented | —                          |
| maskan         | 014                         | listed            | provider_documented | —                          |
| keshavarzi     | 016                         | listed            | provider_documented | —                          |
| post-bank      | 021                         | listed            | provider_documented | —                          |
| tosee-taavon   | 022                         | listed            | provider_documented | —                          |
| tosee-saderat  | 020                         | listed            | pending             | —                          |
| sanat-madan    | 011                         | listed            | provider_documented | —                          |
| eghtesad-novin | 055                         | listed            | provider_documented | —                          |
| parsian        | 054                         | listed            | provider_documented | —                          |
| pasargad       | 057                         | listed            | provider_documented | —                          |
| saman          | 056                         | listed            | provider_documented | —                          |
| sina           | 059                         | listed            | provider_documented | —                          |
| sarmayeh       | 058                         | listed            | provider_documented | —                          |
| shahr          | 061                         | listed            | provider_documented | —                          |
| mehr-iran      | 060                         | listed            | pending             | —                          |
| karafarin      | 053                         | listed            | provider_documented | —                          |
| day            | 066                         | listed            | provider_documented | —                          |
| iran-zamin     | 069                         | listed            | provider_documented | —                          |
| khavarmianeh   | 078                         | listed            | pending             | —                          |
| gardeshgari    | 064                         | listed            | provider_documented | —                          |
| resalat        | 070                         | listed            | provider_documented | —                          |
| ayandeh        | 062                         | not_listed        | provider_documented | —                          |
| ansar          | 063                         | not_listed        | provider_documented | —                          |
| kosar          | 073                         | not_listed        | pending             | —                          |
| melal          | 075                         | listed            | pending             | —                          |
| central-bank   | 010                         | listed            | provider_documented | —                          |
| iran-venezuela | 095                         | listed            | provider_documented | —                          |
| iran-europe    | unconfirmed (candidate 097) | listed            | pending             | —                          |

## Sources

- [CBI registry](https://www.cbi.ir/BanksInstitutions/BankInstitute.aspx):
  three result pages, 30 entries; retrieved 2026-10-19.
- [Tejarat card information](https://www.tejaratbank.ir/web_directory/1495-Business-Cards.html):
  issuer confirmation for 585983; retrieved 2026-10-19.
- [Vandar bank-code documentation](https://vandarpay.github.io/docs/banks/):
  page states last update 1399/11/10; retrieved 2026-10-19.

## Remaining work

Obtain issuer evidence for pending prefixes and direct IBAN evidence for pending
codes. Obtain dated regulator/issuer notices before labeling institutions merged
or closed. Add sourced, redistributable logos for the three new entries; the
source/license audit for Pasargad's inherited PNG is still pending.
The other 29 existing logos now have documented vector sources;
see [logos/SOURCES.md](logos/SOURCES.md). Detection preserves pending
mappings for compatibility and is not an authoritative account verification API.
