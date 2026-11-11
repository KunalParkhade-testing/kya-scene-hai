# Write for Us

## Status

Future feature proposal only. This document records product requirements and does not implement a page, database schema, editor role, or submission workflow.

## Purpose

Create a **Write for Us** page and a writer account experience where an eligible contributor can request access, provide information for identification and verification, and then submit articles. The wider future upgrade will refurbish the admin, editor, and writer pages as one consistent editorial workflow.

## Who may submit

- A person must be explicitly authorized by an admin before receiving writer access.
- Authorization is a one-time approval for the person, not a per-article approval. After approval, a separate writer account is created for them; while that account remains authorized, they can submit future articles directly without asking an admin to authorize each submission.
- A public visitor must not be able to submit an article or create editor access by completing this page.
- Authorization must be checked by the server against trusted account metadata or an equivalent server-managed role/approval record. A form field, client-side state, or self-declared role is not proof of authorization.
- Admins remain responsible for granting and revoking access. Losing authorization must remove the ability to submit or manage articles.
- An authorized writer with editor access may publish their own article directly; each article must still be explicitly published by its writer rather than becoming public just because it was submitted.

## Proposed page and workflow

1. A prospective writer uses **Write for Us** to provide the required identification, contact, experience, and proposed contribution details for admin review.
2. An admin verifies the request and either declines it or authorizes the person.
3. When authorized, the system provisions a separate writer account and links it to an approved public writer profile. Account setup and recovery should use a secure invite or sign-in process rather than exposing credentials.
4. The writer signs in to their account and can submit future articles directly, without repeating the initial authorization process for every article.
5. Each article is linked to its submitting writer account and appears automatically in that writer's account and public profile when appropriate.
6. The authorized writer can edit and directly publish their own article from their account. Submission alone does not publish it; the writer chooses when to publish.

## Information to collect

Collect only what is needed to identify the contributor, verify their authorization and assess the submission. Explain why each required field is collected.

### Contributor identity and contact

- Legal or professional name, as appropriate for editorial records.
- Preferred public byline; allow a pseudonym where editorial policy permits.
- Contact email, preferably taken from the verified signed-in account; provide a way to confirm or update it.
- Short biography for the public writer profile, with any separate private contact or verification details kept out of the public profile.
- Optional location/time zone if useful for coordination.
- Optional profile, portfolio, or professional links.

### Authorization and experience

- The authenticated writer account identifier, captured by the server rather than entered by the contributor and linked to the writer's submitted articles.
- Relevant expertise, experience, or connection to the proposed topic.
- Links to prior writing or other relevant work, if available.
- Relevant affiliations and potential conflicts of interest for the proposed article.
- A confirmation that the submitted identity and experience details are accurate and that the writer will disclose material conflicts.

Admin authorization should be verified from trusted account/access records, not by asking the writer to upload proof of a role that the system can check. Do not request government ID, financial details, or other highly sensitive personal information by default. If a genuine legal or operational need for such information is established later, define a separate secure verification process, access limits, retention period, and deletion procedure before collecting it.

### Article proposal or draft

- Working headline and concise pitch.
- Why the story fits Kya Scene Hai? and what readers should understand.
- Intended audience, key claims, and likely sources or supporting links.
- Optional outline or complete draft, with a clear indication of what has been submitted.
- Disclosure of AI assistance, reused material, commissioned work, or other matters required by the future editorial policy.
- Confirmation that the writer has the rights needed to submit the material and that factual claims and sources can be checked.

## Review and access controls

- Keep contributor details and submissions private; do not expose them on public pages or in public APIs.
- A writer account is created only after an admin authorizes the person. The approved writer uses that account for subsequent article submissions.
- Make the writer's public profile discoverable to readers for transparency. Show the approved bio and the writer's published article cards; never expose private identity, contact, or verification records.
- Automatically associate each article with its writer account so the writer's account lists all of their articles without manual profile updates. Keep drafts and other unpublished work private to the writer and admins; show only published articles on the public profile.
- Enforce per-article ownership: only an admin or the writer who owns that specific article may edit or delete it. No other editor or writer may edit or delete another writer's article. Apply this rule on the server and in database policies, not only by hiding UI controls.
- Restrict access to private contributor details and submissions to admins and explicitly authorized reviewers who need the information for review.
- Record who submitted, when it was submitted, its review status, and material status changes.
- Let the writer choose for each article whether their name appears as the article byline. This choice controls article attribution, not the existence or transparency of their public writer account and profile.
- Define statuses for initial access requests, such as **Pending review**, **More information requested**, **Authorized**, and **Declined**. Decide whether optional editorial review is available before a writer publishes.
- Provide an appropriate way to correct contributor details and request removal, subject to legitimate editorial-record and legal needs.
- Establish retention and deletion rules for declined pitches, abandoned drafts, and verification details before launch.
- Use server-side authorization and database policies so unauthorized accounts cannot read, create, or alter submissions by calling an endpoint directly.
- Refurbish the admin, editor, and writer pages together to support account authorization, writer profiles, article ownership, submissions, and editorial management.

## Decisions required before implementation

- Whether writers submit pitches, complete drafts, or either, and whether optional editorial review is offered before direct publication.
- How admins grant/revoke authorization and how the separate writer account is provisioned, recovered, and disabled.
- Which identity fields are mandatory, what qualifies as sufficient verification, and what approved information appears on the public profile.
- Whether pseudonymous public profiles/bylines are allowed, and how the per-article byline choice works when attribution is omitted.
- Who can review submissions and whether contributors receive status notifications.
- How admins handle ownership if an account is revoked, transferred, or deleted while its articles remain published.
- Editorial policies for attribution, revisions, compensation, exclusivity, rights/licensing, conflicts, AI assistance, and withdrawal.
- Data retention, deletion, privacy notice, and any applicable legal requirements.

## Not included in this proposal

- Public self-registration or open public article submissions.
- Automatic acceptance, publication, or assignment of editor permissions.
- Collection of government identification documents as a default verification step.
