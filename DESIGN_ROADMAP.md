# Luna design roadmap

Luna should stay calm, simple, and useful. New features should deepen the night-sky experience without turning the page into a dense astronomy dashboard.

## Shipped — Interaction foundation

- Make every calendar date selectable.
- Show moon phase, illumination, lunar age, and simple observing guidance.
- Expand eclipse and meteor-shower dates into useful event details.
- Use the same detail panel from both the calendar and event list.
- Support keyboard controls, Escape-to-close, mobile bottom-sheet behavior, and nearby-date navigation.

## Current release — Local sky lens

The highest-value next addition is now implemented without a runtime data service.

- Choose from five cities or optionally use the browser’s approximate location.
- Calculate local moonrise, moonset, nautical dusk, and viewing guidance on the device.
- Translate sky times into the selected location’s time zone.
- Adjust viewing guidance for bright moonlight, meteor showers, and eclipses.
- Keep location optional, avoid a runtime external service, and label calculations as estimates.

## Next — Better discovery

- Add filters for moon phases, eclipses, meteor showers, and planetary events.
- Add a year-at-a-glance event timeline beneath the monthly calendar.
- Let users jump directly to the next new moon, full moon, or cosmic event.
- Add a compact month picker while preserving the current previous/next controls.
- Use subtle color or symbols to distinguish event types without adding visual noise.

## Later — Personal planning

- Let users save events locally without requiring an account.
- Offer “Add to calendar” downloads for selected events.
- Add a share link or event card for a chosen date.
- Add optional reminders only after the basic save flow is useful.
- Keep notification permission separate and user-controlled.

## Optional — Clear-sky conditions

- Add cloud cover, precipitation, and visibility only after approving a weather provider.
- Keep the astronomy calculations useful when weather data is unavailable.
- Explain which information leaves the browser before requesting access.

## Learning layer

- Add short, plain-language phase explanations.
- Explain how to safely view solar eclipses.
- Add constellation and direction hints for meteor showers.
- Introduce a small glossary that opens in context rather than a separate reference page.

## Design principles

- Progressive disclosure: show the date and phase first, deeper information on demand.
- Calm hierarchy: parchment, charcoal, and orange remain the core palette.
- One interaction pattern: use the same detail panel everywhere.
- Mobile-first touch targets with complete keyboard support.
- Honest data: identify estimates and make location-dependent visibility clear.
- No account, database, or external service until it clearly improves the core experience.
