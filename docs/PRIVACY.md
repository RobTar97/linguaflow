# Privacy and classroom data

LinguaFlow is designed to collect very little data.

## Stored in the user’s browser

- display name;
- interface, support, and target languages;
- CEFR level and saved topic IDs;
- the current room reference;
- a teacher authorization token when that browser creates a room.

This information uses browser `localStorage`. Users can remove it through
browser site-data controls or reset their LinguaFlow setup.

## Stored by the Cloudflare room service

- room code, room name, and teacher display name;
- selected topic, languages, level, and current question;
- participating students’ display names and generated session IDs.

Rooms automatically expire after eight hours. Ending a room deletes its state
immediately. LinguaFlow does not provide attendance records or permanent
conversation history.

## Not collected by this repository

- email addresses or account passwords;
- audio, video, or conversation transcripts;
- precise location, advertising identifiers, or analytics cookies;
- payment information.

Deployers are responsible for publishing contact details and any additional
notice required by their jurisdiction or institution. Teachers should use
first names, initials, or classroom nicknames and must not place sensitive
student information in room names.
