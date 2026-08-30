# Luna product and design roadmap

Luna is a field atlas for the living Moon: one calm instrument that connects a selected date to phase, local timing, observation guidance, lunar geography, and noteworthy sky events.

## Shipped — Interactive field atlas

- A cinematic “Moon now” hero with a 29-day scrubber and eight clickable phase stops.
- A responsive month calendar where every date updates one persistent observation inspector.
- Local moonrise, moonset, nautical-darkness timing, and viewing guidance for five cities or optional device location.
- Calendar filters for phases, eclipses, and meteor showers.
- A local “Plan this night” state without an account or external service.
- Six interactive lunar field notes with image hotspots, facts, and next/previous navigation.
- A filterable year event index that jumps directly to the relevant calendar date.
- Keyboard focus states, reduced-motion support, touch-friendly mobile layouts, and a refreshed social card.

## Competitive position

- NASA’s tools lead with authoritative imagery, missions, and surface exploration.
- Timeanddate leads with exhaustive tables and location-specific timing.
- Planetarium tools lead with simulated sky navigation.
- Consumer moon calendars lead with quick phase lookup and event articles.
- Luna’s distinctive position is the connection between these jobs: date → phase → local sky clock → what to notice → where to learn, inside one editorial experience.

## Next — Observation planning

- Export one selected night as an `.ics` calendar event.
- Add a printable red-light observation sheet with the selected date, timing, and targets.
- Add a compact year navigator and direct next-new-moon / next-full-moon shortcuts.
- Persist saved nights locally with a small review rail.
- Add optional orientation guidance for northern- and southern-hemisphere views.

## Later — Deeper lunar knowledge

- Expand the atlas into thematic paths: first binocular targets, Apollo sites, ray systems, maria, and the moving terminator.
- Add a guided “first five nights” learning sequence that responds to the actual phase.
- Add source notes to each field entry and expose calculation assumptions in a compact methods panel.
- Add shareable, date-specific field cards while keeping core UI text code-native.

## Optional — Clear-sky conditions

- Add cloud cover, transparency, and seeing only after a provider and privacy boundary are approved.
- Keep all astronomy calculations and field notes useful when weather data is unavailable.
- Explain exactly what location information leaves the browser before requesting access.

## Design principles

- One selected date drives every surface.
- Editorial calm over dashboard density.
- Progressive disclosure: phase and timing first, context and science second.
- No account, database, or runtime data provider until it clearly improves observation planning.
- Estimates and location-dependent visibility stay clearly labeled.
- Every primary interaction must work with mouse, touch, and keyboard.
