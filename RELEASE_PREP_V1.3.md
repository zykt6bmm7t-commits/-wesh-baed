# وش بعد؟ — v1.3 Final Release Preparation

Status: PREPARED — NOT MERGED — NOT DEPLOYED TO PRODUCTION

## Frozen Release Candidate
- Branch: `dev-v1.3-business`
- RC: `v1.3 RC1`
- RC commit: `1fb7a0cd811166898b62483d8dc41f92da3e75ec`
- Current production/main baseline: `eaf255e6e2bd070f3f61f467028deba60b68e2ce` (`v1.2.3`)
- RC Acceptance Gate: PASS
- Final Dev Gate: PASS

## RC Counts
- Nodes: 183
- Options: 597
- Results: 237
- Sources: 104
- Embedded tests: 199 / 199 marked PASS

## v1.3 Scope
### Business API
- Development Worker and D1 integration.
- Event analytics.
- User feedback endpoint with 1–5 star ratings and helpful / not-helpful signal.
- Support ticket endpoint.
- Turnstile verification enforced with bypass disabled.

### Admin Dashboard
- Secure admin login using username and independent password.
- 12-hour signed admin session cookie.
- HttpOnly + Secure + SameSite=Strict session cookie.
- Logout and session invalidation.
- Overview analytics.
- Feedback viewer.
- Support ticket viewer.
- Ticket search, filters, sorting, and status workflow.
- New / in-progress / closed counters and new-ticket highlighting.

### User UI
- Visible star rating selection.
- Visible helpful / not-helpful selection.
- Feedback submission status.
- Support / suggestion submission.
- Mobile-compatible Turnstile challenge handling.

## Security Acceptance
- Invalid admin credentials rejected.
- Admin endpoints reject unauthenticated access.
- Admin session cookie flags verified.
- Turnstile secret configured.
- Turnstile bypass disabled.
- Feedback without Turnstile token rejected.
- Support without Turnstile token rejected.
- Health check PASS.
- Business Security Gate PASS.
- Admin Session Gate PASS.

## Files introduced or changed versus current main
- `.github/workflows/deploy-business-dev.yml`
- `BUSINESS_V1.3_PLAN.md`
- `business/README.md`
- `business/admin/index.html`
- `business/client/business-client.js`
- `business/migrations/0001_business_core.sql`
- `business/package.json`
- `business/worker/src/index.js`
- `business/wrangler.jsonc`
- `business/wrangler.jsonc.example`
- `index.html`

## Planned FINAL metadata change only
When final approval is given, the RC-to-FINAL application change must be limited to release metadata in `index.html`:
- Visible badge: `v1.3 RC1` → `v1.3 FINAL`
- `release_channel`: `RELEASE_CANDIDATE` → `FINAL`
- `release_name`: `v1.3 RC1` → `v1.3 Final`
- `version`: `v1.3-rc.1` → `v1.3.0`

No questions, options, results, sources, routing logic, CSS behavior, Business API logic, D1 schema, Turnstile behavior, or admin-auth behavior should change during final promotion.

## Planned Release Identity
- Git tag: `v1.3.0`
- GitHub Release title: `وش بعد؟ v1.3 FINAL`
- Release type: stable / non-prerelease

## Final Promotion Sequence — NOT EXECUTED
1. Reconfirm RC HEAD and acceptance status.
2. Apply metadata-only FINAL commit on development branch.
3. Verify metadata-only diff.
4. Run final release gate.
5. Merge to `main` only after explicit approval.
6. Deploy Production only after explicit approval.
7. Run post-deploy production smoke gate.
8. Create tag `v1.3.0` on the verified final production commit.
9. Publish GitHub Release `وش بعد؟ v1.3 FINAL`.

## Protected Production
This preparation does not authorize or perform:
- merge to `main`
- Production Worker deployment
- changes to `bayyinah`
- tag creation
- GitHub Release publication
