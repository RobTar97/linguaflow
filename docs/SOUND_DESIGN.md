# Sound design

LinguaFlow uses sound as quiet confirmation, not decoration. A learner must be
able to understand and complete every flow with the application muted.

## Product rules

- Sound effects are enabled initially and can be muted from every main header.
- The preference persists in the current browser.
- Playback starts only after a user interaction or a live-room question update
  in a session the student deliberately joined.
- Hidden tabs stay silent. Browser autoplay refusal never blocks an action.
- There is no ambient loop, spoken cue, error alarm, or sound for routine
  browsing and selection.

## Cue inventory

| Cue | Asset | Use | Duration | App volume |
|---|---|---|---:|---:|
| Question step | `public/audio/question-step.mp3` | Advancing a guided question or receiving a live question change | 0.6 s | 22% |
| Action success | `public/audio/action-success.mp3` | Completing setup, joining or creating a room, copying a classroom link, or finishing a session | 0.9 s | 20% |
| Sound enabled | `public/audio/sound-enabled.mp3` | Preview after turning sound back on | 0.5 s | 18% |

The interface always pairs these cues with visible state: changed question
content, a copied label, a new room, or completed navigation.

## Asset provenance

The current sounds were generated on 2026-07-29 with ElevenLabs
text-to-sound-effects v2 as MP3 at 44.1 kHz and 32 kbps. Looping was disabled.
These are the source prompts:

- Question step: “A very short, warm two-note upward UI cue for advancing to
  the next conversation question, soft felt mallet and tiny glass tone,
  friendly educational app, clean, subtle, no reverb tail, no voice.”
- Action success: “A short gentle success chime for a friendly language
  learning app, warm soft bell with a quiet sparkling finish, reassuring and
  calm, not triumphant, no voice.”
- Sound enabled: “An extremely short soft wooden UI tick with a tiny bright
  click, friendly and tactile, confirming sound has been enabled, no voice, no
  ambience, no reverb.”

No generation credential is used by, bundled into, or required by the
application.

## Contributing audio

1. Keep an interface cue below one second unless a clear usability need requires
   more time.
2. Avoid speech, harsh alarms, long reverb tails, and culturally specific
   success motifs.
3. Normalize for quiet playback and test with headphones and laptop speakers.
4. Keep the action fully understandable when muted.
5. Confirm you have the rights to distribute the contribution.
6. Update the inventory, changelog, and performance budget when assets change.
7. Test enable, mute, reload persistence, hidden-tab behavior, and live-room
   synchronization.

Run `npm run check` before submitting. The production build enforces both
per-file and total audio budgets.
