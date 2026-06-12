[한국어](README.md) | English

<div align="center">

# 🗺️ IUM — History from Multiple Perspectives

**Same event, different memories.** IUM is an interactive historical atlas that lays historical events out on a map and shows how *differently* and how *importantly* each civilization remembers them.

*Interactive historical atlas showing how the same event is remembered differently — and how much it matters — across civilizations.*

[View Demo](#getting-started) · [Contribute](CONTRIBUTING.en.md) · [한국어](README.md)

</div>

---

## Why We Built It

The Crusades are a central event of the medieval period in European history, but in contemporary Arab chronicles they were a small-scale frontier conflict.
The Mongol invasions of Goryeo are a major event in Korean history, but in Mongol records they were one of several frontier campaigns.

**Historical weight differs by perspective.** IUM shows this "asymmetry of weight" on a map at a glance.

## Core Features

- **Perspective layers** — Translucent circles for each perspective, such as European / Arab-Islamic / Byzantine / Goryeo / Mongol, overlap on the map; circle size = the weight from that perspective
- **Timeline playback** — Campaign routes and events unfold chronologically, and the camera follows regions where events cluster
- **Perspective-by-perspective narrative comparison** — Click an event to compare each civilization's source- and textbook-based narrative side by side, with citations
- **Historical territories** — Shows state borders at the relevant moment (approximate)
- **Era filters** — Explore topics by era, from 3000 BCE to the present

## Getting Started

```bash
git clone https://github.com/ium-atlas/ium.git
cd ium
# The prototype is a dependency-free single HTML file; open it directly
open prototype/index.html
```

## Data Structure

All historical content is stored as JSON files under `data/topics/`. **You can contribute even if you do not know how to code.**

```
data/topics/crusade-1/
  topic.json            # Topic metadata (period, perspective list, map bounds)
  events/jerusalem-1099.json   # One event = one file
  routes.geojson        # Campaign route
```

Example event file:

```jsonc
{
  "id": "jerusalem-1099",
  "name": "Fall of Jerusalem",
  "type": "siege",            // battle | siege | massacre | council | political | treaty | movement | culture
  "date": "1099-07",
  "location": { "lng": 35.23, "lat": 31.78 },
  "perspectives": {
    "eu":  { "name": "Liberation of Jerusalem",      "weight": 95, "narrative": "...", "sources": ["..."] },
    "ar":  { "name": "Fall and Massacre of Jerusalem", "weight": 70, "narrative": "...", "sources": ["..."] },
    "byz": { "name": "(Political distance)",          "weight": 30, "narrative": "...", "sources": ["..."] }
  }
}
```

`weight` (0-100) is the core of this project: the weight an event holds in the historical narrative tradition of each perspective. See [CONTRIBUTING.en.md](CONTRIBUTING.en.md#weight-scoring-criteria) for the scoring criteria.

## Contributing

- 🐛 **Report errors or suggest sources** — [Open an issue](../../issues/new/choose). This is the easiest way to contribute
- 📜 **Add or improve an event** — Submit a PR with a single JSON file. Sources are required for every narrative
- 🌍 **Suggest a new topic** — Events with large perspective asymmetries are especially welcome

Please read [CONTRIBUTING.en.md](CONTRIBUTING.en.md) for the detailed rules. CI automatically validates the schema for every PR.

## Roadmap

- [x] Prototype (First Crusade, Mongol Empire and Goryeo)
- [ ] Automatic data ↔ prototype integration (data is currently embedded in the prototype)
- [ ] Next.js site (static pages per event, SEO)
- [ ] English version
- [ ] In-site contribution form

## License

- **Code**: [MIT](LICENSE)
- **Data** (`data/`): [CC BY-SA 4.0](data/LICENSE) — Free to use, including commercially, as long as you provide attribution and share under the same terms
