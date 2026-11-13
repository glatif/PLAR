# PLAR web app: container image. Modelled on the living-heritage image already on the server
# (same base, so the server reuses its cached node:22-bookworm-slim layers).
#
# NEXT_PUBLIC_* values are inlined into the bundle by `next build`, so they are build args.
# They are public by design (Supabase URL + publishable key). No secrets are baked in.

# ---------- dependencies ----------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# postinstall runs scripts/setup-verification.mjs, so the script must be present.
COPY scripts ./scripts
# Same npm major as the one that wrote package-lock.json (npm 10 rejects it: optional @emnapi entries).
RUN npm install -g npm@11.6.2 && npm ci

# ---------- build ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
# "true" switches the identity-verification lab (/verify, /testing) on. Pages are rendered at build
# time, so it's needed here as well as at runtime (.env.local).
ARG VERIFICATION_LAB=false
ENV VERIFICATION_LAB=$VERIFICATION_LAB
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN test -n "$NEXT_PUBLIC_SUPABASE_URL" && test -n "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
 || (echo "ERROR: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY build args are required" && exit 1)

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# public/vendor (OpenCV.js, MediaPipe runtime + face model) is not in git: put it in place.
RUN node scripts/setup-verification.mjs
RUN npm run build

# ---------- runtime ----------
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts

# Lab captures (face photos, videos, ID photos) live here, on a named volume so redeploys keep them.
# Created in the image so a new volume starts out owned by the node user.
RUN mkdir -p /app/.verification-data && chown -R node:node /app
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/sign-in').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
