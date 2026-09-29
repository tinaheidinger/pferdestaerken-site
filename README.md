Static website for [pferdestaerken.at](https://pferdestaerken.at).

## Hosting

Served from the Hetzner server as a small Caddy container (`Dockerfile`,
`deploy/Caddyfile`) behind the shared edge Caddy (private repo `pferdestaerken-server`).
Every push to `main` builds the image and deploys it (`.github/workflows/deploy-server.yml`,
secrets in the `prod` environment).

`/beratung/*` is not part of this site: the Beratungsakten are served by a separate
app from a private repo. `beratung/`, `tools/beratung/` and `assets/beratung*` are left
over from the old client-side encrypted version and are excluded from the image
(`.dockerignore`); they are removed once the move is complete.
