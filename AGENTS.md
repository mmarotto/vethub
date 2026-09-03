# vethub

Full-stack pet-clinic demo (workshop project). `server/` = Spring Boot 4 (Java 25,
Gradle Kotlin DSL). `client/` = SvelteKit 5 + TypeScript (Bun). No root
package.json — the two apps are managed independently. No CI, no README.

## Toolchain

Managed by `mise.toml` (Java Temurin 25, Bun 1.3.0, Node 22.20.0). It also sets
`SERVER_PORT=8080` and `SPRING_PROFILES_ACTIVE=dev` as env vars — run under
`mise` or export these yourself before starting the backend.

## Server (`server/`)

- Run: `./gradlew bootRun` — starts on `http://localhost:8080`, context-path `/api`.
- Test: `./gradlew test` (all) or `./gradlew test --tests "fully.qualified.ClassName"` (single class).
- Full verification: `./gradlew check` — runs tests + Checkstyle + PMD + SpotBugs + CodeNarc + Spotless-check (configs in `src/quality/config/`).
- **`JavaCompile` auto-runs `spotlessApply` first** (build.gradle.kts:~200) — code gets reformatted in place on every compile, not just checked. Compiler flags include `-Xlint:all -Werror`, so warnings fail the build.
- DB is H2 **in-memory** (`jdbc:h2:mem:demodb`) — all data resets on every restart. Schema + seed data come from Liquibase (`src/main/resources/db/changelog/`), split into `prd` context (schema, always runs) and `tst` context (seed data, dev/test profile only, `drop-first: true`).
- Seed data uses fixed IDs: vets 1–6, pet types 1–6, specialties 1–3. Tests (see `support/IntegrationTest.java`) clean up by deleting anything with `id > 6` / `id > 3` — keep this in mind when adding new seed rows or fixtures so you don't collide with reserved IDs.
- Test base classes: extend `support/UnitTest.java` (Mockito, `aValidX()` factories) for unit tests, or `support/IntegrationTest.java` (`aSavedX()` / `aCreateXRequest()` / `anUpdateXRequest()` factories, full Spring context) for integration tests.
- **Security is currently wide open**: `WebSecurityConfig` has `.anyRequest().permitAll()` even though HTTP Basic + a dev user (`user`/`password`) are configured. Don't assume auth is enforced anywhere right now.
- Full path structure = `context-path (/api)` + `management.base-path (/v1/public/actuator)` / `springdoc path (/v1/public/docs)`. Real endpoints:
  - Health: `http://localhost:8080/api/v1/public/actuator/health`
  - OpenAPI spec: `http://localhost:8080/api/v1/public/docs`
  - **`scripts/common.sh`'s `HEALTH_URL` is wrong** (`.../api/actuator/health`, missing `/v1/public`) — it 404s, so `wait_for_backend` (used by `scripts/openapi-sync.sh` / `client` `sync:api`) always burns the full 120s timeout and fails even when the backend started fine. Fix the URL or start the backend manually with `./gradlew bootRun` and poll the correct health URL yourself instead of trusting that script.
- Swagger UI: `http://localhost:8080/api/v1/public/docs/openapi.html`. The API surface is a fully symmetric REST CRUD per resource (`GET/POST` on the collection, `GET/PUT/DELETE /{id}` on the item, no `PATCH`) — check this UI or the OpenAPI JSON directly for current routes/schemas rather than trusting a stale list here. One non-obvious structural fact: only **pets** and **visits** have both flat (`/v1/pets`, `/v1/visits`) *and* owner/pet-nested (`/v1/owners/{ownerId}/pets`, `/v1/owners/{ownerId}/pets/{petId}/visits`) routes for the same data; vets, pet-types, and specialties are flat-only.

## Client (`client/`)

- Package manager is **Bun**, not npm/yarn (`bun.lock`). Use `bun install` / `bun run <script>`.
- `bun run dev` / `bun run build` / `bun run preview`.
- `bun run check` is the only verification script — `svelte-kit sync` + `svelte-check` (typecheck only; there is no lint config and no test runner in this package).
- API types (`src/lib/types/api.d.ts`) and `server/openapi.json` are **generated, not hand-written** — regenerate via `bun run download:api` (backend must already be running) + `bun run generate:api`, or the full `bun run sync:api` pipeline (which currently fails due to the health-check bug above).
- **Never call a mutating array method (`.sort()`, `.reverse()`, `.splice()`, etc.) directly on `$state` inside markup** (e.g. `{#each pet.visits.sort(...) as visit}`). This mutates the reactive array in place *during render*, which re-triggers reactivity on every call and causes an infinite update loop (symptom: the page looks stuck on a loading spinner, with no console error and no failed network request — `svelte-check` won't catch it either, since it's a runtime behavior bug, not a type error). It only manifests when the array is non-empty, so it's easy to miss if you only test with empty-state data. Always sort/reverse/splice a copy instead, ideally precomputed as its own `$derived` in `<script>` rather than inline in the template, e.g. `const sortedVisits = $derived([...pet.visits].sort(...))`.

## Cross-cutting

- Backend is the source of truth for the API contract: server generates OpenAPI at `/api/v1/public/docs`, client codegens types from it. Change server DTOs/routes first, then resync client types.
- Per-resource layout is symmetric across both apps: `owner`, `pet`, `vet`, `visit` (+`pet-type`, `specialty`) each have their own controller/service/repository (server) and controller/form/route (client).

## Domain model

Six entities, schema defined in `server/src/main/resources/db/changelog/changesets/202507101200-PRD-initial-schema.xml`:

- **`owners`** (`id`, `first_name`, `last_name`, `address`, `city`, `telephone`) — `1:N` → `pets` (FK `pets.owner_id`, cascade-all, eager-fetched on `Owner`).
- **`pets`** (`id`, `name`, `birth_date`, `type_id` FK → `pet_types`, `owner_id` FK → `owners`) — `N:1` to `Owner` and `PetType`, `1:N` → `visits` (cascade-all, eager).
- **`pet_types`** (`id`, `name`) — lookup table (e.g. Cat, Dog, Lizard). Seed IDs 1–6.
- **`visits`** (`id`, `pet_id` FK → `pets`, `date`, `description`) — always belongs to exactly one pet.
- **`vets`** (`id`, `first_name`, `last_name`) — `M:N` ↔ `specialties` via junction table `vet_specialties` (`vet_id`, `specialty_id`, both `ON DELETE CASCADE`), mapped with `@ManyToMany`/`@JoinTable` on `Vet`, eager-fetched.
- **`specialties`** (`id`, `name`) — lookup table (e.g. Radiology, Surgery, Dentistry). Seed IDs 1–3.

All relationships are `FetchType.EAGER` — there's no lazy-loading/`N+1` concern to manage here, but it also means eg. fetching an `Owner` always pulls all their `Pet`s (and each `Pet`'s `Visit`s) in one go. Entities never expose themselves directly over HTTP — every controller maps entity → response DTO via a MapStruct `*Mapper`, and every write path takes a `Create*Request`/`Update*Request` DTO rather than binding entities from the request body.

## Adding a new feature end-to-end

Server first, client second — never hand-edit generated client types. For a brand-new resource, touch these in order (skip whichever don't apply for a smaller change like a new field or filter on an existing resource):

1. **Schema**: new Liquibase changeset under `db/changelog/changesets/`, registered in `db.changelog-master.yaml`. Respect reserved seed ID ranges (vets 1–6, pet types 1–6, specialties 1–3) if adding `tst`-context seed rows.
2. **Paths**: add constants to `api/Paths.java` (`THING`, `THING_BY_ID`, plus any nested variant), don't hardcode path strings in controllers/tests.
3. **`model/`**: `Thing.java` (JPA entity), `request/Create-`/`UpdateThingRequest.java`, `response/ThingResponse.java`, `mapper/ThingMapper.java` (MapStruct, `@Mapper(config = SharedMapperConfig.class)`), and `validator/ThingValidator.java` if you want manual field validation (not every resource has one — check the existing domain closest to what you're building before assuming the pattern).
4. **`repository/ThingRepository.java`**: `JpaRepository<Thing, Integer>` + derived query methods.
5. **Error codes**: add to `common/exception/ApiErrorCode.java` for anything thrown as `DataNotFoundException`.
6. **`service/ThingService.java`**: `@Service`, `@RequiredArgsConstructor`, `@Transactional` methods (`readOnly = true` for reads).
7. **`controller/ThingController.java`**: `@RestController`, standard CRUD mappings using the `Paths` constants — validator (if any) → service → mapper.
8. **Tests** (write alongside each layer, not after): unit test extending `support/UnitTest.java` for the service (mock the repository), integration test extending `support/IntegrationTest.java` for the controller (add `aSavedThing()`/`aCreateThingRequest()`/`anUpdateThingRequest()` factories there, and extend `cleanDatabase()` if the new table needs cleanup between tests).
9. **Verify**: `./gradlew check` (tests + Checkstyle + PMD + SpotBugs + CodeNarc + Spotless). Note this reformats code in place via `spotlessApply` on every compile.

There is no true end-to-end test in this repo — no Playwright/Cypress/browser automation, and the server's "integration" tests are backend-only (MockMvc's `webAppContextSetup` simulates the servlet dispatcher in-process; even though `@SpringBootTest` boots on `RANDOM_PORT`, no real HTTP socket is used). Testing "end-to-end" here means: unit test the service, integration test the controller — nothing exercises the SvelteKit client against a real running backend.

## When backend endpoints/DTOs change

The client's `src/lib/types/api.d.ts` is generated and will drift out of sync the moment you change a controller route or request/response DTO. After any such server change:

1. Start the backend for real: `./gradlew bootRun` (don't use `bun run sync:api` — its health-check URL is broken, see the Server section above).
2. Confirm it's up by polling the correct health URL yourself: `curl http://localhost:8080/api/v1/public/actuator/health`.
3. From `client/`: `bun run download:api` (re-fetches `server/openapi.json` from `/api/v1/public/docs`) then `bun run generate:api` (regenerates `src/lib/types/api.d.ts` via `openapi-typescript`).
4. **Check the diff of `api.d.ts`** — confirm the new/changed route appears under `paths` and the new/changed schema appears under `components['schemas']`. If it's missing, the backend either didn't restart with your changes or the route/DTO isn't wired up correctly — don't proceed until it shows up here.
5. Update `client/src/lib/api/models.ts` to re-export any new/changed schema types under their friendly names.
6. Update or add the relevant `client/src/lib/api/<resource>/<Resource>Controller.ts` functions to match.
7. `bun run check` to typecheck the whole client against the new types.

Stop the backend (`./gradlew --stop` to kill Gradle daemons too) once done — H2 is in-memory, so nothing is lost by stopping it.


## Workflow

When I tell you a feature is complete:

1. Move the story from `.opencode/refined/` to `.opencode/completed/`
2. Prepend the date to the filename (e.g., `20260226-theme-selector.md`)
3. Add a row to `.opencode/CHANGELOG.md`
