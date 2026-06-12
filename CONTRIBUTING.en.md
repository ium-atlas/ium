[한국어](CONTRIBUTING.md) | English

# Contribution Guide

All IUM content is stored as JSON files under `data/topics/`. You can contribute even if you do not know how to code.

## First Principle: We Do Not Accept Unsourced Narratives

Because this project deals with "multiple perspectives," it is always exposed to accusations of bias. The only defense is sources.

- Every `narrative` must have a `sources` array with at least one entry
- Narratives must be **"quotations from records," not "my interpretation."**
  ✅ "Ibn al-Athir recorded that ..." / ❌ "The Arabs probably thought that ..."
- Source format: `author/institution, title, (volume/page), (year)` — whenever possible, use primary sources or approved textbooks

## Weight Scoring Criteria

`weight` (0-100) means "the weight this event holds in the historical narrative tradition of that perspective."

| Range | Meaning | Example |
|---|---|---|
| 90-100 | A central event in that civilization's historical narrative | Fall of Jerusalem (Europe 95), Fall of Baghdad (Islam 100) |
| 60-89 | Described in detail as a major event | Siege of Antioch (Europe 80) |
| 30-59 | Mentioned, but with limited weight | Nicaea (Arab 35) |
| 10-29 | Briefly recorded | Ma'arrat al-Nu'man (Europe 25) |
| 0-9 | Effectively no record — **not shown on the map** | Council of Clermont (Arab 5) |

PRs that change a weight must state the basis, such as textbook coverage or comparison of source narrative volume.
If contemporary weight and modern reinterpretation weight differ greatly, you may add a `weight_modern` field.

## How to Contribute

### 1. Report Errors or Suggest Sources (Easiest)
Please report them with the [issue template](../../issues/new/choose).

### 2. Add or Edit an Event by PR
1. Add a JSON file under `data/topics/<topic>/events/` (schema: `schema/event.schema.json`)
2. File name: `<event-id>.json` (lowercase, hyphenated, year recommended: `kuju-1231.json`)
3. Local validation: `node scripts/validate.js`
4. Submit a PR — CI automatically validates the schema

### 3. Suggest a New Topic
Please suggest it by issue first. Good topics have these conditions:
- Large asymmetry of weight between perspectives
- Sources exist from at least three perspectives
- Geographic development exists (routes and key locations)

## Event Types (`type`)

`battle` (battle) `siege` (siege) `massacre` (massacre) `council` (council/declaration) `political` (politics/accession) `treaty` (treaty/peace) `movement` (capital relocation/movement) `culture` (culture/religion)

If a new type is needed, please suggest it by issue.

## License Agreement

By submitting a PR, you are considered to agree that contributed data will be distributed under CC BY-SA 4.0 and code under MIT.

## Code of Conduct

We deal with sensitive history, including massacres, conflicts, and territorial issues. Derogatory statements about specific ethnic or religious groups, unsourced assertions, and projection of modern political disputes are prohibited. We deal not with "who was right," but with "who recorded it how."
