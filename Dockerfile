# Statische Website für den Hetzner-Server (hinter dem Edge-Caddy, siehe
# pferdestaerken-server). /beratung/* bedient die Akte-App — hier nicht enthalten.
FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY . /srv
RUN rm -r /srv/deploy
