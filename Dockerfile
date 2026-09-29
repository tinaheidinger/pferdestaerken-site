# Statische Website für den Hetzner-Server (hinter dem Edge-Caddy, siehe
# pferdestaerken-server). /beratung/* bedient die Akte-App — hier nicht enthalten.
#
# Läuft als Nicht-root ohne jede Capability: Caddy lauscht auf 8080, und die
# File-Capability des Binaries wird entfernt (sonst verweigert der Kernel den Start,
# wenn der Container alle Capabilities abgibt).
FROM caddy:2-alpine@sha256:6aeddd44c3078b0f9a35206472a11420648a79c184603ef95957d0a20044cb2b
RUN apk add --no-cache libcap \
 && setcap -r /usr/bin/caddy \
 && apk del libcap
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY . /srv
RUN rm -r /srv/deploy
USER 65532:65532
EXPOSE 8080
