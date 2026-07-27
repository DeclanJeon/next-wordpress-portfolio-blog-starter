#!/usr/bin/env python3
"""Mirror an approved/published WordPress post into the public Next.js SQLite DB.

Option A public path:
  WP draft (writer) -> human approve/publish -> this mirror -> blog.ponslink.com

Designed for server use against:
  /opt/ponslink-blog-next/shared/db/custom.db
  /var/www/blog.ponslink.com (wp-cli)

Does not auto-publish. Caller must supply a WP post that is already published
(or pass --publish-with-wp-cli as an explicit admin action for canaries).
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import sqlite3
import subprocess
import sys
import uuid
from pathlib import Path

AUTHOR_ID = "ponslink-content"
AUTHOR_NAME = "PonsLink"
DEFAULT_TAXONOMY_SLUG = "operation-note/blog-ops"
DEFAULT_CATEGORY = "운영 노트"
DEFAULT_COVER = "/tistory/core-story/imagegen-covers/2026-06-29-main-ponslink-03-state-resync-cover-imagegen.webp"
WP_PATH = "/var/www/blog.ponslink.com"
DEFAULT_DB = "/opt/ponslink-blog-next/shared/db/custom.db"


def _run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    return result.stdout


def wp_json(fields: str, post_id: int) -> dict:
    raw = _run(
        [
            "sudo",
            "-u",
            "www-data",
            "wp",
            f"--path={WP_PATH}",
            "post",
            "get",
            str(post_id),
            f"--fields={fields}",
            "--format=json",
        ]
    )
    return json.loads(raw)


def wp_meta(post_id: int, key: str) -> str:
    try:
        return _run(
            [
                "sudo",
                "-u",
                "www-data",
                "wp",
                f"--path={WP_PATH}",
                "post",
                "meta",
                "get",
                str(post_id),
                key,
            ]
        ).strip()
    except subprocess.CalledProcessError:
        return ""


def estimate_reading_time(content: str) -> int:
    text = re.sub(r"<[^>]+>", " ", content)
    text = re.sub(r"\s+", " ", text).strip()
    hangul = len(re.findall(r"[\uac00-\ud7af]", text))
    latin = len(re.findall(r"\b[A-Za-z][A-Za-z0-9'’.-]*\b", text))
    minutes = hangul / 550.0 + latin / 220.0
    return max(1, int(round(minutes)) or 1)

def html_to_markdown(content: str) -> str:
    """Convert the small HTML subset produced by WP ingest into markdown for ReactMarkdown."""

    text = content.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"(?is)<script[^>]*>.*?</script>", "", text)
    text = re.sub(r"(?is)<style[^>]*>.*?</style>", "", text)
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?is)</p\s*>", "\n\n", text)
    text = re.sub(r"(?is)<p[^>]*>", "", text)
    text = re.sub(r"(?is)<strong[^>]*>(.*?)</strong>", r"**\1**", text)
    text = re.sub(r"(?is)<b[^>]*>(.*?)</b>", r"**\1**", text)
    text = re.sub(r"(?is)<em[^>]*>(.*?)</em>", r"*\1*", text)
    text = re.sub(r"(?is)<i[^>]*>(.*?)</i>", r"*\1*", text)
    text = re.sub(r"(?is)<h2[^>]*>(.*?)</h2>", r"## \1\n\n", text)
    text = re.sub(r"(?is)<h3[^>]*>(.*?)</h3>", r"### \1\n\n", text)
    text = re.sub(r"(?is)<a[^>]*href=\"([^\"]+)\"[^>]*>(.*?)</a>", r"[\2](\1)", text)
    text = re.sub(r"(?is)<li[^>]*>(.*?)</li>", r"- \1\n", text)
    text = re.sub(r"(?is)</?(ul|ol)[^>]*>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = (
        text.replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&#39;", "'")
    )
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text



def html_to_excerpt(content: str, limit: int = 180) -> str:
    text = re.sub(r"<[^>]+>", " ", content)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def normalize_slug(slug: str, title: str) -> str:
    value = (slug or "").strip().lower()
    if not value:
        value = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    # Public posts use dated slugs; keep WP slug if already unique-looking.
    if not re.match(r"^\d{4}-\d{2}-\d{2}-", value):
        day = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d")
        value = f"{day}-{value}"
    return value[:200]


def ensure_author(conn: sqlite3.Connection) -> None:
    row = conn.execute('SELECT id FROM "User" WHERE id = ?', (AUTHOR_ID,)).fetchone()
    if row:
        return
    now = _iso_now()
    conn.execute(
        '''INSERT INTO "User" (id, username, displayName, passwordHash, role, bio, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
        (AUTHOR_ID, "ponslink", AUTHOR_NAME, "mirrored-no-login", "writer", "", now, now),
    )


def taxonomy_id(conn: sqlite3.Connection, slug: str) -> str:
    row = conn.execute('SELECT id FROM "TaxonomyNode" WHERE slug = ?', (slug,)).fetchone()
    if not row:
        raise SystemExit(f"taxonomy not found: {slug}")
    return str(row[0])


def _iso_now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_wp_datetime(value: str | None) -> str:
    if not value or value.startswith("0000"):
        return _iso_now()
    # WP returns "YYYY-MM-DD HH:MM:SS"
    try:
        parsed = dt.datetime.strptime(value, "%Y-%m-%d %H:%M:%S").replace(tzinfo=dt.timezone.utc)
        return parsed.isoformat().replace("+00:00", "Z")
    except ValueError:
        return _iso_now()


def mirror_post(
    *,
    db_path: Path,
    post_id: int,
    taxonomy_slug: str,
    category: str,
    featured_image: str,
    require_published: bool,
    dry_run: bool,
) -> dict:
    post = wp_json(
        "ID,post_title,post_name,post_status,post_content,post_excerpt,post_date_gmt,post_modified_gmt",
        post_id,
    )
    status = str(post.get("post_status") or "")
    if require_published and status != "publish":
        raise SystemExit(f"WP post {post_id} status is {status!r}; publish before mirror or pass --allow-draft")

    qa = wp_meta(post_id, "_ponslink_automation_qa_status")
    title = str(post.get("post_title") or "").strip()
    content = html_to_markdown(str(post.get("post_content") or "").strip())
    excerpt = str(post.get("post_excerpt") or "").strip() or html_to_excerpt(content)
    slug = normalize_slug(str(post.get("post_name") or ""), title)
    published_at = parse_wp_datetime(post.get("post_date_gmt"))
    updated_at = parse_wp_datetime(post.get("post_modified_gmt"))
    reading_time = estimate_reading_time(content)
    tags = "OptionA,Automation,Cloudflare,Privacy,Network"
    post_pk = f"wp-{post_id}-{hashlib.sha1(slug.encode()).hexdigest()[:10]}"

    payload = {
        "wp_post_id": post_id,
        "wp_status": status,
        "qa_status": qa,
        "id": post_pk,
        "slug": slug,
        "title": title,
        "excerpt": excerpt,
        "content_chars": len(content),
        "category": category,
        "taxonomy_slug": taxonomy_slug,
        "featuredImage": featured_image,
        "readingTime": reading_time,
        "publishedAt": published_at,
        "status": "published" if status == "publish" else "draft",
    }
    if dry_run:
        return payload

    conn = sqlite3.connect(db_path)
    try:
        conn.execute("PRAGMA foreign_keys = ON")
        ensure_author(conn)
        tax_id = taxonomy_id(conn, taxonomy_slug)
        existing = conn.execute('SELECT id FROM "Post" WHERE slug = ?', (slug,)).fetchone()
        now = _iso_now()
        if existing:
            post_pk = str(existing[0])
            conn.execute(
                '''UPDATE "Post"
                   SET title=?, excerpt=?, content=?, category=?, tags=?, coverColor=?, featuredImage=?,
                       status=?, readingTime=?, authorId=?, authorName=?, publishedAt=?, updatedAt=?
                   WHERE id=?''',
                (
                    title,
                    excerpt,
                    content,
                    category,
                    tags,
                    "#0f172a",
                    featured_image,
                    payload["status"],
                    reading_time,
                    AUTHOR_ID,
                    AUTHOR_NAME,
                    published_at,
                    now,
                    post_pk,
                ),
            )
        else:
            conn.execute(
                '''INSERT INTO "Post" (
                     id, slug, title, excerpt, content, category, tags, coverColor, featuredImage,
                     status, readingTime, views, authorId, authorName, publishedAt, createdAt, updatedAt
                   ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                (
                    post_pk,
                    slug,
                    title,
                    excerpt,
                    content,
                    category,
                    tags,
                    "#0f172a",
                    featured_image,
                    payload["status"],
                    reading_time,
                    0,
                    AUTHOR_ID,
                    AUTHOR_NAME,
                    published_at,
                    now,
                    now,
                ),
            )
        conn.execute('DELETE FROM "PostTaxonomy" WHERE postId = ? AND role = ?', (post_pk, "primary"))
        conn.execute(
            '''INSERT INTO "PostTaxonomy" (id, postId, nodeId, role, sortOrder)
               VALUES (?, ?, ?, 'primary', 0)''',
            (str(uuid.uuid4()).replace("-", "")[:25], post_pk, tax_id),
        )
        conn.commit()
        payload["id"] = post_pk
        payload["mirrored"] = True
        return payload
    finally:
        conn.close()


def publish_with_wp_cli(post_id: int) -> None:
    """Admin canary helper: mark QA approved and publish outside automation API gates.

    MU plugin `ponslink_automation_enforce_publish_boundary` blocks publish unless
    `$GLOBALS['ponslink_automation_publish_permit_post_id']` matches the post id.
    """

    _run(
        [
            "sudo",
            "-u",
            "www-data",
            "wp",
            f"--path={WP_PATH}",
            "post",
            "meta",
            "update",
            str(post_id),
            "_ponslink_automation_qa_status",
            "approved",
            "--user=3",
        ]
    )
    php = (
        f"$post_id = {int(post_id)};\n"
        "$GLOBALS['ponslink_automation_publish_permit_post_id'] = $post_id;\n"
        "$now = gmdate('Y-m-d H:i:s');\n"
        "$result = wp_update_post(array(\n"
        "  'ID' => $post_id,\n"
        "  'post_status' => 'publish',\n"
        "  'post_date' => get_date_from_gmt($now),\n"
        "  'post_date_gmt' => $now,\n"
        "  'edit_date' => true,\n"
        "), true);\n"
        "if (is_wp_error($result)) {\n"
        "  fwrite(STDERR, $result->get_error_message() . PHP_EOL);\n"
        "  exit(1);\n"
        "}\n"
        "$status = get_post_status($post_id);\n"
        "if ($status !== 'publish') {\n"
        "  fwrite(STDERR, \"publish failed, status={$status}\\n\");\n"
        "  exit(2);\n"
        "}\n"
        "echo $status;\n"
    )
    _run(
        [
            "sudo",
            "-u",
            "www-data",
            "wp",
            f"--path={WP_PATH}",
            "eval",
            php,
            "--user=3",
        ]
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--post-id", type=int, required=True)
    parser.add_argument("--db", default=DEFAULT_DB)
    parser.add_argument("--taxonomy-slug", default=DEFAULT_TAXONOMY_SLUG)
    parser.add_argument("--category", default=DEFAULT_CATEGORY)
    parser.add_argument("--featured-image", default=DEFAULT_COVER)
    parser.add_argument("--publish-with-wp-cli", action="store_true")
    parser.add_argument("--allow-draft", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    if args.publish_with_wp_cli:
        publish_with_wp_cli(args.post_id)

    result = mirror_post(
        db_path=Path(args.db),
        post_id=args.post_id,
        taxonomy_slug=args.taxonomy_slug,
        category=args.category,
        featured_image=args.featured_image,
        require_published=not args.allow_draft,
        dry_run=args.dry_run,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
